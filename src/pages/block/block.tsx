import React, {  useEffect } from 'react';
import './block.less';
import 'antd/dist/antd.css';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import logo from '../../assets/logo-products-chain.svg';

function BlockPage() {
  const history = useHistory();

  const [t] = useTranslation();

  useEffect(() => {
  }, [history]);

  return (
    <main className="block-page">
      <div className="header">
        <img src={logo} className="logo" alt="logo" />
      </div>
      <div className="container">
        <div>
          <div className="title">Crypto.org Chain Wallet</div>
          <div className="slogan">{t('welcome.block')}</div>
        </div>
      </div>
    </main>
  );
}

export default BlockPage;
