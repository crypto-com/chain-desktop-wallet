import { WebviewTag } from 'electron';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { TransactionConfig } from 'web3-eth';
import { useRecoilValue } from 'recoil';
import Web3 from 'web3';
import { ethers } from 'ethers';
import { TransactionPrepareService } from '../../../service/TransactionPrepareService';
import { walletService } from '../../../service/WalletService';
import { ChainConfig } from './config';
import { DappBrowserIPC } from '../types';
import { evmTransactionSigner } from '../../../service/signers/EvmTransactionSigner';
import { EVMContractCallUnsigned } from '../../../service/signers/TransactionSupported';
import { walletAllAssetsState } from '../../../recoil/atom';
import { getCronosAsset } from '../../../utils/utils';
import { TokenApprovalRequestData, TransactionDataParser } from './TransactionDataParser';

const { shell } = window.require('electron');

type WebView = WebviewTag & HTMLWebViewElement;

export type ErrorHandler = (reason: string) => void;

interface IUseIPCProviderProps {
  webview: WebView | null;
  onRequestAddress: (onSuccess: (address: string) => void, onError: ErrorHandler) => void;
  onRequestTokenApproval: (
    event: { request: TokenApprovalRequestData; gas: number; gasPrice: string },
    onSuccess: (amount: string) => void,
    onError: ErrorHandler,
  ) => void;
  onRequestSendTransaction: (
    event: DappBrowserIPC.SendTransactionEvent,
    onSuccess: (passphrase: string) => void,
    onError: ErrorHandler,
  ) => Promise<void>;
  onRequestSignMessage: (
    event: DappBrowserIPC.SignMessageEvent,
    onSuccess: (passphrase: string) => void,
    onError: ErrorHandler,
  ) => Promise<void>;
  onRequestSignPersonalMessage: (
    event: DappBrowserIPC.SignPersonalMessageEvent,
    onSuccess: (passphrase: string) => void,
    onError: ErrorHandler,
  ) => Promise<void>;
  onRequestSignTypedMessage: (
    event: DappBrowserIPC.SignTypedMessageEvent,
    onSuccess: (passphrase: string) => void,
    onError: ErrorHandler,
  ) => Promise<void>;
  onRequestEcRecover: (
    event: DappBrowserIPC.EcrecoverEvent,
    onSuccess: (address: string) => void,
    onError: ErrorHandler,
  ) => Promise<void>;
  onRequestWatchAsset: (
    event: DappBrowserIPC.WatchAssetEvent,
    onSuccess: () => void,
    onError: ErrorHandler,
  ) => Promise<void>;
  onRequestAddEthereumChain: (
    event: DappBrowserIPC.AddEthereumChainEvent,
    onSuccess: () => void,
    onError: ErrorHandler,
  ) => Promise<void>;
}

export function useRefCallback(fn: Function) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  return fnRef;
}

export const useIPCProvider = (props: IUseIPCProviderProps) => {
  const { webview } = props;

  const transactionPrepareService = new TransactionPrepareService(walletService.storageService);
  const allAssets = useRecoilValue(walletAllAssetsState);
  const cronosAsset = getCronosAsset(allAssets);
  const transactionDataParser = useMemo(() => {
    return new TransactionDataParser(ChainConfig.RpcUrl, ChainConfig.ExplorerAPIUrl);
  }, []);

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

  // const injectDomReadyScript = useCallback(() => {
  //   executeJavScript(
  //     `
  //           var config = {
  //               chainId: ${ChainConfig.chainId},
  //               rpcUrl: "${ChainConfig.rpcUrl}",
  //               isDebug: true
  //           };
  //           window.ethereum = new window.desktopWallet.Provider(config);
  //           window.web3 = new window.desktopWallet.Web3(window.ethereum);
  //       `,
  //   );
  // }, [webview]);

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
      const result = await evmTransactionSigner.sendContractCallTransaction(
        txConfig,
        passphrase,
        ChainConfig.RpcUrl,
      );

      sendResponse(event.id, result);
    },
  );

  const handleSignMessage = useRefCallback(
    async (eventId: number, data: string, passphrase: string, addPrefix: boolean) => {
      const wallet = ethers.Wallet.fromMnemonic(passphrase);
      if (addPrefix) {
        const result = await wallet.signMessage(ethers.utils.arrayify(data));
        sendResponse(eventId, result);
      } else {
        // deprecated
      }
    },
  );

  // const handleSignTypedMessage = useRefCallback(
  //   async (event: DappBrowserIPC.SignTypedMessageEvent, passphrase: string) => {},
  // );

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
          // parse transaction data

          if (event.object.data.startsWith('0x095ea7b3')) {
            const response = await transactionDataParser.parseTokenApprovalData(
              event.object.to,
              event.object.data,
            );
            props.onRequestTokenApproval(
              {
                request: response,
                gas: event.object.gas,
                gasPrice: event.object.gasPrice,
              },
              () => {
                // TODO: deal with amount
              },
              reason => {
                sendError(event.id, reason);
              },
            );
          } else {
            props.onRequestSendTransaction(
              event,
              passphrase => {
                handleSendTransaction.current(event, passphrase);
              },
              reason => {
                sendError(event.id, reason);
              },
            );
          }

          break;
        case 'signMessage':
          props.onRequestSignMessage(
            event,
            passphrase => {
              handleSignMessage.current(event.id, event.object.data, passphrase, false);
            },
            reason => {
              sendError(event.id, reason);
            },
          );
          break;
        case 'signPersonalMessage':
          props.onRequestSignPersonalMessage(
            event,
            passphrase => {
              handleSignMessage.current(event.id, event.object.data, passphrase, true);
            },
            reason => {
              sendError(event.id, reason);
            },
          );
          break;
        case 'signTypedMessage':
          props.onRequestSignTypedMessage(
            event,
            () => {
              // handleSignTypedMessage.current(event, passphrase);
            },
            reason => {
              sendError(event.id, reason);
            },
          );
          break;
        case 'ecRecover':
          props.onRequestEcRecover(
            event,
            () => {
              new Web3('').eth.personal
                .ecRecover(event.object.message, event.object.signature)
                .then(
                  result => {
                    sendResponse(event.id, result);
                  },
                  reason => {
                    sendError(event.id, reason);
                  },
                );
            },
            reason => {
              sendError(event.id, reason);
            },
          );
          break;
        case 'watchAsset':
          props.onRequestWatchAsset(
            event,
            () => {},
            reason => {
              sendError(event.id, reason);
            },
          );
          break;
        case 'addEthereumChain':
          props.onRequestAddEthereumChain(
            event,
            () => {},
            reason => {
              sendError(event.id, reason);
            },
          );
          break;
        default:
          break;
      }
    });
  };

  const setupIPC = useCallback(() => {
    if (!webview) {
      return;
    }

    listenIPCMessages();

    webview.addEventListener('new-window', e => {
      e.preventDefault();
      shell.openExternal(e.url);
    });

    webview.addEventListener('did-finish-load', () => {
      // injectDomReadyScript();
      if (process.env.NODE_ENV === 'development') {
        webview.openDevTools();
      }
    });
  }, [webview]);

  useEffect(() => {
    setupIPC();
  }, [setupIPC]);
};
