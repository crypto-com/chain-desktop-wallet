import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode.react';
import { useRecoilValue } from 'recoil';
import './receive.less';
import 'antd/dist/antd.css';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Layout, Button, notification } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { sessionState } from '../../recoil/atom';
import { Session } from '../../models/Session';
import { LEDGER_WALLET_TYPE, createLedgerDevice } from '../../service/LedgerService';
import { AnalyticsService } from '../../service/analytics/AnalyticsService';

const { Header, Content, Footer } = Layout;

function ReceivePage() {
  const session: Session = useRecoilValue<Session>(sessionState);
  const [isLedger, setIsLedger] = useState(false);
  const analyticsService = new AnalyticsService(session);

  useEffect(() => {
    const { walletType } = session.wallet;
    setIsLedger(LEDGER_WALLET_TYPE === walletType);
    analyticsService.logPage('Receive');
  });

  const clickCheckLedger = async () => {
    try {
      const { addressIndex, walletType, config } = session.wallet;
      const addressprefix = config.network.addressPrefix;
      if (LEDGER_WALLET_TYPE === walletType) {
        const device = createLedgerDevice();
        await device.getAddress(addressIndex, addressprefix, true);
      }
    } catch (e) {
      notification.error({
        message: `Cannot detect any Ledger device`,
        description: `Please connect with your Ledger device`,
        placement: 'topRight',
        duration: 3,
      });
    }
  };

  const onCopyClick = () => {
    setTimeout(() => {
      notification.success({
        message: `Address Copied!`,
        description: `Current account is successfully copied to your clipboard`,
        placement: 'topRight',
        duration: 2,
        key: 'copy',
      });
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
                {session.wallet.address}
                <CopyOutlined />
              </div>
            </CopyToClipboard>
            {isLedger && (
              <div className="ledger">
                <Button type="primary" onClick={clickCheckLedger}>
                  Verify address on Ledger
                </Button>
              </div>
            )}
          </div>
        </div>
      </Content>
      <Footer />
    </Layout>
  );
}

export default ReceivePage;
