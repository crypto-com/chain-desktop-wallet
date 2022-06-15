import { Button, Modal, Spin } from 'antd';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { useCronosEvmAsset } from '../../hooks/useCronosEvmAsset';
import { PeerMetaInfo } from './components/PeerMetaInfo';
import { useWalletConnect } from './useWalletConnect';

const { ipcRenderer } = window.require('electron');

// const APP_PROTOCOL_NAME = 'cryptowallet';
const APP_PROTOCOL_NAME = 'ledgerlive';

export const WalletConnect = () => {
  const {
    connect,
    rejectSession,
    killSession,
    connected,
    peerMeta,
    approveSession,
    loading,
    isConnecting,
  } = useWalletConnect();

  const cronosAsset = useCronosEvmAsset();
  const address = cronosAsset?.address;

  const [showPeerInfoModal, setShowPeerInfoModal] = useState(false);

  useEffect(() => {
    ipcRenderer.on('open-url', (_event, urlString: string) => {
      if (urlString?.length < 1 || !urlString.startsWith(`${APP_PROTOCOL_NAME}://wc`)) {
        return;
      }

      const url = new URL(urlString);
      const wcURL = url.searchParams.get('uri');

      if (!wcURL) {
        return;
      }

      connect(wcURL, 1, address ?? '');
    });
  }, []);

  if (!address) {
    return <></>;
  }

  if (isConnecting) {
    return (
      <Modal
        visible
        title="WalletConnect"
        okText="Approve"
        okButtonProps={{ disabled: loading }}
        cancelText="Reject"
        closable={false}
        onCancel={() => {
          rejectSession();
        }}
        onOk={() => {
          approveSession(address);
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {loading && <Spin style={{ left: 'auto' }} />}
          {peerMeta && (
            <>
              <PeerMetaInfo peerMeta={peerMeta} />
              <div>Wants to connect</div>
            </>
          )}
        </div>
      </Modal>
    );
  }

  if (connected && peerMeta) {
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
            <PeerMetaInfo peerMeta={peerMeta} />
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
        <Button onClick={() => setShowPeerInfoModal(true)}>{peerMeta?.name}</Button>
      </>
    );
  }

  return <></>;
};
