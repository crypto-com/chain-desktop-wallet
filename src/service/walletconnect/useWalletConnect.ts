import WalletConnect from '@walletconnect/client';
import { IClientMeta, IJsonRpcRequest } from '@walletconnect/types';
import { useEffect, useState } from 'react';
import { atom, useRecoilState } from 'recoil';
import { useRefCallback } from '../../hooks/useRefCallback';
import { DefaultState, walletConnectStateAtom } from './store';
import { clearCachedSession, getCachedSession } from './utils';

export const useWalletConnect = () => {
  const [uri, setUri] = useState('');
  const [address, setAddress] = useState('');
  const [chainId, setChainId] = useState(0);
  const [state, setState] = useRecoilState(walletConnectStateAtom);

  const { connector } = state;

  useEffect(() => {
    // clearCachedSession();

    // const session = getCachedSession();

    // if (session) {
    //   try {
    //     const connector = new WalletConnect({ session });

    //     const { connected, accounts, peerMeta } = connector;

    //     setConnected(connected);
    //     setConnector(connector);
    //     setAddress(accounts[0]);
    //     setChainId(connector.chainId);
    //     setPeerMeta(peerMeta);

    //     subscribeToEvents.current();
    //   } catch {
    //     resetApp();
    //   }
    // }

    return () => {
      // killSession();
    };
  }, []);

  const rejectSession = async () => {
    console.log('ACTION', 'rejectSession');
    try {
      await connector?.rejectSession();
    } finally {
      resetApp();
    }
  };

  const killSession = async () => {
    console.log('ACTION', 'killSession');
    try {
      await connector?.killSession();
    } finally {
      resetApp();
    }
  };

  const approveSession = async (address: string) => {
    console.log('ACTION', 'approveSession');
    if (connector) {
      try {
        await connector.approveSession({
          accounts: [address],
          chainId: 1,
        });
        setState({
          ...state,
          connected: true,
        });
      } catch {}
    }
  };

  const connect = async (uri: string, chainId: number, account: string) => {
    setState({
      ...state,
      fetchingPeerMeta: true,
      loading: true,
    });

    try {
      const connector = new WalletConnect({ uri });

      if (!connector.connected) {
        await connector.createSession({ chainId });
      } else {
        if (connector.peerMeta) {
          setState({
            ...state,
            peerMeta: connector.peerMeta,
          });
        }
      }

      setState({
        ...state,
        connector,
      });
      setUri(connector.uri);
      subscribeToEvents.current();
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
    setAddress('');
    setChainId(0);
    setUri('');
    clearCachedSession();
  };

  const subscribeToEvents = useRefCallback(() => {
    console.log('ACTION', 'subscribeToEvents');

    if (connector) {
      connector.on('session_request', (error, payload) => {
        console.log('EVENT', 'session_request');

        if (error) {
          throw error;
        }
        console.log('SESSION_REQUEST', payload.params);
        const { peerMeta } = payload.params[0];
        setState({
          ...state,
          peerMeta,
          fetchingPeerMeta: false,
          loading: false,
        });
      });

      connector.on('session_update', error => {
        console.log('EVENT', 'session_update');

        if (error) {
          throw error;
        }
      });

      connector.on('call_request', async (error, payload: IJsonRpcRequest) => {
        console.log('EVENT', 'call_request', 'method', payload.method);
        console.log('EVENT', 'call_request', 'params', payload.params);

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
            console.log('unknown payload');
            break;
        }
      });

      connector.on('connect', error => {
        console.log('EVENT', 'connect');

        if (error) {
          throw error;
        }

        setState({
          ...state,
          connected: true,
        });
      });

      connector.on('disconnect', error => {
        console.log('EVENT', 'disconnect');

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
        });
        setAddress(address);
        setChainId(chainId);
      }

      setState({
        ...state,
        connector,
      });
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
