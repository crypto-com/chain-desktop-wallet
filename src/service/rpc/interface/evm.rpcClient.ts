import { Block, TransactionReceipt, Transaction } from 'web3-types';

export interface IEvmRpc {
  // Node
  isNodeSyncing(): Promise<boolean>;
  getChainId(): Promise<number>;

  // Address
  getNativeBalanceByAddress(address: string): Promise<string>;
  getNextNonceByAddress(address: string): Promise<number>;

  // Transaction
  getTransactionReceiptByHash(txHash: string): Promise<TransactionReceipt | null>;

  // Fees
  getEstimatedGasPrice(): Promise<string>;
  estimateGas(txConfig: Transaction): Promise<number>;

  // Block
  getLatestBlockHeight(): Promise<number>;
  getBlock(blockHashOrBlockNumber: number | string): Promise<Block>;
  getBlockByHeight(height: number): Promise<Block>;
  getBlockByHash(blockHash: string): Promise<Block>;

  // Broadcast
  broadcastRawTransactionHex(signedTxHex: string): Promise<string>;
}
