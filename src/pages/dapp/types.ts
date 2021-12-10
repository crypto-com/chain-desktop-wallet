export interface Dapp {
  name: string;
  logo: string;
  alt: string;
  description: string;
  url: string;
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
    | 'addEthereumChain';

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
      data: string;
      raw: string;
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

  export function instanceOfSendTransactionEvent(data: any): data is SendTransactionEvent {
    return 'name' in data;
  }

  export function instanceOfSignMessageEvent(data: any): data is SignMessageEvent {
    return 'name' in data;
  }

  export function instanceOfSignPersonalMessageEvent(data: any): data is SignPersonalMessageEvent {
    return 'name' in data;
  }

  export type Event =
    | SendTransactionEvent
    | RequestAccountsEvent
    | SignPersonalMessageEvent
    | SignMessageEvent
    | SignTypedMessageEvent
    | EcrecoverEvent
    | WatchAssetEvent
    | AddEthereumChainEvent;
}
