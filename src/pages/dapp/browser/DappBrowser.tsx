import * as React from 'react';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { WebviewTag } from 'electron';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useTranslation } from 'react-i18next';
import Web3 from 'web3';
import { ConfirmTransactionSuccessCallback, useIPCProvider } from './useIPCProvider';
import { allMarketState, sessionState, walletAllAssetsState } from '../../../recoil/atom';
import { addHTTPsPrefixIfNeeded, getCronosEvmAsset } from '../../../utils/utils';
import PasswordFormModal from '../../../components/PasswordForm/PasswordFormModal';
import RequestConfirmation from '../components/RequestConfirmation/RequestConfirmation';
import { UserAsset } from '../../../models/UserAsset';
import { secretStoreService } from '../../../service/storage/SecretStoreService';
import { Dapp, DappBrowserIPC } from '../types';
import { ProviderPreloadScriptPath } from './config';
import { walletService } from '../../../service/WalletService';
import { useRefCallback } from '../../../hooks/useRefCallback';
import { useWebInfoProvider } from './useWebInfoProvider';
import {
  IWebviewNavigationState,
  useWebviewStatusInfo,
  WebviewState,
} from './useWebviewStatusInfo';
import { LEDGER_WALLET_TYPE } from '../../../service/LedgerService';
import ErrorModalPopup from '../../../components/ErrorModalPopup/ErrorModalPopup';
import { useAddChainModal } from '../hooks/useAddChainModal';
import { useSwitchChainModal } from '../hooks/useSwitchChainModal';
import { EVMChainConfig } from '../../../models/Chain';

// use **only** one of the following
// priority: dapp > dappURL
interface DappBrowserProps {
  dapp?: Dapp;
  dappURL?: string;
  onStateChange?: (state: WebviewState, navigationState: IWebviewNavigationState) => void;
  onURLChanged?: (url: string) => void;
}

interface WebInfo {
  title?: string;
  faviconURL?: string;
  webviewURL?: string;
}

export interface DappBrowserRef {
  goBack: () => void;
  goForward: () => void;
  reload: () => void;
  getCurrentWebStatus: () => WebInfo | undefined;
}

const DappBrowser = forwardRef<DappBrowserRef, DappBrowserProps>((props: DappBrowserProps, ref) => {
  const { dapp, dappURL, onStateChange, onURLChanged } = props;
  const webviewRef = useRef<WebviewTag & HTMLWebViewElement>(null);
  const [t] = useTranslation();
  const [allAssets, setAllAssets] = useRecoilState(walletAllAssetsState);
  const allMarketData = useRecoilValue(allMarketState);
  const [cronosAsset, setCronosAsset] = useState<UserAsset | undefined>(
    getCronosEvmAsset(allAssets),
  );
  const [txFailedMessage, setTxFailedMessage] = useState('');

  const { showWithConfig: showAddChainModal, dismiss: dismissAddChainModal } = useAddChainModal();
  const {
    showWithConfig: showSwitchChainModal,
    dismiss: dismissSwitchChainModal,
  } = useSwitchChainModal();

  const {
    title: providedTitle,
    faviconURL: providedFaviconURL,
    url: providedURL,
    isDOMReady,
  } = useWebInfoProvider({
    webview: webviewRef.current,
  });

  useImperativeHandle(ref, () => ({
    goBack: () => {
      webviewRef.current?.goBack();
    },
    goForward: () => {
      webviewRef.current?.goForward();
    },
    reload: () => {
      webviewRef.current?.reload();
    },
    getCurrentWebStatus: () => {
      if (!isDOMReady) {
        return undefined;
      }

      return {
        title: webviewRef.current?.getTitle(),
        faviconURL: providedFaviconURL,
        webviewURL: webviewRef.current?.getURL(),
      };
    },
  }));

  const [txEvent, setTxEvent] = useState<
  | DappBrowserIPC.SendTransactionEvent
  | DappBrowserIPC.TokenApprovalEvent
  | DappBrowserIPC.SignPersonalMessageEvent
  | DappBrowserIPC.SignTypedMessageEvent
  | DappBrowserIPC.SignMessageEvent
  >();
  const [requestConfirmationVisible, setRequestConfirmationVisible] = useState(false);
  const [decryptedPhrase, setDecryptedPhrase] = useState('');
  const [inputPasswordVisible, setInputPasswordVisible] = useState(false);
  const currentSession = useRecoilValue(sessionState);
  const [confirmPasswordCallback, setConfirmPasswordCallback] = useState<{
    successCallback: ConfirmTransactionSuccessCallback;
    errorCallback: Function;
  }>();

  const onRequestAddress = useRefCallback((onSuccess: (address: string) => void) => {
    onSuccess(cronosAsset?.address!);
  });

  const { state: webviewState, navigationState } = useWebviewStatusInfo({
    webview: webviewRef.current,
  });

  useEffect(() => {
    onURLChanged?.(providedURL);
  }, [providedURL]);

  useEffect(() => {
    onStateChange?.(webviewState, navigationState);
  }, [webviewState, navigationState]);

  const pageDapp = useMemo(() => {
    const pageURL = dapp ? dapp.url : addHTTPsPrefixIfNeeded(dappURL!);
    const pageTitle = dapp ? dapp.name : providedTitle;
    const pageFavicon = dapp ? dapp.logo : providedFaviconURL;
    const app: Dapp = dapp ?? {
      name: pageTitle,
      logo: pageFavicon,
      alt: pageTitle,
      url: pageURL,
      description: '',
    };
    return app;
  }, [dapp, providedTitle, providedFaviconURL, dappURL]);

  const isLedgerWallet = currentSession.wallet.walletType === LEDGER_WALLET_TYPE;

  const onRequestTokenApproval = useRefCallback(
    (
      event: DappBrowserIPC.TokenApprovalEvent,
      successCallback: ConfirmTransactionSuccessCallback,
      errorCallback: (message: string) => void,
    ) => {
      setTxEvent(event);
      // prompt for password
      if (!decryptedPhrase && !isLedgerWallet) {
        setInputPasswordVisible(true);
      } else {
        setRequestConfirmationVisible(true);
      }
      setConfirmPasswordCallback({ successCallback, errorCallback });
    },
  );

  const onRequestSendTransaction = useRefCallback(
    (
      event: DappBrowserIPC.SendTransactionEvent,
      successCallback: ConfirmTransactionSuccessCallback,
      errorCallback: (message: string) => void,
    ) => {
      setTxEvent(event);
      // prompt for password
      if (!decryptedPhrase && !isLedgerWallet) {
        setInputPasswordVisible(true);
      } else {
        setRequestConfirmationVisible(true);
      }
      setConfirmPasswordCallback({ successCallback, errorCallback });
    },
  );

  const onRequestSignMessage = useRefCallback(
    (
      event: DappBrowserIPC.SignMessageEvent,
      successCallback: ConfirmTransactionSuccessCallback,
      errorCallback: (message: string) => void,
    ) => {
      setTxEvent(event);
      // prompt for password
      if (!decryptedPhrase && !isLedgerWallet) {
        setInputPasswordVisible(true);
      } else {
        setRequestConfirmationVisible(true);
      }
      setConfirmPasswordCallback({ successCallback, errorCallback });
    },
  );

  const onRequestSignTypedMessage = useRefCallback(
    (
      event: DappBrowserIPC.SignTypedMessageEvent,
      successCallback: ConfirmTransactionSuccessCallback,
      errorCallback: (message: string) => void,
    ) => {
      setTxEvent(event);
      // prompt for password
      if (!decryptedPhrase && !isLedgerWallet) {
        setInputPasswordVisible(true);
      } else {
        setRequestConfirmationVisible(true);
      }
      setConfirmPasswordCallback({ successCallback, errorCallback });
    },
  );

  const onRequestSignPersonalMessage = useRefCallback(
    (
      event: DappBrowserIPC.SignPersonalMessageEvent,
      successCallback: ConfirmTransactionSuccessCallback,
      errorCallback: (message: string) => void,
    ) => {
      setTxEvent(event);
      // prompt for password
      if (!decryptedPhrase && !isLedgerWallet) {
        setInputPasswordVisible(true);
      } else {
        setRequestConfirmationVisible(true);
      }
      setConfirmPasswordCallback({ successCallback, errorCallback });
    },
  );

  const onRequestAddEthereumChain = useRefCallback(
    (
      event: { chainConfig: EVMChainConfig },
      successCallback: () => void,
      errorCallback: (message: string) => void,
    ) => {
      showAddChainModal({
        dappURL: providedURL,
        faviconURL: providedFaviconURL,
        config: event.chainConfig,
        onApprove: () => {
          successCallback();
          dismissAddChainModal();
        },
        onCancel: () => {
          errorCallback('User cancelled');
          dismissAddChainModal();
        },
      });
    },
  );

  const onRequestSwitchEthereumChain = useRefCallback(
    (
      event: { prev: EVMChainConfig; next: EVMChainConfig },
      successCallback: () => void,
      errorCallback: (message: string) => void,
    ) => {
      showSwitchChainModal({
        dappURL: providedURL,
        faviconURL: providedFaviconURL,
        config: event.next,
        onApprove: () => {
          successCallback();
          dismissSwitchChainModal();
        },
        onCancel: () => {
          errorCallback('User cancelled');
          dismissSwitchChainModal();
        },
      });
    },
  );

  const onFinishTransaction = useRefCallback(async (error: string) => {
    if (error?.length > 0) {
      // show error
      setTxFailedMessage(error);
      return;
    }

    setTimeout(async () => {
      const sessionData = await walletService.retrieveCurrentSession();
      await walletService.syncBalancesData(sessionData);
      const assets = await walletService.retrieveCurrentWalletAssets(sessionData);
      setAllAssets(assets);
      setCronosAsset(getCronosEvmAsset(assets));
    }, 7000);
  });

  useIPCProvider({
    webview: webviewRef.current,
    onRequestAddress: onSuccess => {
      // TODO: !! cronosAsset may not be ready
      onRequestAddress.current(onSuccess);
    },
    onRequestTokenApproval: (event, successCallback, errorCallback) => {
      onRequestTokenApproval.current(event, successCallback, errorCallback);
    },
    onRequestSignMessage: async (event, successCallback, errorCallback) => {
      onRequestSignMessage.current(event, successCallback, errorCallback);
    },
    onRequestSignPersonalMessage: async (event, successCallback, errorCallback) => {
      onRequestSignPersonalMessage.current(event, successCallback, errorCallback);
    },
    onRequestSignTypedMessage: async (event, successCallback, errorCallback) => {
      onRequestSignTypedMessage.current(event, successCallback, errorCallback);
    },
    onRequestEcRecover: async (event, successCallback, errorCallback) => {
      new Web3('').eth.personal
        .ecRecover(event.object.message, event.object.signature)
        .then(errorCallback, successCallback);
    },
    onRequestSendTransaction: async (event, successCallback, errorCallback) => {
      onRequestSendTransaction.current(event, successCallback, errorCallback);
    },
    onRequestAddEthereumChain: async (event, successCallback, errorCallback) => {
      onRequestAddEthereumChain.current(event, successCallback, errorCallback);
    },
    onRequestSwitchEthereumChain: async (event, successCallback, errorCallback) => {
      onRequestSwitchEthereumChain.current(event, successCallback, errorCallback);
    },
    onRequestWatchAsset: async () => {
      // no-op for now
    },
    onFinishTransaction: (error?: string) => {
      onFinishTransaction.current(error ?? '');
    },
  });

  return (
    <div className="dapp-content">
      {txFailedMessage.length > 0 && (
        <ErrorModalPopup
          isModalVisible
          handleCancel={() => {
            setTxFailedMessage('');
          }}
          handleOk={() => {
            setTxFailedMessage('');
          }}
          title={t('general.errorModalPopup.title')}
          footer={[]}
        >
          <>
            <div className="description">
              {t('general.errorModalPopup.transfer.description')}
              <br />
              <div>{txFailedMessage}</div>
            </div>
          </>
        </ErrorModalPopup>
      )}
      {inputPasswordVisible && (
        <PasswordFormModal
          description={t('general.passwordFormModal.description')}
          okButtonText={t('general.passwordFormModal.okButton')}
          onCancel={() => {
            setInputPasswordVisible(false);
            confirmPasswordCallback?.errorCallback('Canceled');
            setConfirmPasswordCallback(undefined);
          }}
          onSuccess={async (password: string) => {
            const phraseDecrypted = await secretStoreService.decryptPhrase(
              password,
              currentSession.wallet.identifier,
            );
            setDecryptedPhrase(phraseDecrypted);
            setInputPasswordVisible(false);
            setRequestConfirmationVisible(true);
          }}
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
          skipRepeatValidation
        />
      )}
      {txEvent && requestConfirmationVisible && (
        <RequestConfirmation
          isConfirming={false}
          event={txEvent}
          cronosAsset={cronosAsset}
          allMarketData={allMarketData}
          currentSession={currentSession}
          wallet={currentSession.wallet}
          visible={requestConfirmationVisible}
          dapp={{
            ...pageDapp,
            url: providedURL,
          }}
          onConfirm={({ gasLimit, gasPrice }) => {
            setRequestConfirmationVisible(false);
            confirmPasswordCallback?.successCallback({
              signature: '',
              gasLimit,
              gasPrice,
              decryptedPhrase,
            });
          }}
          onCancel={() => {
            setRequestConfirmationVisible(false);
            setTxEvent(undefined);
            confirmPasswordCallback?.errorCallback('Canceled');
          }}
        />
      )}
      <webview
        preload={ProviderPreloadScriptPath}
        ref={webviewRef}
        useragent={window.navigator.userAgent.replace(
          'chain-desktop-wallet',
          'Desktop Wallet Build',
        )}
        style={{
          width: '100%',
          height: 'calc(100vh - 48px)',
        }}
        src={pageDapp.url}
        title={pageDapp.name}
      />
    </div>
  );
});

export default DappBrowser;
