import { LedgerSigner } from '../src/service/signers/LedgerSigner';
import TransportHID from '@ledgerhq/hw-transport-node-hid';
const CosmosApp: any = require('ledger-cosmos-js').default;
export class LedgerSignerNative extends LedgerSigner {
  public transport: TransportHID | null;

  constructor(account: number = 0) {
    super(account);
    this.transport = null;
  }

  async createTransport() {
    if (this.app === null || this.app === undefined) {
      const transport = await TransportHID.open(''); // take first device
      this.app = new CosmosApp(transport);
      this.transport = transport;
    }
  }

  async closeTransport() {
    if (this.transport != null) {
      this.transport.close();
      this.transport = null;
      this.app = null;
    }
  }
}
