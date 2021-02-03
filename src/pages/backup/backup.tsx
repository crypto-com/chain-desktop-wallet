import React, { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useRecoilState, useRecoilValue } from 'recoil';
import './backup.less';
import { Button, Checkbox } from 'antd';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import MouseTooltip from 'react-sticky-mouse-tooltip';
import { walletIdentifierState, walletTempBackupSeedState } from '../../recoil/atom';
import { setPhrase, Wallet } from '../../models/Wallet';
import { walletService } from '../../service/WalletService';
import logo from '../../assets/logo-products-chain.svg';
import ErrorModalPopup from '../../components/ErrorModalPopup/ErrorModalPopup';
import { secretStoreService } from '../../storage/SecretStoreService';
import PasswordFormModal from '../../components/PasswordForm/PasswordFormModal';

function BackupPage() {
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [goHomeButtonLoading, setGoHomeButtonLoading] = useState(false);
  const [mouseTooltip, setMouseTooltip] = useState(false);
  const [wallet, setWallet] = useState<Wallet>();
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const walletIdentifier: string = useRecoilValue(walletIdentifierState);
  const [walletTempBackupSeed, setWalletTempBackupSeed] = useRecoilState(walletTempBackupSeedState);
  const didMountRef = useRef(false);
  const history = useHistory();
  const [inputPasswordVisible, setInputPasswordVisible] = useState(false);

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
    setWalletTempBackupSeed({ seed: '', walletId: '' });
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
    const fetchedWallet = await walletService.findWalletByIdentifier(walletIdentifier);
    if (fetchedWallet !== null && walletIdentifier === walletTempBackupSeed.walletId) {
      const updatedWallet = setPhrase(fetchedWallet, walletTempBackupSeed.seed);
      setWallet(updatedWallet);
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
          <div className="title">Backup Recovery Phrase</div>
          <div className="slogan">
            The recovery phrase will only be shown once, backup the 24-word phrase now and keep it
            safe. You would need your recovery phrase to restore and access wallet.
          </div>
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
                  <span>Copied!</span>
                </MouseTooltip>
              </div>
            </CopyToClipboard>

            <div>
              <Checkbox onChange={checkboxOnChange}>
                I understand the recovery phrase will be only shown once
              </Checkbox>
            </div>
            <div>
              <Button key="submit" type="primary" disabled={isButtonDisabled} onClick={handleOk}>
                I have written down my recovery phrase
              </Button>
            </div>
          </div>
          <ErrorModalPopup
            isModalVisible={isErrorModalVisible}
            handleCancel={handleErrorCancel}
            handleOk={handleErrorCancel}
            title="An error happened!"
            footer={[]}
          >
            <>
              <div className="description">Please try again.</div>
            </>
          </ErrorModalPopup>
          <PasswordFormModal
            description="Input the app password to encrypt the wallet to be restored"
            okButtonText="Encrypt wallet"
            isButtonLoading={goHomeButtonLoading}
            onCancel={() => {
              setInputPasswordVisible(false);
            }}
            onSuccess={onWalletBackupFinish}
            onValidatePassword={async (password: string) => {
              const isValid = await secretStoreService.checkIfPasswordIsValid(password);
              return {
                valid: isValid,
                errMsg: !isValid ? 'The password provided is incorrect, Please try again' : '',
              };
            }}
            successText="Wallet created and encrypted successfully !"
            title="Provide app password"
            visible={inputPasswordVisible}
            successButtonText="Go to Home"
            confirmPassword={false}
          />
        </div>
      </div>
    </main>
  );
}

export default BackupPage;
