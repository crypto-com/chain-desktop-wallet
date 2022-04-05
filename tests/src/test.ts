import * as Zemu from '@zondax/zemu';
import CosmosApp from 'ledger-cosmos-js';
import * as path from 'path';
import { LedgerSigner } from '../../src/service/signers/LedgerSigner';
import { ISignerProvider } from '../../src/service/signers/SignerProvider';
import { LedgerTransactionSigner } from '../../src/service/signers/LedgerTransactionSigner';
import { CustomDevNet } from '../../src/config/StaticConfig';
import { Bytes } from '@crypto-org-chain/chain-jslib/lib/dist/utils/bytes/bytes';
import { NodeRpcService } from '../../src/service/rpc/NodeRpcService';
const { exec } = require('child_process');
import chai from 'chai';

const SLEEP_MS = 30000;
const APP_PATH = path.resolve(`./app/bin/app.elf`);
const seed = 'equip will roof matter pink blind book anxiety banner elbow sun young';
const SIM_OPTIONS = {
  logging: true,
  start_delay: 4000,
  X11: true,
  custom: `-s "${seed}" --display=headless --color LAGOON_BLUE`,
};

function runCmd(cmd) {
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.log(cmd, `error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(cmd, `stderr: ${stderr}`);
      return;
    }
    console.log(cmd, `stdout: ${stdout}`);
  });
}

class LedgerSignerZemu extends LedgerSigner {
  public sim: any;
  public click_times: number;

  constructor(account: number = 0) {
    super(account);
    this.sim = new Zemu.default(APP_PATH);
    this.click_times = 0;
  }

  public setClickTimes(times: number) {
    this.click_times = times;
  }

  public async initChain() {
    await Zemu.default.checkAndPullImage();
    if (this.app === null || this.app === undefined) {
      await this.sim.start(SIM_OPTIONS);
      this.app = new CosmosApp(this.sim.getTransport());
      console.log('start zemu grpc server');
      this.sim.startgrpcServer('localhost', '3002');
      await Zemu.default.sleep(SLEEP_MS);
    }
    // note: chain-maind need support zemu, so build it from `make build ledger=ZEMU` in chain-maind src
    const cmd1 = 'chain-maind init testnode --chain-id test -o';
    const cmd2 = 'chain-maind keys add validator1 --keyring-backend test';
    const cmd3 = 'chain-maind keys add hw  --ledger --keyring-backend test';
    const cmd4 =
      'chain-maind add-genesis-account $(chain-maind keys show validator1 -a --keyring-backend test) 200000000cro';
    const cmd5 =
      'chain-maind add-genesis-account $(chain-maind keys show hw -a --keyring-backend test) 100000000cro';
    const cmd6 =
      'chain-maind gentx validator1 100000000cro --keyring-backend test  --chain-id test';
    const cmd7 = 'chain-maind collect-gentxs';
    const commands = [cmd1, cmd2, cmd3, cmd4, cmd5, cmd6, cmd7];
    let i = 0;
    for (let cmd of commands) {
      await Zemu.default.sleep(SLEEP_MS);
      i += 1;
      runCmd(cmd);
      if (i === 3) {
        await Zemu.default.sleep(SLEEP_MS);
        console.log('right click');
        await this.sim.clickRight();
        console.log('right click');
        await this.sim.clickRight();
        console.log('right click');
        await this.sim.clickRight();
        console.log('double click');
        await this.sim.clickBoth();
      }
    }
    console.log('stop grpc server');
    this.sim.stopgrpcServer();
    console.log('start chain-maind');
    exec(
      'sed -i.bak \'s/cors_allowed_origins = \\[\\]/cors_allowed_origins = ["*"]/g\' $HOME/.chain-maind/config/config.toml',
    );
    await Zemu.default.sleep(SLEEP_MS);
    exec('chain-maind start --home $HOME/.chain-maind&');
    console.log('start chain-maind finished');
  }

  async createTransport() {
    await Zemu.default.checkAndPullImage();
    if (this.app === null || this.app === undefined) {
      await this.sim.start(SIM_OPTIONS);
      this.app = new CosmosApp(this.sim.getTransport());
    }
  }

  async closeTransport() {
    if (this.app === null || this.app === undefined) {
      console.log('transport already closed');
    } else {
      console.log('close transport now');
      await this.sim.close();
      this.app = null;
    }
  }

  async sign(message: Bytes): Promise<Bytes> {
    await this.createTransport();

    if (!this.app || !this.path) {
      throw new Error('Not signed in');
    }

    console.log('message in sign function:', message);

    const signatureRequest = this.app.sign(this.path, message.toUint8Array());
    await Zemu.default.sleep(SLEEP_MS);

    for (var i = 0; i < this.click_times; i++) {
      await Zemu.default.sleep(100);
      console.log('right click');
      await this.sim.clickRight();
    }
    console.log('click both');
    await this.sim.clickBoth();
    let response = await signatureRequest;

    if (response.error_message !== 'No errors') {
      throw new Error(`[${response.error_message}] ${response.error_message}`);
    }
    console.log('sign response:', response);

    // Ledger has encoded the sig in ASN1 DER format, but we need a 64-byte buffer of <r,s>
    // DER-encoded signature from Ledger:
    // 0 0x30: a header byte indicating a compound structure
    // 1 A 1-byte length descriptor for all what follows (ignore)
    // 2 0x02: a header byte indicating an integer
    // 3 A 1-byte length descriptor for the R value
    // 4 The R coordinate, as a big-endian integer
    //   0x02: a header byte indicating an integer
    //   A 1-byte length descriptor for the S value
    //   The S coordinate, as a big-endian integer
    //  = 7 bytes of overhead
    let { signature } = response;
    if (signature[0] !== 0x30) {
      throw new Error('Ledger assertion failed: Expected a signature header of 0x30');
    }

    // decode DER string format
    let rOffset = 4;
    let rLen = signature[3];
    const sLen = signature[4 + rLen + 1]; // skip over following 0x02 type prefix for s
    let sOffset = signature.length - sLen;
    // we can safely ignore the first byte in the 33 bytes cases
    if (rLen === 33) {
      rOffset++; // chop off 0x00 padding
      rLen--;
    }
    if (sLen === 33) {
      sOffset++;
    } // as above
    const sigR = signature.slice(rOffset, rOffset + rLen); // skip e.g. 3045022100 and pad
    const sigS = signature.slice(sOffset);

    signature = Buffer.concat([sigR, sigS]);
    if (signature.length !== 64) {
      throw new Error(`Ledger assertion failed: incorrect signature length ${signature.length}`);
    }
    const bytes = Bytes.fromUint8Array(new Uint8Array(signature));
    await this.closeTransport();
    return bytes;
  }
}

export class LedgerWalletSignerProviderZemu implements ISignerProvider {
  public provider: LedgerSignerZemu;

  constructor() {
    this.provider = new LedgerSignerZemu();
  }

  public async getPubKey(index: number): Promise<Bytes> {
    const result = await this.provider.enable(index, 'cro', false); // dummy value
    await this.provider.closeTransport();
    return result[1];
  }

  public async getAddress(index: number, addressPrefix: string): Promise<string> {
    const result = await this.provider.enable(index, addressPrefix, false);
    await this.provider.closeTransport();
    return result[0];
  }

  public async sign(message: Bytes): Promise<Bytes> {
    const result = await this.provider.sign(message);
    await this.provider.closeTransport();
    return result;
  }

  // TODO: add zemu test
  public async signEthTx(
    _index: number,
    _chainId: number,
    _nonce: number,
    _gasLimit: string,
    _gasPrice: string,
    _to: string,
    _value: string,
    _data: string,
  ): Promise<string> {
    return '';
  }

  // TODO: add zemu test
  public async getEthAddress(_index: number): Promise<string> {
    return '';
  }

  async signPersonalMessage(_index: number, _message: string): Promise<string> {
    return '';
  }

  async signTypedDataV4(_index: number, _typedData: string): Promise<string> {
    return '';
  }
}

async function main() {
  const signerProvider = new LedgerWalletSignerProviderZemu();
  await signerProvider.provider.initChain();
  await Zemu.default.sleep(SLEEP_MS);
  const walletConfig = CustomDevNet;
  walletConfig.nodeUrl = 'http://127.0.0.1';
  const signer = new LedgerTransactionSigner(walletConfig, signerProvider, 0);
  console.log(signer);

  const phrase = '';
  signerProvider.provider.setClickTimes(7);
  const ledgerAddress = 'cro1tzhdkuc328cgh2hycyfddtdpqfwwu42yq3qgkr';
  const nodeRpc = await NodeRpcService.init(walletConfig.nodeUrl);
  await Zemu.default.sleep(SLEEP_MS);
  const accountNumber = await nodeRpc.fetchAccountNumber(ledgerAddress);
  console.log('get account number ', accountNumber);
  const accountSequence = await nodeRpc.loadSequenceNumber(ledgerAddress);
  console.log('get account sequence ', accountSequence);
  const signedTxHex = await signer.signTransfer(
    {
      accountNumber: accountNumber,
      accountSequence: accountSequence,
      amount: '100000000',
      fromAddress: ledgerAddress,
      memo: '',
      toAddress: 'cro1sza72v70tm9l38h6uxhwgra5eg33xd4jr3ujl7',
    },
    phrase,
  );
  console.log('broadcast transaction');
  console.log(signedTxHex);
  const broadCastResult = await nodeRpc.broadcastTransaction(signedTxHex);
  console.log('broadCast result:', broadCastResult);
  await Zemu.default.sleep(SLEEP_MS * 3);
  console.log("get sender's balance");
  const senderBalance = await nodeRpc.loadAccountBalance(ledgerAddress, 'basecro');
  console.log("sender's balance:", senderBalance);
  chai.assert.notEqual(senderBalance, '10000000000000000');
}

function afterFinish() {
  const cmd = "pgrep 'chain-maind' | xargs kill -9";
  exec(cmd);
}

(async () => {
  try {
    await main();
  } finally {
    afterFinish();
  }
})();
