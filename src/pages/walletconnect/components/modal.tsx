import * as React from 'react';
import { useCallback, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import { useCronosEvmAsset } from '../../../hooks/useCronosEvmAsset';
import { navbarMenuSelectedKeyState } from '../../../recoil/atom';
import { useWalletConnect } from '../../../service/walletconnect/useWalletConnect';
import { ConnectModal } from './ConnectModal';

const { ipcRenderer } = window.require('electron');

// const APP_PROTOCOL_NAME = 'cryptowallet';
const APP_PROTOCOL_NAME = 'ledgerlive';
const WALLET_CONNECT_PAGE_KEY = '/walletconnect';

export const WalletConnectModal = () => {
  const { connect, state, restoreSession } = useWalletConnect();
  const history = useHistory();

  const cronosAsset = useCronosEvmAsset();
  const address = cronosAsset?.address;
  const [navbarMenuSelectedKey, setNavbarMenuSelectedKey] = useRecoilState(
    navbarMenuSelectedKeyState,
  );

  useEffect(() => {
    if (state.connected) {
      history.push(WALLET_CONNECT_PAGE_KEY);
      setNavbarMenuSelectedKey(WALLET_CONNECT_PAGE_KEY);
    } else {
      if (navbarMenuSelectedKey === '/walletconnect') {
        history.push('/home');
        setNavbarMenuSelectedKey('/home');
      }
    }
  }, [state.connected]);

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

  }, []);


  useEffect(() => {
    ipcRenderer.on('open-url', handleOpenURL);
    restoreSession();

    return () => {
      ipcRenderer.removeListener('open-url', handleOpenURL);
    };
  }, []);

  if (!address) {
    return <></>;
  }

  return (
    <>
      <ConnectModal address={address} />
    </>
  );
};
