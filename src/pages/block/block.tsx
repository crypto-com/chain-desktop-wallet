import React from 'react';
import './block.less';
import 'antd/dist/antd.css';
import { useTranslation } from 'react-i18next';
import logo from '../../assets/logo-products-chain.svg';

const BlockPage = props => {
  const { isCountryBlocked, isBlockSloganVisible } = props;
  const [t] = useTranslation();

  return (
    <main className="block-page fade-in">
      <div className="header">
        <img src={logo} className="logo" alt="logo" />
      </div>
      <div className="container">
        <div>
          <div className="title">Crypto.org Chain Wallet</div>
          <div className="slogan">
            {isCountryBlocked && isBlockSloganVisible ? t('welcome.block') : t('welcome.slogan')}
          </div>
        </div>
      </div>
    </main>
  );
};

export default BlockPage;
