import { TransactionReceipt } from '../models/cronos.models';
import { BlockTransactionObject } from 'web3-eth';

export interface ICronosNodeRpcService {
  // Node
  isNodeSyncing(): Promise<boolean>;

  // Address
  getNativeBalanceByAddress(address: string): Promise<string>;
  getNextNonceByAddress(address: string): Promise<number>;

  // Transaction
  getTransactionReceiptByHash(txHash: string): Promise<TransactionReceipt>
  getTransactionReceiptByBlockHashAndIndex(blockHash: string, txIndex: number): Promise<TransactionReceipt>

  // Block
  getLatestBlockHeight(): Promise<number>;
  getBlock(blockHashOrBlockNumber: number | string): Promise<BlockTransactionObject>;
  getBlockByHeight(height: string): Promise<BlockTransactionObject>;
  getBlockByHash(blockHash: string): Promise<BlockTransactionObject>;

  // Broadcast
  broadcastRawTransactionHex(signedTxHex: string): Promise<string>;
}

