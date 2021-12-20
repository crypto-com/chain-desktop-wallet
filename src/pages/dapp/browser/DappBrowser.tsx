import * as React from 'react';
import { useRef, useState } from 'react';
import { WebviewTag } from 'electron';
import { useRecoilValue } from 'recoil';
import { useTranslation } from 'react-i18next';
import Web3 from 'web3';
import { useIPCProvider, useRefCallback } from './useIPCProvider';
import { allMarketState, sessionState, walletAllAssetsState } from '../../../recoil/atom';
import { getCronosAsset } from '../../../utils/utils';
import PasswordFormModal from '../../../components/PasswordForm/PasswordFormModal';
import RequestConfirmation from '../components/RequestConfirmation/RequestConfirmation';
import { secretStoreService } from '../../../storage/SecretStoreService';
import { Dapp, DappBrowserIPC } from '../types';
import { ProviderPreloadScriptPath } from './config';
import packageJson from '../../../../package.json';

interface DappBrowserProps {
  dapp: Dapp;
}

const DappBrowser = (props: DappBrowserProps) => {
  const { dapp } = props;
  const webviewRef = useRef<WebviewTag & HTMLWebViewElement>(null);
  const [t] = useTranslation();
  const allAssets = useRecoilValue(walletAllAssetsState);
  const allMarketData = useRecoilValue(allMarketState);
  const cronosAsset = getCronosAsset(allAssets);

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
    successCallback: Function;
    errorCallback: Function;
  }>();

  const onRequestAddress = useRefCallback((onSuccess: (address: string) => void) => {
    onSuccess(cronosAsset?.address!);
  });

  const onRequestTokenApproval = useRefCallback(
    (
      event: DappBrowserIPC.TokenApprovalEvent,
      successCallback: (passphrase: string) => void,
      errorCallback: (message: string) => void,
    ) => {
      setTxEvent(event);
      // prompt for password
      if (!decryptedPhrase) {
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
      successCallback: (passphrase: string) => void,
      errorCallback: (message: string) => void,
    ) => {
      setTxEvent(event);
      // prompt for password
      if (!decryptedPhrase) {
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
      successCallback: (signature: string) => void,
      errorCallback: (message: string) => void,
    ) => {
      setTxEvent(event);
      // prompt for password
      if (!decryptedPhrase) {
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
      successCallback: (signature: string) => void,
      errorCallback: (message: string) => void,
    ) => {
      setTxEvent(event);
      // prompt for password
      if (!decryptedPhrase) {
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
      successCallback: (signature: string) => void,
      errorCallback: (message: string) => void,
    ) => {
      setTxEvent(event);
      // prompt for password
      if (!decryptedPhrase) {
        setInputPasswordVisible(true);
      } else {
        setRequestConfirmationVisible(true);
      }
      setConfirmPasswordCallback({ successCallback, errorCallback });
    },
  );

  useIPCProvider({
    webview: webviewRef.current,
    onRequestAddress: (onSuccess, onError) => {
      // TODO: !! cronosAsset may not be ready
      onRequestAddress.current(onSuccess, onError);
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
    onRequestAddEthereumChain: async () => {
      // no-op, cause we only support cronos for now
    },
    onRequestWatchAsset: async () => {
      // no-op for now
    },
  });

  return (
    <div className="site-layout-background dapp-content">
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
          confirmPassword={false}
        />
      )}
      {txEvent && requestConfirmationVisible && (
        <RequestConfirmation
          event={txEvent}
          cronosAsset={cronosAsset}
          allMarketData={allMarketData}
          allAssets={allAssets}
          currentSession={currentSession}
          wallet={currentSession.wallet}
          visible={requestConfirmationVisible}
          dapp={dapp}
          onConfirm={() => {
            setRequestConfirmationVisible(false);
            confirmPasswordCallback?.successCallback(decryptedPhrase);
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
        // useragent is required for some dapps to auto connect, eg. cronoschimps
        useragent={`Mozilla/5.0 (Linux; Android 8.0.0; Desktop Wallet Build/${packageJson.version}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.84 Mobile Safari/537.36`}
        style={{
          width: '100%',
          height: '100vh',
        }}
        src={dapp.url}
        title={dapp.name}
      />
    </div>
  );
};

export default DappBrowser;
