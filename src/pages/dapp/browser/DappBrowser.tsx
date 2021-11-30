import * as React from 'react';
import { useRef, useState } from 'react';
import { WebviewTag } from 'electron';
// import { Modal } from 'antd';
import { useRecoilValue } from 'recoil';
import { useTranslation } from 'react-i18next';
import Web3 from 'web3';
import { useIPCProvider, useRefCallback } from './useIPCProvider';
import { sessionState, walletAllAssetsState } from '../../../recoil/atom';
import { getCronosAsset } from '../../../utils/utils';
import PasswordFormModal from '../../../components/PasswordForm/PasswordFormModal';
import { secretStoreService } from '../../../storage/SecretStoreService';
import { Dapp } from '../types';
import { ProviderPreloadScriptPath } from './config';

interface DappBrowserProps {
  dapp: Dapp;
}

const DappBrowser = (props: DappBrowserProps) => {
  const { dapp } = props;
  const webviewRef = useRef<WebviewTag & HTMLWebViewElement>(null);
  const [t] = useTranslation();
  const allAssets = useRecoilValue(walletAllAssetsState);
  const cronosAsset = getCronosAsset(allAssets);

  const [inputPasswordVisible, setInputPasswordVisible] = useState(false);
  const currentSession = useRecoilValue(sessionState);
  const [confirmPasswordCallback, setConfirmPasswordCallback] = useState<{
    successCallback: Function;
    errorCallback: Function;
  }>();

  const onRequestAddress = useRefCallback((onSuccess: (address: string) => void) => {
    onSuccess(cronosAsset?.address!);
  });

  useIPCProvider({
    webview: webviewRef.current,
    onRequestAddress: (onSuccess, onError) => {
      // TODO: !! cronosAsset may not be ready
      onRequestAddress.current(onSuccess, onError);
    },
    onRequestTokenApproval: (request, successCallback, errorCallback) => {
      console.log(request);
      setInputPasswordVisible(true);
      setConfirmPasswordCallback({ successCallback, errorCallback });
    },
    onRequestSignMessage: async (event, successCallback, errorCallback) => {
      setInputPasswordVisible(true);
      setConfirmPasswordCallback({ successCallback, errorCallback });
    },
    onRequestSignPersonalMessage: async (event, successCallback, errorCallback) => {
      setInputPasswordVisible(true);
      setConfirmPasswordCallback({ successCallback, errorCallback });
    },
    onRequestSignTypedMessage: async (event, successCallback, errorCallback) => {
      setInputPasswordVisible(true);
      setConfirmPasswordCallback({ successCallback, errorCallback });
    },
    onRequestEcRecover: async (event, successCallback, errorCallback) => {
      new Web3('').eth.personal
        .ecRecover(event.object.message, event.object.signature)
        .then(errorCallback, successCallback);
    },
    onRequestSendTransaction: async (event, successCallback, errorCallback) => {
      // prompt for password
      setInputPasswordVisible(true);
      setConfirmPasswordCallback({ successCallback, errorCallback });
    },
    onRequestAddEthereumChain: async () => {
      // no-op, cause we only support cronos for now
    },
    onRequestWatchAsset: async () => {
      // no-op for now
    },
  });

  return (
    <div className="site-layout-background settings-content">
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
            setInputPasswordVisible(false);
            confirmPasswordCallback?.successCallback(phraseDecrypted);
            setConfirmPasswordCallback(undefined);
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
      <webview
        preload={ProviderPreloadScriptPath}
        ref={webviewRef}
        style={{
          width: '100%',
          height: '800px',
        }}
        src={dapp.url}
        title={dapp.name}
      />
    </div>
  );
};

export default DappBrowser;
