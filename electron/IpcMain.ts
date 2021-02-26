import { Bytes } from '@crypto-com/chain-jslib/lib/dist/utils/bytes/bytes';
const { ipcMain } = require('electron');
import { LedgerSignerNative } from './LedgerSignerNative';
export class IpcMain {
  provider: LedgerSignerNative;
  constructor() {
    this.provider = new LedgerSignerNative();
  }
  setup() {
    ipcMain.on('asynchronous-message', (event: any, arg: any) => {
      event.reply('asynchronous-reply', 'pong');
    });

    ipcMain.on('synchronous-message', (event: any, arg: any) => {
      event.returnValue = 'pong';
    });

    ipcMain.on('enableWallet', async (event: any, arg: any) => {
      let ret = {};
      try {
        let index = arg.index;
        let addressPrefix = arg.addressPrefix;
        let showLedgerDisplay = arg.showLedgerDisplay;
        const info = await this.provider.enable(index, addressPrefix, showLedgerDisplay);
        let accountInfo = info[0];
        let accountPubKey = info[1].toUint8Array();
        ret = {
          success: true,
          account: accountInfo,
          pubKey: accountPubKey,
          label: 'enableWallet reply',
        };
      } catch (e) {
        ret = {
          success: false,
          error: JSON.stringify(e),
        };
        console.error('enableWallet error ' + e);
      } finally {
      }

      event.returnValue = ret;
    });
    // arg: string
    ipcMain.on('signMessage', async (event: any, arg: any) => {
      let ret = {};
      try {
        let argBuffer = Buffer.from(arg);
        let signature = await this.provider.sign(Bytes.fromBuffer(argBuffer));
        let signatureArray = signature.toUint8Array();
        ret = {
          success: true,
          signed: signatureArray,
          original: arg,
          label: 'signMessage reply',
        };
      } catch (e) {
        ret = {
          success: false,
          error: JSON.stringify(e),
        };
        console.error('signMessage error ' + e);
      }
      event.returnValue = ret;
    });
  }
}
