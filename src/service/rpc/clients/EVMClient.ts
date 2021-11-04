import Web3 from 'web3';
import { BlockTransactionObject, TransactionReceipt, TransactionConfig } from 'web3-eth';
import { IEvmRpc } from '../interface/evm.rpcClient';

class EVMClient implements IEvmRpc {
  private web3: Web3;

  constructor(web3Instance: Web3) {
    this.web3 = web3Instance;
  }

  public static create(web3HttpProviderUrlUser: string): EVMClient {
    if (
      !web3HttpProviderUrlUser.startsWith('https://') ||
      !web3HttpProviderUrlUser.startsWith('http://')
    ) {
      const web3 = new Web3(new Web3.providers.HttpProvider(web3HttpProviderUrlUser));
      return new EVMClient(web3);
    }
    throw new Error('Please provide a valid HTTP Web3 Provider.');
  }

  public getWeb3(): Web3 {
    return this.web3;
  }

  // Node
  async isNodeSyncing(): Promise<boolean> {
    const isSyncing = await this.web3.eth.isSyncing();
    if (isSyncing instanceof Object) {
      return true;
    }
    return false;
  }

  public async getChainId(): Promise<number> {
    return await this.web3.eth.getChainId();
  }

  // Address
  async getNativeBalanceByAddress(address: string): Promise<string> {
    if (!this.web3.utils.isAddress(address)) {
      throw new Error('Please provide a valid EVM compatible address.');
    }

    const nativeBalance = await this.web3.eth.getBalance(address, 'latest');
    return nativeBalance;
  }

  async getNextNonceByAddress(address: string): Promise<number> {
    if (!this.web3.utils.isAddress(address)) {
      throw new Error('Please provide a valid EVM compatible address.');
    }
    const pendingNonce = await this.web3.eth.getTransactionCount(address, 'pending');
    return pendingNonce;
  }

  // Transaction
  async getTransactionReceiptByHash(txHash: string): Promise<TransactionReceipt | null> {
    const mayBeTxReceipt = await this.web3.eth.getTransactionReceipt(txHash);
    if (!mayBeTxReceipt) {
      return null;
    }
    return mayBeTxReceipt;
  }

  // Fees
  async getEstimatedGasPrice(): Promise<string> {
    const estimatedGasPrice = await this.web3.eth.getGasPrice();
    return estimatedGasPrice;
  }

  async estimateGas(txConfig: TransactionConfig): Promise<number> {
    const estimatedGas = await this.web3.eth.estimateGas(txConfig);
    return estimatedGas;
  }

  // Block
  async getLatestBlockHeight(): Promise<number> {
    const blockHeight = await this.web3.eth.getBlockNumber();
    return blockHeight;
  }

  async getBlock(blockHashOrBlockNumber: number | string): Promise<BlockTransactionObject> {
    const blockTransactions = await this.web3.eth.getBlock(blockHashOrBlockNumber, true);
    return blockTransactions;
  }

  async getBlockByHeight(height: number): Promise<BlockTransactionObject> {
    return await this.getBlock(height);
  }

  async getBlockByHash(blockHash: string): Promise<BlockTransactionObject> {
    return await this.getBlock(blockHash);
  }

  // Broadcast
  async broadcastRawTransactionHex(signedTxHex: string): Promise<string> {
    if (!this.web3.utils.isHex(signedTxHex)) {
      throw new Error('Please provide a valid Hex string.');
    }
    if (!signedTxHex.startsWith('0x')) {
      signedTxHex = `0x${signedTxHex}`;
    }
    const broadcastTx = await this.web3.eth.sendSignedTransaction(signedTxHex);

    if (broadcastTx.status) {
      return broadcastTx.transactionHash;
    }

    throw new Error('Transaction broadcast failed.');
  }
}

export { EVMClient };
