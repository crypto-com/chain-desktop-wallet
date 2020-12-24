import React, { useState, useEffect, useRef } from 'react';
import './signup.less';
import { Link, useHistory } from 'react-router-dom';
import { Button } from 'antd';
import logo from '../../assets/logo-products-chain.svg';
import PasswordFormContainer from '../../components/PasswordForm/PasswordFormContainer';
import { cryptographer } from '../../crypto/Cryptographer';
import { secretStoreService } from '../../storage/SecretStoreService';
import SuccessCheckmark from '../../components/SuccessCheckmark/SuccessCheckmark';
import BackButton from '../../components/BackButton/BackButton';
import { walletService } from '../../service/WalletService';

type DisplayComponent = 'form' | 'wallet';

const SignUpPage = () => {
  const history = useHistory();
  const [displayComponent, setDisplayComponent] = useState<DisplayComponent>('form');
  const [hasWallet, setHasWallet] = useState(false); // Default as false. useEffect will only re-render if result of hasWalletBeenCreated === true
  const [hasPasswordBeenSet, setHasPasswordBeenSet] = useState(true);
  const didMountRef = useRef(false);

  const handlePasswordSubmitted = async (password: string) => {
    const salt = cryptographer.generateSalt();
    const hashResult = cryptographer.computeHash(password, salt);
    await secretStoreService.savePassword({ hash: hashResult });
    setDisplayComponent('wallet');
  };
  const handlePasswordCancelled = () => {};

  useEffect(() => {
    const fetchWalletData = async () => {
      const hasWalletBeenCreated = await walletService.hasWalletBeenCreated();
      const isPasswordSet = await secretStoreService.hasPasswordBeenSet();

      setHasPasswordBeenSet(isPasswordSet);
      setHasWallet(hasWalletBeenCreated);
      if (hasWalletBeenCreated && isPasswordSet) {
        history.push('/home');
      } else if (isPasswordSet) {
        setDisplayComponent('wallet');
      }
    };
    if (!didMountRef.current) {
      fetchWalletData();
      didMountRef.current = true;
    }
  }, [hasPasswordBeenSet, hasWallet, history]);

  return (
    <main className="signup-page">
      <div className="header">
        <img src={logo} className="logo" alt="logo" />
      </div>
      <div className="container">
        {displayComponent === 'form' ? (
          <>
            <BackButton />
            <PasswordFormContainer
              title="Create App Password"
              description="Before creating a new wallet, please create your app password. It will be used to encrypt your wallet seeds."
              visible
              confirmPassword
              okButtonText="Create App Password"
              successText="You have successfully created your app password. You can proceed to restore or create a wallet."
              successButtonText="Next"
              onValidatePassword={async () => {
                return {
                  valid: true,
                };
              }}
              onSuccess={handlePasswordSubmitted}
              onCancel={handlePasswordCancelled}
            />
          </>
        ) : (
          <>
            <SuccessCheckmark />
            <div className="title">App Password Created Successfully </div>
            <div className="slogan">
              You have successfully created your app password. You can proceed to restore or create
              a wallet.
            </div>
            <div className="button-container">
              <Link to="/restore">
                <Button type="primary">Restore Wallet</Button>
              </Link>
              <Link to="/create">
                <Button>Create Wallet</Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
};

export default SignUpPage;
