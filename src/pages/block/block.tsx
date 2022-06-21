import React from 'react';
import './block.less';
import 'antd/dist/antd.css';
import { useTranslation } from 'react-i18next';
// import logo from '../../assets/logo-products-chain.svg';
import fullLogo from '../../assets/full-logo.svg';

const BlockPage = props => {
  const { isCountryBlocked, isBlockSloganVisible } = props;
  const [t] = useTranslation();

  return (
    <main className="block-page fade-in">
      {/* <div className="header">
        <img src={logo} className="logo" alt="logo" />
      </div> */}
      <div className="container">
        <div>
          <img src={fullLogo} className="logo" alt="logo" style={{ width: '800px' }} />
          <div className="slogan">
            {isCountryBlocked && isBlockSloganVisible ? t('welcome.block') : ''}
          </div>
        </div>
      </div>
    </main>
  );
};

export default BlockPage;
