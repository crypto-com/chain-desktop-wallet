// import { WebviewTag } from 'electron';
// import { useEffect } from 'react';
// import { ChainConfig } from './config';
// import { DappBrowserIPC } from './types';

export const ProviderPreloadScriptPath =
  'file:///Users/xinyu/Developer/cro/chain-desktop-wallet/src/pages/settings/tabs/DappBrowser/preload.js';

// type WebView = WebviewTag & HTMLWebViewElement;

// type ErrorHandler = (reason: string) => void;

// interface IUseIPCProviderProps {
//   webview: WebView | null;
//   onRequestAddress: (onSuccess: (address: string) => void, onError: ErrorHandler) => Promise<void>;
//   onSignTransaction: (
//     event: DappBrowserIPC.SendTransactionEvent,
//     onSuccess: (signedTx: string) => void,
//     onError: ErrorHandler,
//   ) => Promise<void>;
//   onSignMessage: (
//     event: DappBrowserIPC.SignMessageEvent,
//     onSuccess: (signedMessage: string) => void,
//     onError: ErrorHandler,
//   ) => Promise<void>;
//   onSignPersonalMessage: (
//     event: DappBrowserIPC.SignPersonalMessageEvent,
//     onSuccess: (signedMessage: string) => void,
//     onError: ErrorHandler,
//   ) => Promise<void>;
//   onSignTypedMessage: (
//     event: DappBrowserIPC.SignTypedMessageEvent,
//     onSuccess: (signedMessage: string) => void,
//     onError: ErrorHandler,
//   ) => Promise<void>;
//   onEcRecover: (
//     event: DappBrowserIPC.EcrecoverEvent,
//     onSuccess: (address: string) => void,
//     onError: ErrorHandler,
//   ) => Promise<void>;
//   onWatchAsset: (
//     event: DappBrowserIPC.WatchAssetEvent,
//     onSuccess: () => void,
//     onError: ErrorHandler,
//   ) => Promise<void>;
//   onAddEthereumChain: (
//     event: DappBrowserIPC.AddEthereumChainEvent,
//     onSuccess: () => void,
//     onError: ErrorHandler,
//   ) => Promise<void>;
// }

// export const useWebviewIPCProvider = (props: IUseIPCProviderProps) => {

// };
