import CosmosApp from 'ledger-cosmos-js';
import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import { LedgerSigner } from './LedgerSigner';

export class LedgerSignerWebusb extends LedgerSigner {
  public transport: TransportWebHID;

  constructor(account: number = 0) {
    super(account);
  }

  async createTransport() {
    if (this.app === null || this.app === undefined) {
      const transport = await TransportWebHID.create();
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
