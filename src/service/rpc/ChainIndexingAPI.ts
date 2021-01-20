import axios, { AxiosInstance } from 'axios';
import { TransferListResponse } from './ChainIndexingModels';
import { TransactionStatus, TransferTransactionData } from '../../models/Transaction';

export interface IChainIndexingAPI {
  fetchAllTransferTransactions(address: string): Promise<Array<TransferTransactionData>>;
}

export class ChainIndexingAPI implements IChainIndexingAPI {
  private readonly axiosClient: AxiosInstance;

  private constructor(axiosClient: AxiosInstance) {
    this.axiosClient = axiosClient;
  }

  public static init(baseUrl: string) {
    const axiosClient = axios.create({
      baseURL: baseUrl,
    });
    return new ChainIndexingAPI(axiosClient);
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
