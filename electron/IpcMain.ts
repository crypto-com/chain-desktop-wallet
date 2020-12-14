import { Bytes } from '@crypto-com/chain-jslib/lib/dist/utils/bytes/bytes';
const { ipcMain } = require('electron');
import { LedgerSigner, LedgerConfig } from './LedgerSigner';
import { BIP44 } from '@chainapsis/cosmosjs/core/bip44';
export class IpcMain {
  provider: LedgerSigner;
  constructor() {
    let config = new LedgerConfig(false, new BIP44(44, 394));
    this.provider = new LedgerSigner(config, 'HID');
  }
  setup() {
    ipcMain.on('asynchronous-message', (event, arg) => {
      event.reply('asynchronous-reply', 'pong');
    });

    ipcMain.on('synchronous-message', (event, arg) => {
      event.returnValue = 'pong';
    });

    ipcMain.on('enableWallet', async (event, arg) => {
      try {
        await this.provider.enable();
      } catch (e) {
        console.error('enableWallet error ' + e);
      } finally {
      }

      let accountInfo = this.provider.getAccAddress();

      let accountPubKey = this.provider.getPubKey();
      let ret = { account: accountInfo, pubKey: accountPubKey, label: 'enableWallet reply' };

      event.returnValue = ret;
    });

    ipcMain.on('getAccount', async (event, arg) => {
      let accountInfo = this.provider.getAccAddress();
      let ret = { account: accountInfo, label: 'getAccount reply' };
      event.returnValue = ret;
    });

    // arg: string
    ipcMain.on('signMessage', async (event, arg) => {
      let argBuffer = Buffer.from(arg);
      let signature = await this.provider.sign(Bytes.fromUint8Array(argBuffer));
      let signatureArray = signature.toUint8Array();
      let ret = { signed: signatureArray, original: arg, label: 'signMessage reply' };
      event.returnValue = ret;
    });
  }
}
