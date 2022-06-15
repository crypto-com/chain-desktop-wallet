import { Button, Modal } from 'antd';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { useCronosEvmAsset } from '../../hooks/useCronosEvmAsset';
import { useWalletConnect } from './useWalletConnect';

const { ipcRenderer } = window.require('electron');

// const APP_PROTOCOL_NAME = 'cryptowallet';
const APP_PROTOCOL_NAME = 'ledgerlive';

export const WalletConnect = () => {
  const { connect, killSession, connected, peerMeta, connector } = useWalletConnect();

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

  if (!connected && peerMeta) {
    return (
      <Modal
        visible
        onOk={() => {
          connector?.approveSession({
            accounts: [address],
            chainId: 1,
          });
        }}
      >
        {peerMeta.name}
      </Modal>
    );
  }

  if (connected) {
    return (
      <>
        <Modal
          visible={showPeerInfoModal}
          okButtonProps={{ hidden: true }}
          cancelButtonProps={{ hidden: true }}
          onCancel={() => setShowPeerInfoModal(false)}
        >
          <div>{peerMeta?.name}</div>
          <div>{peerMeta?.description}</div>
          <div>{peerMeta?.url}</div>
          <div>
            {peerMeta?.icons.map(icon => {
              return <img src={icon} />;
            })}
          </div>
          <Button
            onClick={() => {
              killSession();
            }}
          >
            Disconnect
          </Button>
        </Modal>
        <Button onClick={() => setShowPeerInfoModal(true)}>{peerMeta?.name}</Button>
      </>
    );
  }

  return <></>;
};
