import WalletConnect from '@walletconnect/client';
import { IJsonRpcRequest } from '@walletconnect/types';
import { useCallback, useState } from 'react';
import { useRecoilState } from 'recoil';
import { hexToNumber, isHex, utf8ToHex } from 'web3-utils';
import { EVM_MINIMUM_GAS_PRICE } from '../../config/StaticConfig';
import { useRefCallback } from '../../hooks/useRefCallback';
import { EVMChainConfig } from '../../models/Chain';
import { useChainConfigs } from '../../pages/dapp/browser/useChainConfigs';
import { DappBrowserIPC } from '../../pages/dapp/types';
import { fillInTransactionEventData } from '../../pages/dapp/utils';
import {
  DefaultState,
  walletConnectConnectorAtom,
  walletConnectPeerMetaAtom,
  walletConnectSelectedChainConfigAtom,
  walletConnectStateAtom
} from './store';
import { TxParams } from './types';
import { clearCachedSession, getCachedSession } from './utils';

export const useWalletConnect = () => {
  const [state, setState] = useRecoilState(walletConnectStateAtom);
  const [connector, setConnector] = useRecoilState(walletConnectConnectorAtom);
  const [peerMeta, setPeerMeta] = useRecoilState(walletConnectPeerMetaAtom);
  const [chainConfig, setChainConfig] = useRecoilState(walletConnectSelectedChainConfigAtom);
  const [requests, setRequests] = useState<DappBrowserIPC.Event[]>([]);

  const { list: chainConfigs } = useChainConfigs();

  const restoreSession = () => {
    const session = getCachedSession();

    if (session) {
      try {
        const connector = new WalletConnect({ session });

        const { connected, accounts, peerMeta, chainId } = connector;

        setConnector(connector);
        setState({
          ...state,
          connected,
          address: accounts[0],
        });
        setPeerMeta({ ...peerMeta });

        const foundConfig = chainConfigs.find(c => hexToNumber(c.chainId) === chainId);
        if (foundConfig) {
          setChainConfig(foundConfig);
        }

        subscribeToEvents.current(connector);
      } catch {
        resetApp.current();
      }
    }
  };

  const log = (message?: any, ...optionalParams: any[]) => {
    console.log('[WalletConnect] ', message, ...optionalParams);
  };

  const rejectSession = useCallback(async () => {
    log('ACTION', 'rejectSession');
    try {
      await connector?.rejectSession();
    } finally {
      resetApp.current();
    }
  }, [connector]);

  const killSession = useRefCallback(async () => {
    log('ACTION', 'killSession');
    try {
      await connector?.killSession();
      resetApp.current();
    } catch (error) {
      log('ERROR', error);
    }
  });

  const approveSession = async (address: string, chainConfig: EVMChainConfig) => {
    log('ACTION', 'approveSession');
    if (connector) {
      try {
        await connector.approveSession({
          accounts: [address],
          chainId: hexToNumber(chainConfig.chainId),
          rpcUrl: chainConfig.rpcUrls[0],
        });
        setChainConfig(chainConfig);
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
    connector?.rejectRequest({ id: request.id, error: { message: 'Failed or Rejected Request' }, });
  };

  const connect = useRefCallback(async (uri: string, chainId: number, account: string) => {
    await killSession.current();
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
        setConnector(connector);
        await connector.createSession({ chainId });
      } else if (connector.peerMeta) {
        log('connector.peerMeta', connector.peerMeta);
        setState({
          ...state,
          connected: false,
          loading: false,
        });
        setPeerMeta({ ...peerMeta });
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
  });

  const resetApp = useRefCallback(() => {
    setState({
      ...DefaultState,
    });
    setPeerMeta(null);
    setConnector(null);
    clearCachedSession();
  });

  const handleCallRequest = useRefCallback(async (error, payload: IJsonRpcRequest) => {
    log('EVENT', 'call_request', 'method: ', payload.method, 'params: ', payload.params);

    if (error) {
      throw error;
    }

    if (!chainConfig) {
      throw new Error('Not connected');
    }

    switch (payload.method) {
      case 'personal_sign':
        setRequests([...requests, { id: payload.id, name: 'signPersonalMessage', object: { data: payload.params[0], params: payload.params } }]);
        break;
      case 'eth_sign':
        setRequests([...requests, { id: payload.id, name: 'signMessage', object: { data: payload.params[1] } }]);
        break;

      case 'eth_signTypedData':
        setRequests([...requests, { id: payload.id, name: 'signTypedMessage', object: { data: payload.params[0], raw: payload.params[1] } }]);
        break;
      case 'eth_signTransaction': {
        const txParam = payload.params[0] as TxParams;

        const request = await fillInTransactionEventData({ 
          id: payload.id, 
          name: 'signTransaction', 
          object: {
            chainConfig: chainConfig,
            ...txParam,
            gas: txParam.gas ?  Number(txParam.gas) : 0,
            gasPrice: txParam.gasPrice ?? EVM_MINIMUM_GAS_PRICE, } }, chainConfig);

        setRequests([...requests, request]);
      }
        break;
      case 'eth_sendTransaction': {
        const txParam = payload.params[0] as TxParams;

        const request = await fillInTransactionEventData({ id: payload.id, name: 'sendTransaction', object: {
          chainConfig: chainConfig,
          ...txParam,
          gas: txParam.gas ?  Number(txParam.gas) : 0,
          gasPrice: txParam.gasPrice ?? EVM_MINIMUM_GAS_PRICE,
        } }, chainConfig);

        setRequests([...requests, request]);
      }
        break;
      case 'eth_signPersonalMessage':
        setRequests([...requests, { id: payload.id, name: 'signPersonalMessage', object: { data: payload.params[0], params: payload.params } }]);
        break;
      case 'eth_signTypedData_v3':
        setRequests([...requests, { id: payload.id, name: 'signPersonalMessage', object: { data: payload.params[0], params: payload.params } }]);
        break;
      default:
        log('unknown payload');
        break;
    }
  }
  );

  const subscribeToEvents = useRefCallback((connector: WalletConnect) => {
    log('ACTION', 'subscribeToEvents');

    if (connector) {
      connector.on('session_request', (error, payload) => {
        log('EVENT', 'session_request');

        if (error) {
          throw error;
        }
        if(!isHex(payload.params[0])) {
          payload.params[0] = utf8ToHex(payload.params[0]);
        }
        log('SESSION_REQUEST', payload.params);
        const { peerMeta } = payload.params[0];
        setState({
          ...state,
          fetchingPeerMeta: false,
          loading: false,
        });
        setPeerMeta({ ...peerMeta });
        setConnector(connector);
      });

      connector.on('session_update', error => {
        log('EVENT', 'session_update');

        if (error) {
          throw error;
        }
      });

      connector.on('call_request', async (error, payload: IJsonRpcRequest) => {
        if(!isHex(payload.params[0])) {
          payload.params[0] = utf8ToHex(payload.params[0]);
        }
        handleCallRequest.current(error, payload);
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

        resetApp.current();
      });

      if (connector.connected) {
        const { accounts } = connector;
        const index = 0;
        const address = accounts[index];
        setState({
          ...state,
          connected: true,
          address,
        });
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
