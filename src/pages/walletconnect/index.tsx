import * as React from 'react';
import { IClientMeta } from '@walletconnect/types';
import { useRecoilState } from 'recoil';
import { walletConnectStateAtom } from '../../service/walletconnect/store';
import { Button, Layout } from 'antd';
import { Content, Footer, Header } from 'antd/lib/layout/layout';
import { useTranslation } from 'react-i18next';
import { PeerMetaInfo } from './components/PeerMetaInfo';
import { useWalletConnect } from '../../service/walletconnect/useWalletConnect';

const WalletConnectTab = () => {
  const [t] = useTranslation();
  const { killSession } = useWalletConnect();
  const [state, setState] = useRecoilState(walletConnectStateAtom);

  const { peerMeta, address } = state;

  if (!peerMeta) {
    return <div>Not Connected</div>;
  }

  return (
    <Layout className="site-layout">
      <Content>
        <div>
          <img src={peerMeta.icons[0]} />
          <div>{peerMeta.name}</div>
          <div>{peerMeta.url}</div>
          <div>Connected</div>
          <div>You can now access DApp on your web browser</div>
          <div>Wallet Address</div>
          <div>{address}</div>
          <Button
            onClick={() => {
              killSession();
            }}
          >
            Disconnect
          </Button>
        </div>
      </Content>
      <Footer />
    </Layout>
  );
};

export default WalletConnectTab;
