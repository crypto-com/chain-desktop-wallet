import { StargateClient } from '@cosmjs/stargate';
import { IndexedTx } from '@cosmjs/stargate/types/stargateclient';
import { Bytes } from '../types/ChainJsLib';

export interface INodeRpcService {
  loadAccountBalance(address: string, assetDenom: string): Promise<string>;

  loadSequenceNumber(address: string): Promise<number>;

  fetchAccountNumber(address: string): Promise<number>;

  // Broadcast trx return trx hash
  broadcastTransaction(signedTxHex: string): Promise<string>;

  getTransactionByHash(transactionHash: string): Promise<IndexedTx>;
}

export interface BroadcastResponse {
  readonly height: number;
  readonly code?: number;
  readonly transactionHash: string;
  readonly rawLog?: string;
  readonly data?: Uint8Array;
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
    const response = await this.client.getBalance(address, assetDenom);
    return response?.amount ?? '0';
  }

  public async loadSequenceNumber(address: string): Promise<number> {
    return (await this.client.getAccount(address))?.sequence ?? 0;
  }

  public async fetchAccountNumber(address: string): Promise<number> {
    return (await this.client.getAccount(address))?.accountNumber ?? 0;
  }

  public async broadcastTransaction(signedTxHex: string): Promise<string> {
    const signedBytes = Bytes.fromHexString(signedTxHex).toUint8Array();
    const broadcastResponse: BroadcastResponse = await this.client.broadcastTx(signedBytes);

    // TODO : Handle timeout errors
    // {"code":-32603,"message":"Internal error","data":"timed out waiting for tx to be included in a block"}

    if (broadcastResponse.code) {
      // eslint-disable-next-line no-console
      console.error('ERROR_BROADCAST_XX', broadcastResponse);
      throw new Error(broadcastResponse.rawLog);
    }
    return broadcastResponse.transactionHash;
  }

  public async getTransactionByHash(transactionHash: string): Promise<IndexedTx> {
    const txs: readonly IndexedTx[] = await this.client.searchTx({ id: transactionHash });
    return txs[0];
  }
}
