import Web3 from 'web3';
import { ethers } from 'ethers';
import { Block, TransactionReceipt, Transaction } from 'web3-types';
import { AbiItem, bytesToHex } from 'web3-utils';
import { isHex, isAddress } from 'web3-validator';
import { IEvmRpc } from '../interface/evm.rpcClient';
import TokenContractABI from '../../../service/signers/abi/TokenContractABI.json';

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
    return ethers.BigNumber.from(await this.web3.eth.getChainId()).toNumber();
  }

  // Address
  async getNativeBalanceByAddress(address: string): Promise<string> {
    if (!isAddress(address)) {
      throw new Error('Please provide a valid EVM compatible address.');
    }

    const nativeBalance = await ethers.BigNumber.from(await this.web3.eth.getBalance(address, 'latest')).toString();
    return nativeBalance;
  }

  async getBalanceOfContractByAddress(tokenContractAddress: string, address: string): Promise<string> {
    if (!isAddress(address) || !isAddress(tokenContractAddress)) {
      throw new Error('Please provide a valid EVM compatible address.');
    }

    const contractABI = TokenContractABI.abi as AbiItem[];
    const contract = new this.web3.eth.Contract(contractABI, tokenContractAddress);
    const tokenBalance = (contract.methods.balanceOf(address).call() as Promise<string>);

    return tokenBalance;
  }

  async getTokenContractDetails(tokenContractAddress: string): Promise<{
    name: string;
    decimals: string;
    symbol: string;
  }> {
    if (!isAddress(tokenContractAddress)) {
      throw new Error('Please provide a valid EVM compatible address.');
    }

    const contractABI = TokenContractABI.abi as AbiItem[];
    const contract = new this.web3.eth.Contract(contractABI, tokenContractAddress);
    const name = await (contract.methods.name().call() as Promise<string>);
    const decimals = await (contract.methods.decimals().call() as Promise<string>);
    const symbol = await (contract.methods.symbol().call() as Promise<string>);

    return {
      name,
      decimals,
      symbol,
    };
  }

  async getNextNonceByAddress(address: string): Promise<number> {
    if (!isAddress(address)) {
      throw new Error('Please provide a valid EVM compatible address.');
    }
    const pendingNonce = await this.web3.eth.getTransactionCount(address, 'pending');
    return parseInt(pendingNonce.toString());
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
    const estimatedGasPrice = (await this.web3.eth.getGasPrice()).toString();
    return estimatedGasPrice;
  }

  async estimateGas(txConfig: Transaction): Promise<number> {
    const estimatedGas = ethers.BigNumber.from(await this.web3.eth.estimateGas(txConfig)).toNumber();
    return estimatedGas;
  }

  // Block
  async getLatestBlockHeight(): Promise<number> {
    const blockHeight = ethers.BigNumber.from(await this.web3.eth.getBlockNumber()).toNumber();
    return blockHeight;
  }

  async getBlock(blockHashOrBlockNumber: number | string): Promise<Block> {
    const blockTransactions = await this.web3.eth.getBlock(blockHashOrBlockNumber, true);
    return blockTransactions;
  }

  async getBlockByHeight(height: number): Promise<Block> {
    return await this.getBlock(height);
  }

  async getBlockByHash(blockHash: string): Promise<Block> {
    return await this.getBlock(blockHash);
  }

  // Broadcast
  async broadcastRawTransactionHex(signedTxHex: string): Promise<string> {
    if (!isHex(signedTxHex)) {
      throw new Error('Please provide a valid Hex string.');
    }
    if (!signedTxHex.startsWith('0x')) {
      signedTxHex = `0x${signedTxHex}`;
    }

    let broadcastTxHash = '';

    try {
      // const broadcastTx = await this.web3.eth.sendSignedTransaction(signedTxHex, (err, hash) => {
      //   broadcastTxHash = hash;
      // });

      const broadcastTx = await this.web3.eth.sendSignedTransaction(signedTxHex).on('transactionHash', (hash) => {
        broadcastTxHash = hash;
      });

      if (broadcastTx.status) {
        return bytesToHex(broadcastTx.transactionHash);
      }
    } catch (e) {
      if (broadcastTxHash) {
        return broadcastTxHash;
      }
      throw new Error((e as Error).message);
    }
    throw new Error('Transaction broadcast failed.');
  }
}

export { EVMClient };
