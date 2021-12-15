import path from 'path';

const { remote } = window.require('electron');

export class ChainConfig {
  static ChainId = 0x19;

  static RpcUrl = 'https://evm-cronos.crypto.org';

  static ExplorerAPIUrl = 'https://cronos.crypto.org/explorer/api';
}

export const ProviderPreloadScriptPath =
  process.env.NODE_ENV === 'development'
    ? `file://${path.join(remote.app.getAppPath(), 'src/pages/dapp/browser/preload.js')}`
    : `file://${path.join(remote.app.getAppPath(), '../scripts/preload.js')}`;
