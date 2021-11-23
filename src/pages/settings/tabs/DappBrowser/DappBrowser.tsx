import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { WebviewTag } from 'electron';
// import { Modal } from 'antd';
import { useRecoilValue } from 'recoil';
import { useTranslation } from 'react-i18next';
import { TransactionConfig } from 'web3-eth';
import { ProviderPreloadScriptPath } from './useIPCProvider';
import { sessionState, walletAllAssetsState } from '../../../../recoil/atom';
import { getCronosAsset } from '../../../../utils/utils';
import PasswordFormModal from '../../../../components/PasswordForm/PasswordFormModal';
import { secretStoreService } from '../../../../storage/SecretStoreService';
import { evmTransactionSigner } from '../../../../service/signers/EvmTransactionSigner';
import { EVMContractCallUnsigned } from '../../../../service/signers/TransactionSupported';
import { TransactionPrepareService } from '../../../../service/TransactionPrepareService';
import { walletService } from '../../../../service/WalletService';
import { ChainConfig } from './config';
import { DappBrowserIPC } from './types';

const useRefEventListener = (fn: Function) => {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  return fnRef;
};

const DappBrowser = () => {
  const webviewRef = useRef<WebviewTag & HTMLWebViewElement>(null);
  const [t] = useTranslation();
  const allAssets = useRecoilValue(walletAllAssetsState);
  const cronosAsset = getCronosAsset(allAssets);

  const [inputPasswordVisible, setInputPasswordVisible] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const currentSession = useRecoilValue(sessionState);

  const transactionPrepareService = new TransactionPrepareService(walletService.storageService);

  useEffect(() => {
    setInputPasswordVisible(true);
  }, []);

  const executeJavScript = (script: string) => {
    webviewRef.current?.executeJavaScript(
      `
        (function() {
            ${script}
        })();
        `,
    );
  };

  // const sendError = (id: number, error: string) => {
  //   executeJavScript(`
  //       window.ethereum.sendError(${id}, "${error}")
  //   `);
  // };

  const sendResponse = (id: number, response: string) => {
    executeJavScript(`
        window.ethereum.sendResponse(${id}, "${response}")
    `);
  };

  // const signMessage = (
  //   data: string,
  //   addPrefix: boolean,
  //   successHandler: { (data: string): void },
  //   errorHandler: { (reason: string): void },
  // ) => {
  //   // TODO: use privateKey to sign data
  //   console.log(data, addPrefix, successHandler, errorHandler);
  //   return data;
  // };

  const onSignTXRef = useRefEventListener(async (event: DappBrowserIPC.SendTransactionEvent) => {
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
  });

  const sendResponses = (id: number, responses: string[]) => {
    const script = responses.map(r => `'${r}'`).join(',');
    executeJavScript(`
        window.ethereum.sendResponse(${id}, [${script}])
    `);
  };

  const handleRequestAccountsRef = useRefEventListener((id: number) => {
    if (!cronosAsset?.address) {
      return;
    }
    const { address } = cronosAsset;
    executeJavScript(
      `
          window.ethereum.setAddress("${address}");
        `,
    );
    sendResponses(id, [address]);
  });

  const injectDomReadyScript = () => {
    if (!webviewRef.current) {
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
  };

  const listenIPCMessages = () => {
    if (!webviewRef.current) {
      return;
    }

    webviewRef.current.addEventListener('ipc-message', async e => {
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
          handleRequestAccountsRef.current(event.id);
          break;
        case 'signTransaction':
          onSignTXRef.current(event);
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
    if (!webviewRef.current) {
      return;
    }

    const webview = webviewRef.current;

    listenIPCMessages();

    webview.addEventListener('dom-ready', () => {
      // TODO: remove later
      injectDomReadyScript();
      webview.openDevTools();
    });
  };

  useEffect(() => {
    setupIPC();
  }, [webviewRef]);

  // useWebviewIPCProvider({
  //   webview: webviewRef.current,
  //   onRequestAddress: async successHandler => {
  //     // const modal = Modal.confirm({
  //     //   title: 'Requesting Address',
  //     //   content: 'Approve or not?',
  //     //   onOk: () => {
  //     successHandler(cronosAsset?.address!);
  //     // modal.destroy();
  //     //   },
  //     //   onCancel: () => {
  //     //     errorHandler('Canceled');
  //     //     modal.destroy();
  //     //   },
  //     // });
  //   },
  //   onSignMessage: async (event, successHandler, errorHandler) => {
  //     signMessage(event.object.data, false, successHandler, errorHandler);
  //   },
  //   onSignPersonalMessage: async (event, successHandler, errorHandler) => {
  //     signMessage(event.object.data, true, successHandler, errorHandler);
  //   },
  //   onSignTypedMessage: async (event, successHandler, errorHandler) => {
  //     signMessage(event.object.data, true, successHandler, errorHandler);
  //   },
  //   onEcRecover: async (event, successHandler, errorHandler) => {
  //     new Web3('').eth.personal
  //       .ecRecover(event.object.message, event.object.signature)
  //       .then(errorHandler, successHandler);
  //   },
  //   onSignTransaction: onSignTX,
  //   onAddEthereumChain: async () => {
  //     // no-op, cause we only support cronos for now
  //   },
  //   onWatchAsset: async () => {
  //     // no-op for now
  //   },
  // });

  const onSuccessInputPassword = async (password: string) => {
    const phraseDecrypted = await secretStoreService.decryptPhrase(
      password,
      currentSession.wallet.identifier,
    );
    setPassphrase(phraseDecrypted);
    setInputPasswordVisible(false);
  };

  return (
    <div className="site-layout-background settings-content">
      {inputPasswordVisible && (
        <PasswordFormModal
          description={t('general.passwordFormModal.description')}
          okButtonText={t('general.passwordFormModal.okButton')}
          onCancel={() => {
            setInputPasswordVisible(false);
          }}
          onSuccess={onSuccessInputPassword}
          onValidatePassword={async (password: string) => {
            const isValid = await secretStoreService.checkIfPasswordIsValid(password);
            return {
              valid: isValid,
              errMsg: !isValid ? t('general.passwordFormModal.error') : '',
            };
          }}
          successText={t('general.passwordFormModal.success')}
          title={t('general.passwordFormModal.title')}
          visible
          successButtonText={t('general.continue')}
          confirmPassword={false}
        />
      )}
      <webview
        preload={ProviderPreloadScriptPath}
        ref={webviewRef}
        style={{
          width: '100%',
          height: '600px',
        }}
        src="https://vvs.finance"
        title="VVS Finance"
      />
    </div>
  );
};

export default DappBrowser;
