import { BlockTransactionObject, TransactionReceipt, TransactionConfig } from 'web3-eth';

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
  estimateGas(txConfig: TransactionConfig): Promise<number>;

  // Block
  getLatestBlockHeight(): Promise<number>;
  getBlock(blockHashOrBlockNumber: number | string): Promise<BlockTransactionObject>;
  getBlockByHeight(height: number): Promise<BlockTransactionObject>;
  getBlockByHash(blockHash: string): Promise<BlockTransactionObject>;

  // Broadcast
  broadcastRawTransactionHex(signedTxHex: string): Promise<string>;
}
