import React, { useState, useEffect } from 'react';
import './block.less';
import 'antd/dist/antd.css';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import logo from '../../assets/logo-products-chain.svg';

function BlockPage() {
  const [isBlockSloganVisible, setIsBlockSloganVisible] = useState(false);
  const history = useHistory();

  const [t] = useTranslation();

  const TIMEOUT = 5000;

  useEffect(() => {
    setTimeout(() => {
      setIsBlockSloganVisible(true);
    }, TIMEOUT);
  }, [history]);

  return (
    <main className="block-page fade-in">
      <div className="header">
        <img src={logo} className="logo" alt="logo" />
      </div>
      <div className="container">
        <div>
          <div className="title">Crypto.org Chain Wallet</div>
          <div className="slogan">
            {isBlockSloganVisible ? t('welcome.block') : t('welcome.slogan')}
          </div>
        </div>
      </div>
    </main>
  );
}

export default BlockPage;
