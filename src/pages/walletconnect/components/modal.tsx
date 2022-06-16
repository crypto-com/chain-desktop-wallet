import { SettingOutlined } from '@ant-design/icons';
import { Button, Menu, Modal, Spin } from 'antd';
import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { useCronosEvmAsset } from '../../../hooks/useCronosEvmAsset';
import { walletConnectStateAtom } from '../../../service/walletconnect/store';
import { useWalletConnect } from '../../../service/walletconnect/useWalletConnect';
import { ConnectModal } from './ConnectModal';
import { PeerMetaInfo } from './PeerMetaInfo';

const { ipcRenderer } = window.require('electron');

// const APP_PROTOCOL_NAME = 'cryptowallet';
const APP_PROTOCOL_NAME = 'ledgerlive';

export const WalletConnectModal = () => {
  const { connect, rejectSession, killSession, approveSession, state } = useWalletConnect();

  const cronosAsset = useCronosEvmAsset();
  const address = cronosAsset?.address;

  const [showPeerInfoModal, setShowPeerInfoModal] = useState(false);

  const handleOpenURL = useCallback(
    (_event, urlString: string) => {
      console.log('ACTION handleOpenURL');
      if (urlString?.length < 1 || !urlString.startsWith(`${APP_PROTOCOL_NAME}://wc`)) {
        return;
      }

      const url = new URL(urlString);
      const wcURL = url.searchParams.get('uri');

      if (!wcURL) {
        return;
      }

      connect(wcURL, 1, address ?? '');
    },
    [connect],
  );

  useEffect(() => {
    ipcRenderer.on('open-url', handleOpenURL);

    return () => {
      ipcRenderer.removeListener('open-url', handleOpenURL);
    };
  }, []);

  if (!address) {
    return <></>;
  }

  if (state.fetchingPeerMeta || (!state.connected && state.peerMeta)) {
    return <ConnectModal address={address} />;
  }

  if (state.connected && state.peerMeta) {
    return (
      <>
        <Modal
          visible={showPeerInfoModal}
          okButtonProps={{ hidden: true }}
          cancelButtonProps={{ hidden: true }}
          title="WalletConnect"
          onCancel={() => setShowPeerInfoModal(false)}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <PeerMetaInfo />
            <div>Connected</div>
            <Button
              style={{ marginTop: '30px' }}
              onClick={() => {
                killSession();
              }}
            >
              Disconnect
            </Button>
          </div>
        </Modal>
      </>
    );
  }

  return <></>;
};
