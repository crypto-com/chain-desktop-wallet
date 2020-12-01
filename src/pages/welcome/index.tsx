import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import './index.scss';
import logo from '../../assets/logo-cdc.png';
import 'antd/dist/antd.css';
import { Button } from 'antd';
function WelcomePage() {
    return (
        <div className="welcome-page">
            <div className="header">
                <img src={logo} className="logo" alt="logo" />
            </div>
            <div className="container">
                <div>
                    <div className="title">Crypto.com Chain Wallet</div>
                    <div className="slogan">Our Sample Chain Wallet supports wallet management and funds transfer.</div>
                    <div className="button-container">
                        <Button>Restore Wallet</Button>
                        <Button type="primary">Create Wallet</Button>
                    </div>  
                </div>
                
            </div>
        </div>
    )
}

export default WelcomePage