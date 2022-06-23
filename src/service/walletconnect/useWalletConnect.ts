import { DEFAULT_GAS_LIMIT } from '@crypto-org-chain/chain-jslib/lib/dist/transaction/v2.signable';
import WalletConnect from '@walletconnect/client';
import { IJsonRpcRequest } from '@walletconnect/types';
import { useState } from 'react';
import { useRecoilState } from 'recoil';
import { usePasswordModal } from '../../components/PasswordForm/PasswordFormModal';
import { DAppDefaultChainConfigs } from '../../config/DAppChainConfig';
import { EVM_MINIMUM_GAS_PRICE } from '../../config/StaticConfig';
import { useRefCallback } from '../../hooks/useRefCallback';
import { DappBrowserIPC } from '../../pages/dapp/types';
import { DefaultState, walletConnectConnectorAtom, walletConnectPeerMetaAtom, walletConnectStateAtom } from './store';
import { IWCRequest, TxParams } from './types';
import { clearCachedSession, getCachedSession } from './utils';

export const useWalletConnect = () => {
  const [chainId, setChainId] = useState(0);
  const [state, setState] = useRecoilState(walletConnectStateAtom);
  const [connector, setConnector] = useRecoilState(walletConnectConnectorAtom);
  const [peerMeta, setPeerMeta] = useRecoilState(walletConnectPeerMetaAtom);

  const [requests, setRequests] = useState<DappBrowserIPC.Event[]>([]);

  // const state = getRecoil(walletConnectStateAtom);

  // const setState = (newState: Partial<WalletConnectState>) => {
  //   setRecoil(walletConnectStateAtom, {...state, ...newState});
  // };

  const restoreSession = () => {
    const session = getCachedSession();

    if (session) {
      try {
        const connector = new WalletConnect({ session });

        const { connected, accounts, peerMeta } = connector;

        setConnector(connector);
        setState({
          ...state,
          connected,
          address: accounts[0],
        });
        setPeerMeta({...peerMeta});
        subscribeToEvents.current(connector);
      } catch {
        resetApp();
      }
    }
  };

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
    } catch (error) {
      log('ERROR', error);
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

  const approveRequest = (request: DappBrowserIPC.Event, result: any) => {
    log('ACTION', 'approveRequest');
    connector?.approveRequest({
      id: request.id,
      result,
    });

    const newRequests = requests.filter(r => r.id !== request.id);
    setRequests([...newRequests]);
  };

  const cancelRequest = (request: DappBrowserIPC.Event) => {
    log('ACTION', 'cancelRequest');
    const newRequests = requests.filter(r => r.id !== request.id);
    setRequests([...newRequests]);
    connector?.rejectRequest({id: request.id, error: { message: 'Failed or Rejected Request' },});
  };

  const connect = async (uri: string, chainId: number, account: string) => {
    log('ACTION', 'connect', uri, chainId, account);

    try {
      const connector = new WalletConnect({ uri });
      subscribeToEvents.current(connector);

      if (!connector.connected) {
        setState({
          ...state,
          fetchingPeerMeta: true,
          loading: true,
        });
        setPeerMeta({...peerMeta});
        setConnector(connector);
        await connector.createSession({ chainId });
      } else if (connector.peerMeta) {
        log('connector.peerMeta', connector.peerMeta);
        setState({
          ...state,
          connected: false,
          loading: false,
        });
        setPeerMeta({...peerMeta});
        setConnector(connector);
      } else {
        setState({
          ...state,
        });
        setConnector(connector);
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
    setConnector(null);
    setPeerMeta(null);
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
          fetchingPeerMeta: false,
          loading: false,
        });
        setPeerMeta({...peerMeta});
        setConnector(connector);
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
            setRequests([...requests, { id: payload.id, name: 'signPersonalMessage', object: {data: payload.params[0]} }]);
            break;
          case 'eth_sign':
            setRequests([...requests, { id: payload.id, name: 'signMessage', object: {data: payload.params[0]} }]);
            break;
          case 'eth_signTransaction': {
            const txParam = payload.params[0] as TxParams;

            setRequests([...requests, { id: payload.id, name: 'signTransaction', object: {
              chainConfig: DAppDefaultChainConfigs[0],
              ...txParam,
              gas: txParam.gas ?  Number(txParam.gas) : 0,
              gasPrice: txParam.gasPrice ?? EVM_MINIMUM_GAS_PRICE,
            } }]);
          }
            break;
          case 'eth_signTypedData':
            setRequests([...requests, {id: payload.id, name: 'signTypedMessage', object: {data: payload.params[0], raw: payload.params[1]} }]);
            break;
          case 'eth_sendTransaction': {
            const txParam = payload.params[0] as TxParams;

            setRequests([...requests, { id: payload.id, name: 'signTransaction', object: {
              chainConfig: DAppDefaultChainConfigs[0],
              ...txParam,
              gas: txParam.gas ?  Number(txParam.gas) : 0,
              gasPrice: txParam.gasPrice ?? EVM_MINIMUM_GAS_PRICE,
            } }]);
          }
            break;
          case 'eth_signPersonalMessage':
            setRequests([...requests, { id: payload.id, name: 'signPersonalMessage', object: {data: payload.params[0]} }]);
            break;
          case 'eth_signTypedData_v3':
            setRequests([...requests, { id: payload.id, name: 'signPersonalMessage', object: {data: payload.params[0]} }]);
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
    restoreSession,
    state,
    requests,
    approveRequest,
    cancelRequest
  };
};
