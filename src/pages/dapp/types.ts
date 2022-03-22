import { EVMChainConfig } from '../../models/Chain';
import { ContractData } from '../../service/rpc/models/cronos.models';

export interface Dapp {
  name: string;
  logo: string;
  alt: string;
  description: string;
  url: string;
}

export interface TokenApprovalRequestData {
  amount: string;
  spender: string;
  tokenData: ContractData;
}

export namespace DappBrowserIPC {
  export const ChannelName = 'dapp';

  export type EventName =
    | 'signTransaction'
    | 'signPersonalMessage'
    | 'signMessage'
    | 'signTypedMessage'
    | 'ecRecover'
    | 'requestAccounts'
    | 'watchAsset'
    | 'addEthereumChain'
    | 'switchEthereumChain'
    | 'tokenApproval';

  interface BaseEvent {
    id: number;
    name: EventName;
    object: {};
  }

  export interface SendTransactionEvent extends BaseEvent {
    name: 'signTransaction';
    object: {
      gas: number;
      gasPrice: string;
      from: string;
      to: string;
      data: string;
      value?: string;
    };
  }

  export interface TokenApprovalEvent extends BaseEvent {
    name: 'tokenApproval';
    object: {
      spender: string;
      amount: string;
      tokenData: ContractData;
      gas: number;
      gasPrice: string;
      from: string;
      to: string;
    };
  }

  export interface RequestAccountsEvent extends BaseEvent {
    name: 'requestAccounts';
    object: {};
  }

  export interface SignPersonalMessageEvent extends BaseEvent {
    name: 'signPersonalMessage';
    object: {
      data: string;
    };
  }

  export interface SignMessageEvent extends BaseEvent {
    name: 'signMessage';
    object: {
      data: string;
    };
  }

  export interface SignTypedMessageEvent extends BaseEvent {
    name: 'signTypedMessage';
    object: {
      raw: string;
      data?: string;
    };
  }

  export interface EcrecoverEvent extends BaseEvent {
    name: 'ecRecover';
    object: {
      signature: string;
      message: string;
    };
  }

  export interface WatchAssetEvent extends BaseEvent {
    name: 'watchAsset';
    object: {
      type: string;
      contract: string;
      symbol: string;
      decimals: number;
    };
  }

  export interface AddEthereumChainEvent extends BaseEvent {
    name: 'addEthereumChain';
    object: EVMChainConfig;
  }

  export interface SwitchEthereumChainEvent extends BaseEvent {
    name: 'switchEthereumChain';
    object: {
      chainId: string;
    }
  }

  export type Event =
    | SendTransactionEvent
    | RequestAccountsEvent
    | SignPersonalMessageEvent
    | SignMessageEvent
    | SignTypedMessageEvent
    | EcrecoverEvent
    | WatchAssetEvent
    | AddEthereumChainEvent
    | SwitchEthereumChainEvent
    | TokenApprovalEvent;
}

export const ChainConfigFormKeys = {
  chainId: 'chainId',
  chainName: 'chainName',
  rpcURL: 'rpcURL',
  explorerURL: 'explorerURL',
  symbol: 'symbol',
};

export interface ChainConfigFormData {
  chainId: number;
  chainName: string;
  rpcURL: string;
  explorerURL: string;
  symbol: string;
}

