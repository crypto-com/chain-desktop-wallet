import WalletConnect from '@walletconnect/client';
import { IJsonRpcRequest } from '@walletconnect/types';
import { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { useRefCallback } from '../../hooks/useRefCallback';
import { DefaultState, walletConnectStateAtom } from './store';
import { clearCachedSession, getCachedSession } from './utils';

export const useWalletConnect = () => {
  const [chainId, setChainId] = useState(0);
  const [state, setState] = useRecoilState(walletConnectStateAtom);
  const { connector } = state;
  // const state = getRecoil(walletConnectStateAtom);

  // const setState = (newState: Partial<WalletConnectState>) => {
  //   setRecoil(walletConnectStateAtom, {...state, ...newState});
  // };

  useEffect(() => {
    // clearCachedSession();

    const session = getCachedSession();

    if (session) {
      try {
        const connector = new WalletConnect({ session });

        const { connected, accounts, peerMeta } = connector;

        setState({
          ...state,
          connector,
          connected,
          address: accounts[0],
          peerMeta,
        });
        subscribeToEvents.current(connector);
      } catch {
        resetApp();
      }
    }

    return () => {
      // killSession();
    };
  }, []);

  const log = (message?: any, ...optionalParams: any[]) => {
    console.log('[WalletConnect] ', message, ...optionalParams);
  };

  const rejectSession = async () => {
    log('ACTION', 'rejectSession');
    try {
      await connector?.rejectSession();
    } finally {
      resetApp();
    }
  };

  const killSession = async () => {
    log('ACTION', 'killSession');
    try {
      await connector?.killSession();
    } finally {
      resetApp();
    }
  };

  const approveSession = async (address: string) => {
    log('ACTION', 'approveSession');
    if (connector) {
      try {
        await connector.approveSession({
          accounts: [address],
          chainId: 1,
        });
        setState({
          ...state,
          address,
          connected: true,
        });
      } catch {}
    }
  };

  const connect = async (uri: string, chainId: number, account: string) => {
    log('ACTION', 'connect', uri, chainId, account);

    try {
      const connector = new WalletConnect({ uri });
      subscribeToEvents.current(connector);

      if (!connector.connected) {
        setState({
          ...state,
          peerMeta: null,
          fetchingPeerMeta: true,
          loading: true,
          connector,
        });
        await connector.createSession({ chainId });
      } else if (connector.peerMeta) {
        log('connector.peerMeta', connector.peerMeta);
        setState({
          ...state,
          peerMeta: connector.peerMeta,
          connected: false,
          loading: false,
          connector,
        });
      } else {
        setState({
          ...state,
          connector,
        });
      }
    } catch (error) {
      setState({
        ...state,
        loading: false,
        fetchingPeerMeta: false,
      });
      throw error;
    }
  };

  const resetApp = () => {
    setState({
      ...DefaultState,
    });
    setChainId(0);
    clearCachedSession();
  };

  const subscribeToEvents = useRefCallback((connector: WalletConnect) => {
    log('ACTION', 'subscribeToEvents');

    if (connector) {
      connector.on('session_request', (error, payload) => {
        log('EVENT', 'session_request');

        if (error) {
          throw error;
        }
        log('SESSION_REQUEST', payload.params);
        const { peerMeta } = payload.params[0];
        setState({
          ...state,
          peerMeta,
          connector,
          fetchingPeerMeta: false,
          loading: false,
        });
      });

      connector.on('session_update', error => {
        log('EVENT', 'session_update');

        if (error) {
          throw error;
        }
      });

      connector.on('call_request', async (error, payload: IJsonRpcRequest) => {
        log('EVENT', 'call_request', 'method', payload.method);
        log('EVENT', 'call_request', 'params', payload.params);

        if (error) {
          throw error;
        }

        switch (payload.method) {
          case 'personal_sign':
            break;
          case 'eth_sign':
            break;
          case 'eth_signTransaction':
            break;
          case 'eth_signTypedData':
            break;
          case 'eth_sendTransaction':
            break;
          case 'eth_signPersonalMessage':
            break;
          case 'eth_signTypedData_v3':
            break;
          default:
            log('unknown payload');
            break;
        }
      });

      connector.on('connect', error => {
        log('EVENT', 'connect');

        if (error) {
          throw error;
        }

        setState({
          ...state,
          connected: true,
        });
      });

      connector.on('disconnect', error => {
        log('EVENT', 'disconnect');

        if (error) {
          throw error;
        }

        resetApp();
      });

      if (connector.connected) {
        const { chainId, accounts } = connector;
        const index = 0;
        const address = accounts[index];
        setState({
          ...state,
          connected: true,
          address,
        });
        setChainId(chainId);
      }
    }
  });

  return {
    connect,
    approveSession,
    rejectSession,
    killSession,
    state,
  };
};
