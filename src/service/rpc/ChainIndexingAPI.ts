import axios, { AxiosInstance } from 'axios';
import { TransferListResponse } from './ChainIndexingModels';
import { TransactionStatus, TransferTransactionData } from '../../models/Transaction';

export interface IChainIndexingAPI {
  fetchAllTransferTransactions(address: string): Promise<Array<TransferTransactionData>>;
}

class ChainIndexingAPI implements IChainIndexingAPI {
  private readonly axiosClient: AxiosInstance;

  constructor() {
    this.axiosClient = axios.create({
      baseURL: `https://chain.crypto.com/explorer/api/v1`,
    });
  }

  public async fetchAllTransferTransactions(
    address: string,
  ): Promise<Array<TransferTransactionData>> {
    const transferListResponse = await this.axiosClient.get<TransferListResponse>(
      `/accounts/${address}/messages?order=height.desc&filter.msgType=MsgSend`,
    );

    return transferListResponse.data.result.map(transfer => {
      const transferData: TransferTransactionData = {
        amount: transfer.data.amount,
        assetSymbol: 'TCRO', // Hardcoded for now
        date: transfer.blockTime,
        hash: transfer.transactionHash,
        memo: '',
        receiverAddress: transfer.data.toAddress,
        senderAddress: transfer.data.fromAddress,
        status: TransactionStatus.SUCCESS,
      };

      return transferData;
    });
  }
}

export const chainIndexAPI = new ChainIndexingAPI();
