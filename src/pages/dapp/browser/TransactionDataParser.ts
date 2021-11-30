import { CronosClient } from '../../../service/cronos/CronosClient';
import { ContractData } from '../../../service/rpc/models/cronos.models';

export interface TokenApprovalRequestData {
  amount: string;
  tokenData: ContractData;
}

class TransactionDataParser {
  private client: CronosClient;

  constructor(rpcEndPoint: string, explorerAPIEndPoint: string) {
    this.client = new CronosClient(rpcEndPoint, explorerAPIEndPoint);
  }

  parseTokenApprovalData = async (
    tokenAddress: string,
    data: string,
  ): Promise<TokenApprovalRequestData> => {
    const amount = data.slice(74, data.length);
    const response = await this.client.getContractDataByAddress(tokenAddress);
    return {
      amount,
      tokenData: response.result,
    };
  };
}

export { TransactionDataParser };
