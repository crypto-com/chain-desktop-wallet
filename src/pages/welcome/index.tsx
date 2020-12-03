import React from 'react';
// import ReactDOM from 'react-dom';
import './index.scss';
import 'antd/dist/antd.css';
import { Button } from 'antd';
import logo from '../../assets/logo-products-chain.svg';

function WelcomePage() {
  return (
    <main className="welcome-page">
      <div className="header">
        <img src={logo} className="logo" alt="logo" />
      </div>
      <div className="container">
        <div>
          <div className="title">Crypto.com Chain Wallet</div>
          <div className="slogan">
            Our Sample Chain Wallet supports wallet management and funds transfer.
          </div>
          <div className="button-container">
            <Button>Restore Wallet</Button>
            <Button type="primary">Create Wallet</Button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default WelcomePage;
