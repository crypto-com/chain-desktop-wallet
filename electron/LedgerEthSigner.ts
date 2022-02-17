/* eslint-disable prefer-template */
import TransportHID from '@ledgerhq/hw-transport-node-hid';
import Eth from '@ledgerhq/hw-app-eth';
import { ethers } from 'ethers';
import Web3 from 'web3';
import { TypedDataUtils } from 'eth-sig-util';

export class LedgerEthSigner {
  public app: Eth | undefined;

  public transport: TransportHID | null;

  constructor() {
    this.transport = null;
  }

  async createTransport() {
    if (this.app === null || this.app === undefined) {
      const transport = await TransportHID.open('');
      this.app = new Eth(transport);
      this.transport = transport;
    }
  }

  async closeTransport() {
    if (this.transport != null) {
      this.transport.close();
      this.transport = null;
      this.app = undefined;
    }
  }

  async getAddress(index: number = 0, display: boolean): Promise<string> {
    try {
      const path: string = `44'/60'/0'/0/${index}`;
      await this.createTransport();
      const retAddress = await this.app!.getAddress(path, display, false);
      return retAddress.address;
    } finally {
      await this.closeTransport();
    }
  }

  public static padZero(original_array: Uint8Array, wanted_length: number) {
    const new_array = new Uint8Array(wanted_length);
    for (let i = wanted_length - 1; i >= 0; i--) {
      const j = wanted_length - 1 - i;
      const new_i = original_array.length - 1 - j;
      if (new_i >= 0 && new_i < original_array.length) {
        new_array[i] = original_array[new_i];
      } else {
        new_array[i] = 0;
      }
    }

    return new_array;
  }

  // src: without 0x, wanted_length: in bytes
  public static padZeroString(src: string, wanted_length: number): string {
    const srcBinary = Buffer.from(src, 'hex');
    const paddedSrcBinary = LedgerEthSigner.padZero(srcBinary, wanted_length);
    const hexSrcBinary = Buffer.from(paddedSrcBinary).toString('hex');
    return hexSrcBinary; // without 0x
  }

  async doSignTx(
    path: string = "44'/60'/0'/0/0",
    chainId: number = 9000,
    nonce: number = 0,
    gasLimit: string = '0x5000',
    gasPrice: string = '0x0400000000',
    to: string,
    value: string = '0x00',
    data: string = '0x',
  ): Promise<string> {
    const baseTx: ethers.utils.UnsignedTransaction = {
      chainId,
      data,
      gasLimit,
      gasPrice,
      nonce,
      to,
      value,
    };

    const unsignedTx = ethers.utils.serializeTransaction(baseTx).substring(2);
    const sig = await this.app!.signTransaction(path, unsignedTx);
    // to prevent possible padding issue
    const sigR = LedgerEthSigner.padZeroString(sig.r, 32);
    const sigS = LedgerEthSigner.padZeroString(sig.s, 32);

    const ret = ethers.utils.serializeTransaction(baseTx, {
      v: ethers.BigNumber.from('0x' + sig.v).toNumber(),
      r: '0x' + sigR,
      s: '0x' + sigS,
    });

    return ret;
  }

  async signTx(
    index: number = 0,
    chainId: number = 9000,
    nonce: number = 0,
    gasLimit: string = '0x5208',
    gasPrice: string = '0x04e3b29200',
    to: string,
    value: string = '0x00',
    data: string = '0x',
  ): Promise<string> {
    try {
      await this.createTransport();
      const path: string = `44'/60'/0'/0/${index}`;
      const signedTx = await this.doSignTx(
        path,
        chainId,
        nonce,
        gasLimit,
        gasPrice,
        to,
        value,
        data,
      );
      return signedTx;
    } finally {
      await this.closeTransport();
    }
  }

  async signAndSendTx(
    url: string = 'http://127.0.0.1:8545',
    index: number = 0,
    chainId: number = 9000,
    gasLimit: string = '0x5000',
    gasPrice: string = '0x0400000000',
    to: string,
    value: string = '0x00',
    data: string = '0x',
  ): Promise<string> {
    try {
      await this.createTransport();
      const path: string = `44'/60'/0'/0/${index}`;
      const web3 = new Web3(url);
      const from_addr = (await this.app!.getAddress(path)).address;
      const nonce = await web3.eth.getTransactionCount(from_addr);
      const signedTx = await this.doSignTx(
        path,
        chainId,
        nonce,
        gasLimit,
        gasPrice,
        to,
        value,
        data,
      );
      const txHash = (await web3.eth.sendSignedTransaction(signedTx)).transactionHash;

      return txHash;
    } finally {
      await this.closeTransport();
    }
  }

  async signPersonalMessage(msg: string, index = 0) {
    try {
      await this.createTransport();
      const path: string = `44'/60'/0'/0/${index}`;
      const sig = await this.app!.signPersonalMessage(path, Buffer.from(msg).toString('hex'));
      return LedgerEthSigner.getHexlifySignature(sig);
    } finally {
      await this.closeTransport();
    }
  }

  static getHexlifySignature(sig: { v: number; r: string; s: string }) {
    const v = sig.v - 27;
    let vStr = v.toString(16);
    if (vStr.length < 2) {
      vStr = '0' + v;
    }

    return '0x' + sig.r + sig.s + vStr;
  }

  async signTypedDataV4(typedData: any, index = 0) {
    try {
      await this.createTransport();
      const path: string = `44'/60'/0'/0/${index}`;

      const data = JSON.parse(typedData);

      const domainSeparator = TypedDataUtils.hashStruct('EIP712Domain', data.domain, data.types);

      const hashedMessage = TypedDataUtils.hashStruct(data.primaryType, data.message, data.types);

      const sig = await this.app!.signEIP712HashedMessage(
        path,
        ethers.utils.hexlify(domainSeparator),
        ethers.utils.hexlify(hashedMessage),
      );

      return LedgerEthSigner.getHexlifySignature(sig);
    } finally {
      await this.closeTransport();
    }
  }
}
