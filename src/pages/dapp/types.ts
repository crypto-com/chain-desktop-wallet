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
    | 'tokenApproval'
    | 'openLinkInDefaultBrowser';

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
    object: {
      chainId: number;
      name: string;
      rpcUrls: string[];
    };
  }
  export interface OpenLinkInDefaultBrowserEvent extends BaseEvent {
    name: 'openLinkInDefaultBrowser';
    object: {
      url: string;
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
    | TokenApprovalEvent
    | OpenLinkInDefaultBrowserEvent;
}
