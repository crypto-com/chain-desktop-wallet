import axios, { AxiosInstance } from 'axios';
import { TransferDataAmount, TransferListResponse, TransferResult } from './ChainIndexingModels';
import { TransactionStatus, TransferTransactionData } from '../../models/Transaction';
import { DefaultWalletConfigs } from '../../config/StaticConfig';

export interface IChainIndexingAPI {
  fetchAllTransferTransactions(
    baseAssetSymbol: string,
    address: string,
  ): Promise<Array<TransferTransactionData>>;
}

export class ChainIndexingAPI implements IChainIndexingAPI {
  private readonly axiosClient: AxiosInstance;

  private constructor(axiosClient: AxiosInstance) {
    this.axiosClient = axiosClient;
  }

  public static init(baseUrl: string) {
    const defaultIndexingUrl = DefaultWalletConfigs.TestNetConfig.indexingUrl;
    const chainIndexBaseUrl = !baseUrl ? defaultIndexingUrl : baseUrl;
    const axiosClient = axios.create({
      baseURL: chainIndexBaseUrl,
    });
    return new ChainIndexingAPI(axiosClient);
  }

  public async fetchAllTransferTransactions(
    baseAssetSymbol: string,
    address: string,
  ): Promise<Array<TransferTransactionData>> {
    const transferListResponse = await this.axiosClient.get<TransferListResponse>(
      `/accounts/${address}/messages?order=height.desc&filter.msgType=MsgSend`,
    );

    function getStatus(transfer: TransferResult) {
      if (transfer.success) {
        return TransactionStatus.SUCCESS;
      }
      return TransactionStatus.FAILED;
    }

    const { data } = transferListResponse;

    function getTransferAmount(transfer): TransferDataAmount | null {
      return transfer.data.amount.filter(amount => amount.denom === baseAssetSymbol)[0];
    }

    try {
      return data.result
        .filter(trx => {
          const transferAmount = getTransferAmount(trx);
          return transferAmount !== undefined && transferAmount !== null;
        })
        .map(transfer => {
          const assetAmount = getTransferAmount(transfer);
          const transferData: TransferTransactionData = {
            amount: assetAmount?.amount ?? '0',
            assetSymbol: 'TCRO', // Hardcoded for now
            date: transfer.blockTime,
            hash: transfer.transactionHash,
            memo: '',
            receiverAddress: transfer.data.toAddress,
            senderAddress: transfer.data.fromAddress,
            status: getStatus(transfer),
          };

          return transferData;
        });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('FAILED_LOADING_TRANSFERS', { data, baseAssetSymbol, address });
      return [];
    }
  }
}
