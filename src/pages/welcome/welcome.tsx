import React, { useState, useEffect, useRef } from 'react';
import './welcome.less';
import 'antd/dist/antd.css';
import { Button } from 'antd';
import { Link, useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { walletService } from '../../service/WalletService';
import logo from '../../assets/full-logo.svg';
import { secretStoreService } from '../../service/storage/SecretStoreService';

function WelcomePage() {
  const history = useHistory();
  const [hasWallet, setHasWallet] = useState(false); // Default as false. useEffect will only re-render if result of hasWalletBeenCreated === true
  const [hasPasswordBeenSet, setHasPasswordBeenSet] = useState(true);
  const didMountRef = useRef(false);

  const [t] = useTranslation();

  useEffect(() => {
    const fetchWalletData = async () => {
      const hasWalletBeenCreated = await walletService.hasWalletBeenCreated();
      const isPasswordSet = await secretStoreService.hasPasswordBeenSet();

      setHasPasswordBeenSet(isPasswordSet);
      setHasWallet(hasWalletBeenCreated);
    };
    if (!didMountRef.current) {
      fetchWalletData();
      didMountRef.current = true;
    } else if (hasWallet && hasPasswordBeenSet) {
      history.push('/home');
    } else if (hasPasswordBeenSet) {
      history.push('/signUp');
    }
  }, [hasPasswordBeenSet, hasWallet, history]);

  return (
    <main className="welcome-page">
      <div className="header">
        <img src={logo} className="logo" alt="logo" />
      </div>
      <div className="container">
        <div>
          <img src={logo} className="logo" alt="logo" />
          <div className="button-container">
            <Link to="/signup">
              <Button type="primary">{t('welcome.button')}</Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default WelcomePage;
