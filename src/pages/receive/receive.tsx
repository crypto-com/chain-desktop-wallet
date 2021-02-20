import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode.react';
import { useRecoilValue } from 'recoil';
import './receive.less';
import 'antd/dist/antd.css';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Layout, Button } from 'antd';
import MouseTooltip from 'react-sticky-mouse-tooltip';
import { CopyOutlined } from '@ant-design/icons';
import { sessionState } from '../../recoil/atom';
import { Session } from '../../models/Session';
import { LEDGER_WALLET_TYPE, createLedgerDevice } from '../../service/LedgerService';

const { Header, Content, Footer } = Layout;

function ReceivePage() {
  const [mouseTooltip, setMouseTooltip] = useState(false);
  const session: Session = useRecoilValue<Session>(sessionState);
  const [isLedger, setIsLedger] = useState(false);

  useEffect(() => {
    const { walletType } = session.wallet;
    setIsLedger(LEDGER_WALLET_TYPE === walletType);
  });

  const clickCheckLedger = async () => {
    try {
      const { walletType, config } = session.wallet;
      const addressprefix = config.network.addressPrefix;
      if (LEDGER_WALLET_TYPE === walletType) {
        const device = createLedgerDevice();
        await device.getAddress(0, addressprefix, true);
      }
    } catch (e) {
      alert(`Cannot detect ledger device ${e}`);
    }
  };

  const onCopyClick = () => {
    setMouseTooltip(true);
    setTimeout(() => {
      setMouseTooltip(false);
    }, 100);
  };
  return (
    <Layout className="site-layout">
      <Header className="site-layout-background">Receive</Header>
      <div className="header-description">Receive funds by sharing the below wallet address.</div>
      <Content>
        <div className="site-layout-background receive-content">
          <div className="container">
            <div className="address">
              <QRCode value={session.wallet.address} size={180} />
              <div className="name">{session.wallet.name}</div>
            </div>
            <CopyToClipboard text={session.wallet.address}>
              <div className="copy" onClick={onCopyClick}>
                {session.wallet.address} <CopyOutlined />
                <MouseTooltip
                  offsetX={15}
                  offsetY={0}
                  className={`mouse-tooltip ${mouseTooltip ? '' : 'hide'}`}
                >
                  <span>Copied!</span>
                </MouseTooltip>
              </div>
            </CopyToClipboard>
          </div>
        </div>

        {isLedger && (
          <div className="ledger">
            <Button type="primary" onClick={clickCheckLedger}>
              Check Ledger
            </Button>
          </div>
        )}
      </Content>
      <Footer />
    </Layout>
  );
}

export default ReceivePage;
