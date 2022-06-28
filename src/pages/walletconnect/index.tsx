import * as React from 'react';
import { useRecoilValue } from 'recoil';
import { walletConnectPeerMetaAtom, walletConnectStateAtom } from '../../service/walletconnect/store';
import { Badge, Button, Layout } from 'antd';
import { Content } from 'antd/lib/layout/layout';
import { useTranslation } from 'react-i18next';
import { useWalletConnect } from '../../service/walletconnect/useWalletConnect';
import IconWalletConnect from '../../svg/IconWalletConnect';
import Icon from '@ant-design/icons';

const WalletConnectTab = () => {
  const [t] = useTranslation();
  const { killSession } = useWalletConnect();
  const state = useRecoilValue(walletConnectStateAtom);
  const peerMeta = useRecoilValue(walletConnectPeerMetaAtom);

  if (!peerMeta) {
    return <div />;
  }

  return (
    <Layout className="site-layout">
      <Content
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          margin: '0',
          color: '#0B1426',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Badge
            offset={[0, 60]}
            style={{
              padding: '6px',
              borderRadius: '20px',
              background: 'radial-gradient(100% 100% at 0% 50%, #5D9DF6 0%, #006FFF 100%)',
            }}
            count={<Icon style={{ color: 'white' }} component={IconWalletConnect} />}
          >
            <img style={{ width: '72px' }} src={peerMeta?.icons?.[0] ?? ''} />
          </Badge>
          <div style={{ marginTop: '12px', fontSize: '22px', fontWeight: 'bold' }}>
            {peerMeta?.name}
          </div>
          <div style={{ opacity: '0.5', marginTop: '10px' }}>{peerMeta.url}</div>
          <div style={{ color: '#00A68C' }}>{t('general.walletconnect.connected')}</div>
          <div style={{ marginTop: '30px', fontSize: '14px', opacity: '0.5' }}>
            {t('general.walletconnect.connect.desc6')}
          </div>
          <div style={{ marginTop: '20px' }}>
            <div style={{ color: '#626973' }}>{t('general.walletconnect.connect.desc7')}</div>
            <div
              style={{
                marginTop: '6px',
                background: '#F4F3F3',
                borderRadius: '4px',
                padding: '16px',
              }}
            >
              {state.address}
            </div>
          </div>
          <Button
            style={{
              marginTop: '20px',
            }}
            type="primary"
            onClick={() => {
              killSession.current();
            }}
          >
            {t('general.walletconnect.disconnect')}
          </Button>
        </div>
      </Content>
    </Layout>
  );
};

export default WalletConnectTab;
