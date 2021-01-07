import { Bytes } from '@crypto-com/chain-jslib/lib/dist/utils/bytes/bytes';
import { ISignerProvider } from './SignerProvider';

const electron = window.require('electron');

export class IpcRender implements ISignerProvider {
  async getPubKey(index: number): Promise<Bytes> {
    const arg = electron.ipcRenderer.sendSync('enableWallet', {
      index,
      message: 'enableWallet request for getPubKey',
    });
    const ret = Bytes.fromBuffer(Buffer.from(arg.pubKey));
    return ret;
  }

  async getAddress(index: number): Promise<string> {
    const arg = electron.ipcRenderer.sendSync('enableWallet', {
      index,
      message: 'enableWallet request for getAddress',
    });
    return arg.account;
  }

  async sign(message: Bytes): Promise<Bytes> {
    const stringMessage = message.toBuffer().toString();
    const arg = electron.ipcRenderer.sendSync('signMessage', stringMessage);
    return Bytes.fromBuffer(Buffer.from(arg.signed));
  }

  userEnableWallet() {
    const arg = electron.ipcRenderer.sendSync('enableWallet', {
      index: 0,
      message: 'this is the enable wallet request',
    });
    const signerAddress = arg.account;
    const signerPubKey = Bytes.fromBuffer(Buffer.from(arg.pubKey));
    console.log(+new Date(), '    ', JSON.stringify(arg)); // "pong"이 출력됩니다
    console.log(signerAddress);
    console.log(signerPubKey);
  }
  async userSignMessage() {
    const signerAddress = await this.getAddress(0);
    const fee = { amount: [{ amount: '5000', denom: 'cro' }], gas: '2000000' };
    const value = {
      amount: { amount: '1000000', denom: 'cro' },
      from_address: signerAddress,
      to_address: signerAddress,
    };
    const msg = { type: 'cosmos-sdk/MsgSend', value };
    const rawMessage = {
      account_number: '1',
      chain_id: 'earth',
      fee,
      memo: 'mymemo',
      msgs: [msg],
      sequence: '0',
    };
    const stringMessage = JSON.stringify(rawMessage);
    const bufferMessage = Buffer.from(stringMessage);
    const bytesMessage = Bytes.fromBuffer(bufferMessage);
    const reply = await this.sign(bytesMessage); // json string
    const hex = reply.toHexString();
    console.log(new Date(), '    ', hex);
  }
}
