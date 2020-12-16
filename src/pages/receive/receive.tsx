import React, { useState } from 'react';
import QRCode from 'qrcode.react';
import { useRecoilValue } from 'recoil';
import './receive.less';
import 'antd/dist/antd.css';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Layout } from 'antd';
import MouseTooltip from 'react-sticky-mouse-tooltip';
import { CopyOutlined } from '@ant-design/icons';
import { sessionState } from '../../recoil/atom';
import { Session } from '../../models/Session';

const { Header, Content, Footer } = Layout;

function ReceivePage() {
  const [mouseTooltip, setMouseTooltip] = useState(false);
  const session: Session = useRecoilValue<Session>(sessionState);
  const onCopyClick = () => {
    setMouseTooltip(true);
    setTimeout(() => {
      setMouseTooltip(false);
    }, 100);
  };
  return (
    <Layout className="site-layout">
      <Header className="site-layout-background">Receive</Header>
      <Content>
        <div className="site-layout-background receive-content">
          <div className="container">
            <div className="description">Share your wallet address to receive payments.</div>
            <div className="address">
              <QRCode value={session.wallet.address} size={180} />
              <div>{session.wallet.address}</div>
            </div>
            <CopyToClipboard text={session.wallet.address}>
              <div className="copy" onClick={onCopyClick}>
                <CopyOutlined /> Copy address
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
      </Content>
      <Footer />
    </Layout>
  );
}

export default ReceivePage;
