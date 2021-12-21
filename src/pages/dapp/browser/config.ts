import path from 'path';

const { remote } = window.require('electron');

export class ChainConfig {
  static ChainId = 0x19;

  static RpcUrl = 'https://evm-cronos.crypto.org';

  static ExplorerAPIUrl = 'https://cronos.crypto.org/explorer/api';
}

export const ProviderPreloadScriptPath =
  // Replace backslash on Windows to forwardslash
  process.env.NODE_ENV === 'development'
    ? `file://${path.join(
        remote.app.getAppPath().replace(/\\/g, '/'),
        'src/pages/dapp/browser/preload.js',
      )}`
    : `file://${path.join(remote.app.getAppPath().replace(/\\/g, '/'), '../scripts/preload.js')}`;
