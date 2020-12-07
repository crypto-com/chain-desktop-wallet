import { StargateClient } from '@cosmjs/stargate';
import { IndexedTx } from '@cosmjs/stargate/types/stargateclient';
import { Bytes } from '../types/ChainJsLib';

export interface INodeRpcService {
  loadAccountBalance(address: string, assetDenom: string): Promise<string>;

  loadSequenceNumber(address: string): Promise<number>;

  loadAccountNumber(address: string): Promise<number>;

  // Broadcast trx return trx hash
  broadcastTransaction(signedTxHex: string): Promise<string>;

  getTransactionByHash(transactionHash: string): Promise<IndexedTx>;
}

export class NodeRpcService implements INodeRpcService {
  public readonly client: StargateClient;

  private constructor(client: StargateClient) {
    this.client = client;
  }

  public static async init(baseUrl: string) {
    const client = await StargateClient.connect(baseUrl);
    return new NodeRpcService(client);
  }

  public async loadAccountBalance(address: string, assetDenom: string): Promise<string> {
    return (await this.client.getBalance(address, assetDenom))?.amount ?? '0';
  }

  public async loadSequenceNumber(address: string): Promise<number> {
    return (await this.client.getAccount(address))?.sequence ?? 0;
  }

  public async loadAccountNumber(address: string): Promise<number> {
    return (await this.client.getAccount(address))?.accountNumber ?? 0;
  }

  public async broadcastTransaction(signedTxHex: string): Promise<string> {
    const signedBytes = Bytes.fromHexString(signedTxHex).toUint8Array();
    const broadcastResponse = await this.client.broadcastTx(signedBytes);
    return broadcastResponse.transactionHash;
  }

  public async getTransactionByHash(transactionHash: string): Promise<IndexedTx> {
    const txs: readonly IndexedTx[] = await this.client.searchTx({ id: transactionHash });
    return txs[0];
  }
}
