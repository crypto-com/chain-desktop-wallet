import { WebviewTag } from 'electron';
import { useCallback, useEffect, useRef } from 'react';
import { TransactionConfig } from 'web3-eth';
import { useRecoilValue } from 'recoil';
import { TransactionPrepareService } from '../../../../service/TransactionPrepareService';
import { walletService } from '../../../../service/WalletService';
import { ChainConfig } from './config';
import { DappBrowserIPC } from './types';
import { evmTransactionSigner } from '../../../../service/signers/EvmTransactionSigner';
import { EVMContractCallUnsigned } from '../../../../service/signers/TransactionSupported';
import { walletAllAssetsState } from '../../../../recoil/atom';
import { getCronosAsset } from '../../../../utils/utils';

export const ProviderPreloadScriptPath =
  'file:///Users/xinyu/Developer/cro/chain-desktop-wallet/src/pages/settings/tabs/DappBrowser/preload.js';

type WebView = WebviewTag & HTMLWebViewElement;

type ErrorHandler = (reason: string) => void;

interface IUseIPCProviderProps {
  webview: WebView | null;
  onRequestAddress: (onSuccess: (address: string) => void, onError: ErrorHandler) => Promise<void>;
  onRequestSendTransaction: (
    event: DappBrowserIPC.SendTransactionEvent,
    onSuccess: (passphrase: string) => void,
    onError: ErrorHandler,
  ) => Promise<void>;
  onSignMessage: (
    event: DappBrowserIPC.SignMessageEvent,
    onSuccess: (signedMessage: string) => void,
    onError: ErrorHandler,
  ) => Promise<void>;
  onSignPersonalMessage: (
    event: DappBrowserIPC.SignPersonalMessageEvent,
    onSuccess: (signedMessage: string) => void,
    onError: ErrorHandler,
  ) => Promise<void>;
  onSignTypedMessage: (
    event: DappBrowserIPC.SignTypedMessageEvent,
    onSuccess: (signedMessage: string) => void,
    onError: ErrorHandler,
  ) => Promise<void>;
  onEcRecover: (
    event: DappBrowserIPC.EcrecoverEvent,
    onSuccess: (address: string) => void,
    onError: ErrorHandler,
  ) => Promise<void>;
  onWatchAsset: (
    event: DappBrowserIPC.WatchAssetEvent,
    onSuccess: () => void,
    onError: ErrorHandler,
  ) => Promise<void>;
  onAddEthereumChain: (
    event: DappBrowserIPC.AddEthereumChainEvent,
    onSuccess: () => void,
    onError: ErrorHandler,
  ) => Promise<void>;
}

const useRefCallback = (fn: Function) => {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  return fnRef;
};

export const useIPCProvider = (props: IUseIPCProviderProps) => {
  const { webview } = props;

  const transactionPrepareService = new TransactionPrepareService(walletService.storageService);
  const allAssets = useRecoilValue(walletAllAssetsState);
  const cronosAsset = getCronosAsset(allAssets);

  const executeJavScript = useCallback(
    (script: string) => {
      webview?.executeJavaScript(
        `
        (function() {
            ${script}
        })();
        `,
      );
    },
    [webview],
  );

  const injectDomReadyScript = useCallback(() => {
    if (!webview) {
      return;
    }
    executeJavScript(
      `
            var config = {
                chainId: ${ChainConfig.chainId},
                rpcUrl: "${ChainConfig.rpcUrl}",
                isDebug: true
            };
            window.ethereum = new window.desktopWallet.Provider(config);
            window.web3 = new window.desktopWallet.Web3(window.ethereum);
            console.log(window.ethereum);
        `,
    );
  }, [webview]);

  const sendError = (id: number, error: string) => {
    executeJavScript(`
        window.ethereum.sendError(${id}, "${error}")
    `);
  };

  const sendResponse = (id: number, response: string) => {
    executeJavScript(`
        window.ethereum.sendResponse(${id}, "${response}")
    `);
  };

  const sendResponses = (id: number, responses: string[]) => {
    const script = responses.map(r => `'${r}'`).join(',');
    executeJavScript(`
        window.ethereum.sendResponse(${id}, [${script}])
    `);
  };

  const handleRequestAccounts = useRefCallback((id: number, address: string) => {
    executeJavScript(
      `
          window.ethereum.setAddress("${address}");
        `,
    );
    sendResponses(id, [address]);
  });

  const handleSendTransaction = useRefCallback(
    async (event: DappBrowserIPC.SendTransactionEvent, passphrase: string) => {
      const prepareTXConfig: TransactionConfig = {
        from: event.object.from,
        to: event.object.to,
      };

      const prepareTxInfo = await transactionPrepareService.prepareEVMTransaction(
        cronosAsset!,
        prepareTXConfig,
      );

      const txConfig: EVMContractCallUnsigned = {
        from: event.object.from,
        contractAddress: event.object.to,
        data: event.object.data,
        gasLimit: String(event.object.gas),
        gasPrice: event.object.gasPrice,
        nonce: prepareTxInfo.nonce,
      };
      const result = await evmTransactionSigner.signTransaction(txConfig, passphrase);

      sendResponse(event.id, result);
    },
  );

  const listenIPCMessages = () => {
    if (!webview) {
      return;
    }

    webview.addEventListener('ipc-message', async e => {
      const { channel, args } = e;

      if (channel !== DappBrowserIPC.ChannelName) {
        return;
      }

      if (args?.length < 1) {
        return;
      }

      const event: DappBrowserIPC.Event = args[0];

      switch (event.name) {
        case 'requestAccounts':
          props.onRequestAddress(
            address => {
              handleRequestAccounts.current(event.id, address);
            },
            reason => {
              sendError(event.id, reason);
            },
          );
          break;
        case 'signTransaction':
          props.onRequestSendTransaction(
            event,
            passphrase => {
              handleSendTransaction.current(event, passphrase);
            },
            reason => {
              sendError(event.id, reason);
            },
          );
          break;
        case 'signMessage':
          break;
        case 'signPersonalMessage':
          break;
        case 'signTypedMessage':
          break;
        case 'ecRecover':
          break;
        case 'watchAsset':
          break;
        case 'addEthereumChain':
          break;
        default:
          break;
      }
    });
  };

  const setupIPC = () => {
    if (!webview) {
      return;
    }

    listenIPCMessages();

    webview.addEventListener('dom-ready', () => {
      // TODO: remove later
      injectDomReadyScript();
      webview.openDevTools();
    });
  };

  useEffect(() => {
    setupIPC();
  }, [webview]);
};
