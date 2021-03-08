import React, { useState, useEffect, useRef } from 'react';
import './welcome.less';
import 'antd/dist/antd.css';
import { Button } from 'antd';
import { Link, useHistory } from 'react-router-dom';
import { walletService } from '../../service/WalletService';
import logo from '../../assets/logo-products-chain.svg';
import { secretStoreService } from '../../storage/SecretStoreService';

function WelcomePage() {
  const history = useHistory();
  const [hasWallet, setHasWallet] = useState(false); // Default as false. useEffect will only re-render if result of hasWalletBeenCreated === true
  const [hasPasswordBeenSet, setHasPasswordBeenSet] = useState(true);
  const didMountRef = useRef(false);

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
          <div className="title">Crypto.org Chain Wallet</div>
          <div className="slogan">
            Our Sample Chain Wallet supports wallet management and funds transfer.
          </div>
          <div className="button-container">
            <Link to="/signup">
              <Button type="primary">Get Started</Button>
            </Link>
            {/* <Link to="/create">
              <Button>Create Wallet</Button>
            </Link> */}
          </div>
        </div>
      </div>
    </main>
  );
}

export default WelcomePage;
