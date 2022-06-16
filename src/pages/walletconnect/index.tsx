import * as React from 'react';
import { IClientMeta } from '@walletconnect/types';
import { useRecoilState } from 'recoil';
import { walletConnectStateAtom } from '../../service/walletconnect/store';
import { Layout } from 'antd';
import { Content, Footer, Header } from 'antd/lib/layout/layout';
import { useTranslation } from 'react-i18next';
import { PeerMetaInfo } from './components/PeerMetaInfo';

const WalletConnectTab = () => {
  const [t] = useTranslation();
  const [state, setState] = useRecoilState(walletConnectStateAtom);

  return (
    <Layout className="site-layout">
      <Content>
        <PeerMetaInfo />
      </Content>
      <Footer />
    </Layout>
  );
};

export default WalletConnectTab;
