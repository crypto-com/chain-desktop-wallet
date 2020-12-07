import React from 'react';
// import ReactDOM from 'react-dom';
import './home.less';
import 'antd/dist/antd.css';
import { Button } from 'antd';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo-products-chain.svg';

function HomePage() {
  return (
    <main className="welcome-page">
      <div className="header">
        <img src={logo} className="logo" alt="logo" />
      </div>
      <div className="container">
        <div>
          <div className="title">Home Page</div>
          <div className="slogan">
            Our Sample Chain Wallet supports wallet management and funds transfer.
          </div>

          <div className="button-container">
            <Link to="/restore">
              <Button>Restore Wallet</Button>
            </Link>
            <Link to="/create">
              <Button type="primary">Create Wallet</Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default HomePage;
