import React, { useState, useEffect, useRef } from 'react';
import './Announcement.less';
import 'antd/dist/antd.css';
import { Button } from 'antd';
import { Link, useHistory } from 'react-router-dom';
import { walletService } from '../../service/WalletService';
import logo from '../../assets/logo-products-chain.svg';
import { secretStoreService } from '../../storage/SecretStoreService';
import { generalConfigService } from '../../storage/GeneralConfigService';

interface AnnouncementProps {
  setIsAnnouncementVisible: (active: boolean) => void;
}

const Announcement: React.FC<AnnouncementProps> = props => {
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
    }
  }, [hasPasswordBeenSet, hasWallet, history]);

  return (
    <main className="announcement-page">
      <div className="header">
        <img src={logo} className="logo" alt="logo" />
      </div>
      <div className="container">
        <div>
          <div className="title">Google Analytics is added!</div>
          <div className="description">
            You can help improve Crypto.org Chain Wallet by having Google Analytics enabled and let
            us know how you use the app. The data will help us prioritize future development for new
            features and functionalities. <br />
            <br />
            To disable Google Analytics, please go to General Configuration in{' '}
            <Link
              to="/settings"
              onClick={() => {
                props.setIsAnnouncementVisible(false);
                generalConfigService.setHasShownAnalyticsPopup(true);
              }}
            >
              Settings
            </Link>
          </div>
          <div className="button-container">
            <Link
              to="/home"
              onClick={() => {
                props.setIsAnnouncementVisible(false);
                generalConfigService.setHasShownAnalyticsPopup(true);
              }}
            >
              <Button type="primary">OK</Button>
            </Link>
            {/* <Link to="/create">
              <Button>Create Wallet</Button>
            </Link> */}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Announcement;
