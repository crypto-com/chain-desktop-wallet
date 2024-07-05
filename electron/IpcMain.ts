import { Bytes } from '@crypto-org-chain/chain-jslib/lib/dist/utils/bytes/bytes';

const { ipcMain } = require('electron');
import { LedgerSignerNative } from './LedgerSignerNative';
import { LedgerEthSigner } from './LedgerEthSigner';
export class IpcMain {
  provider: LedgerSignerNative;
  ethProvider: LedgerEthSigner;
  constructor() {
    this.provider = new LedgerSignerNative();
    this.ethProvider = new LedgerEthSigner();
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
        let chainName = arg.chainName;
        let derivationPathStandard = arg.derivationPathStandard;
        let showLedgerDisplay = arg.showLedgerDisplay;
        const info = await this.provider.enable(index, addressPrefix, chainName, derivationPathStandard, showLedgerDisplay);
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
          error: (e as any).toString(),
        };
        console.error('enableWallet error ' + e);
      } finally {
      }

      event.returnValue = ret;
    });

    ipcMain.on('getAddressList', async (event: any, arg: any) => {
      let ret = {};
      try {
        let startIndex = arg.startIndex;
        let gap = arg.gap;
        let addressPrefix = arg.addressPrefix;
        let chainName = arg.chainName;
        let derivationPathStandard = arg.derivationPathStandard;
        const addressList = await this.provider.getAddressList(startIndex, gap, addressPrefix, chainName, derivationPathStandard);
        ret = {
          success: true,
          addressList: addressList,
          label: 'getAddressList reply',
        };
      } catch (e) {
        ret = {
          success: false,
          error: (e as any).toString(),
        };
        console.error('getAddressList error ' + e);
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
          error: (e as any).toString(),
        };
        console.error('signMessage error ' + e);
      }
      event.returnValue = ret;
    });
    // arg: string
    ipcMain.on('ethSignSendTx', async (event: any, arg: any) => {
      let ret = {};
      try {
        const txhash = await this.ethProvider.signAndSendTx(
          arg.url,
          arg.index,
          arg.chainId,
          arg.gasLimit,
          arg.gasPrice,
          arg.to,
          arg.value,
          arg.data,
        );
        ret = {
          txhash,
          success: true,
          label: 'ethSignSendTx reply',
        };
      } catch (e) {
        ret = {
          success: false,
          error: (e as any).toString(),
        };
        console.error('ethSignSendTx error ' + e);
      }
      event.returnValue = ret;
    });

    ipcMain.on('ethSignTx', async (event: any, arg: any) => {
      let ret = {};
      try {
        const signedtx = await this.ethProvider.signTx(
          arg.index,
          arg.standard,
          arg.chainId,
          arg.nonce,
          arg.gasLimit,
          arg.gasPrice,

          arg.to,
          arg.value,
          arg.data,
        );
        ret = {
          signedtx,
          success: true,
          label: 'ethSignTx reply',
        };
      } catch (e) {
        ret = {
          success: false,
          error: (e as any).toString(),
        };
        console.error('ethSignTx error ' + e);
      }
      event.returnValue = ret;
    });
    ipcMain.on('ethGetAddress', async (event: any, arg: any) => {
      let ret = {};
      try {
        const address = await this.ethProvider.getAddress(arg.index, arg.standard, arg.display);
        ret = {
          address,
          success: true,
          label: 'ethGetAddress reply',
        };
      } catch (e) {
        ret = {
          success: false,
          error: (e as any).toString(),
        };
        console.error('ethGetAddress error ' + e);
      }
      event.returnValue = ret;
    });
    ipcMain.on('ethGetAddressList', async (event: any, arg: any) => {
      let ret = {};
      try {
        const addressList = await this.ethProvider.getAddressList(arg.startIndex, arg.gap, arg.standard);
        ret = {
          addressList,
          success: true,
          label: 'ethGetAddressList reply',
        };
      } catch (e) {
        ret = {
          success: false,
          error: (e as any).toString(),
        };
        console.error('ethGetAddressList error ' + e);
      }
      event.returnValue = ret;
    });
    ipcMain.on('ethSignPersonalMessage', async (event: any, arg: any) => {
      let ret = {};
      console.log('ethSignPersonalMessage, ', arg.message, ' . ', arg.index, ' . ', arg.standard);

      try {
        const sig = await this.ethProvider.signPersonalMessage(arg.message, arg.index, arg.standard);
        ret = {
          sig,
          success: true,
          label: 'ethSignPersonalMessage reply',
        };
      } catch (e) {
        ret = {
          success: false,
          error: (e as any).toString(),
        };
        console.error('ethSignPersonalMessage error ', e);
      }

      event.returnValue = ret;
    });
    ipcMain.on('ethSignTypedDataV4', async (event: any, arg: any) => {
      let ret = {};
      try {
        const sig = await this.ethProvider.signTypedDataV4(arg.typedData, arg.index, arg.standard);
        ret = {
          sig,
          success: true,
          label: 'ethSignTypedDataV4 reply',
        };
      } catch (e) {
        ret = {
          success: false,
          error: (e as any).toString(),
        };
        console.error('ethSignTypedDataV4 error ' + e);
      }
      event.returnValue = ret;
    });
  }
}
