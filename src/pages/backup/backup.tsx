import React, { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useRecoilState, useRecoilValue } from 'recoil';
import './backup.less';
import { Button, Checkbox } from 'antd';
import { useTranslation } from 'react-i18next';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import MouseTooltip from 'react-sticky-mouse-tooltip';
import { walletIdentifierState, walletTempBackupState } from '../../recoil/atom';
import { Wallet } from '../../models/Wallet';
import { walletService } from '../../service/WalletService';
import logo from '../../assets/logo-products-chain.svg';
import ErrorModalPopup from '../../components/ErrorModalPopup/ErrorModalPopup';
import { secretStoreService } from '../../storage/SecretStoreService';
import PasswordFormModal from '../../components/PasswordForm/PasswordFormModal';

const BackupPage = () => {
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [goHomeButtonLoading, setGoHomeButtonLoading] = useState(false);
  const [mouseTooltip, setMouseTooltip] = useState(false);
  const [wallet, setWallet] = useState<Wallet>();
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const walletIdentifier: string = useRecoilValue(walletIdentifierState);
  const [walletTempBackupSeed, setWalletTempBackupSeed] = useRecoilState(walletTempBackupState);
  const [inputPasswordVisible, setInputPasswordVisible] = useState(false);
  const didMountRef = useRef(false);
  const history = useHistory();

  const [t] = useTranslation();

  const handleOk = () => {
    setInputPasswordVisible(true);
  };

  const onWalletBackupFinish = async (password: string) => {
    setGoHomeButtonLoading(true);
    if (!wallet) {
      return;
    }
    await walletService.encryptWalletAndSetSession(password, wallet);
    setGoHomeButtonLoading(false);

    // Flush recoil state - remove temporary seed values
    setWalletTempBackupSeed(null);
    history.push('/home');
  };

  const showErrorModal = () => {
    setIsErrorModalVisible(true);
  };

  const handleErrorCancel = () => {
    setIsErrorModalVisible(false);
    history.push('/create');
  };

  const checkboxOnChange = e => {
    setIsButtonDisabled(!e.target.checked);
  };

  const onCopyClick = () => {
    setMouseTooltip(true);
    setTimeout(() => {
      setMouseTooltip(false);
    }, 100);
  };

  const fetchWallet = async () => {
    if (walletTempBackupSeed && walletIdentifier === walletTempBackupSeed.identifier) {
      // Recoil data gets passed to a local object here. It might seem like unnecessary duplication
      // But it's important since internal recoil state is read only and wouldn't be reset later
      const localWallet: Wallet = {
        ...walletTempBackupSeed,
      };
      setWallet(localWallet);
    } else {
      showErrorModal();
    }
  };

  useEffect(() => {
    if (!didMountRef.current) {
      fetchWallet();
      didMountRef.current = true;
    }
  });

  return (
    <main className="backup-page">
      <div className="header">
        <img src={logo} className="logo" alt="logo" />
      </div>
      <div className="container">
        <div>
          <div className="title">{t('backup.title')}</div>
          <div className="slogan">{t('backup.slogan')}</div>
          <div>
            <CopyToClipboard text={wallet?.encryptedPhrase}>
              <div onClick={onCopyClick}>
                <div className="phrase-container">
                  {wallet?.encryptedPhrase.split(' ').map((item, index) => {
                    return (
                      <div className="phrase" key={index}>
                        <span>{index + 1}. </span>
                        {item}
                      </div>
                    );
                  })}
                </div>
                <MouseTooltip
                  offsetX={15}
                  offsetY={0}
                  className={`mouse-tooltip ${mouseTooltip ? '' : 'hide'}`}
                >
                  <span>{t('backup.copyButton')}</span>
                </MouseTooltip>
              </div>
            </CopyToClipboard>

            <div>
              <Checkbox onChange={checkboxOnChange}>{t('backup.checkbox')}</Checkbox>
            </div>
            <div>
              <Button key="submit" type="primary" disabled={isButtonDisabled} onClick={handleOk}>
                {t('backup.button')}
              </Button>
            </div>
          </div>
          <ErrorModalPopup
            isModalVisible={isErrorModalVisible}
            handleCancel={handleErrorCancel}
            handleOk={handleErrorCancel}
            title={t('general.errorModalPopup.title')}
            footer={[]}
          >
            <>
              <div className="description">{t('general.errorModalPopup.backup.description')}</div>
            </>
          </ErrorModalPopup>
          <PasswordFormModal
            description={t('general.passwordFormModal.createWallet.description')}
            okButtonText={t('general.passwordFormModal.createWallet.okButton')}
            isButtonLoading={goHomeButtonLoading}
            onCancel={() => {
              setInputPasswordVisible(false);
            }}
            onSuccess={onWalletBackupFinish}
            onValidatePassword={async (password: string) => {
              const isValid = await secretStoreService.checkIfPasswordIsValid(password);
              return {
                valid: isValid,
                errMsg: !isValid ? t('general.passwordFormModal.error') : '',
              };
            }}
            successText={t('general.passwordFormModal.createWallet.success')}
            title={t('general.passwordFormModal.title')}
            visible={inputPasswordVisible}
            successButtonText={t('general.passwordFormModal.createWallet.successButton')}
            confirmPassword={false}
          />
        </div>
      </div>
    </main>
  );
};

export default BackupPage;
