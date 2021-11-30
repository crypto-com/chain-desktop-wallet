import path from 'path';

const { remote } = window.require('electron');

export class ChainConfig {
  static ChainId = 0x19;

  static RpcUrl = 'https://evm-cronos.crypto.org';

  static ExplorerAPIUrl = 'https://cronos.crypto.org/explorer/api';
}

// TODO: make it work under production
export const ProviderPreloadScriptPath = `file://${path.join(
  remote.app.getAppPath(),
  'src/pages/dapp/browser/preload.js',
)}`;
