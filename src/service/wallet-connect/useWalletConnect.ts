import WalletConnect from '@walletconnect/client';
import { IClientMeta } from '@walletconnect/types';
import { useCallback, useEffect, useState } from 'react';
import { useRefCallback } from '../../hooks/useRefCallback';
import { clearCachedSession, getCachedSession } from './utils';

export const useWalletConnect = () => {
  const [connector, setConnector] = useState<WalletConnect | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uri, setUri] = useState('');
  const [peerMeta, setPeerMeta] = useState<IClientMeta | null>(null);
  const [address, setAddress] = useState('');
  const [chainId, setChainId] = useState(0);

  useEffect(() => {
    clearCachedSession();

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
  }, []);

  const killSession = async () => {
    console.log('ACTION', 'killSession');
    if (connector) {
      await connector.killSession();
    }
    resetApp();
  };

  const connect = async (uri: string, chainId: number, account: string) => {
    setLoading(true);

    try {
      const connector = new WalletConnect({ uri });
      setConnector(connector);
      setUri(connector.uri);
      setLoading(false);
      subscribeToEvents.current();

      if (!connector.connected) {
        await connector.createSession({ chainId });
      } else {
        if (connector.peerMeta) {
          setPeerMeta(connector.peerMeta);
        }
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const resetApp = () => {
    setConnector(null);
    setConnected(false);
    setPeerMeta(null);
    setAddress('');
    setChainId(0);
    setUri('');
    setLoading(false);
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
        setPeerMeta({ ...peerMeta });
      });

      connector.on('session_update', error => {
        console.log('EVENT', 'session_update');

        if (error) {
          throw error;
        }
      });

      connector.on('call_request', async (error, payload) => {
        // tslint:disable-next-line
        console.log('EVENT', 'call_request', 'method', payload.method);
        console.log('EVENT', 'call_request', 'params', payload.params);

        if (error) {
          throw error;
        }

        // await getAppConfig().rpcEngine.router(payload, this.state, this.bindedSetState);
      });

      connector.on('connect', error => {
        console.log('EVENT', 'connect');

        if (error) {
          throw error;
        }

        setConnected(true);
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
        setConnected(true);
        setAddress(address);
        setChainId(chainId);
      }

      setConnector(connector);
    }
  });

  return { connect, killSession, connected, peerMeta, connector };
};
