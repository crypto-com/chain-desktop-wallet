import { ethers } from 'ethers';
import { ERC20__factory } from '../../../contracts';
import { EVMChainConfig } from '../../../models/Chain';
import { CronosClient } from '../../../service/cronos/CronosClient';
import { TokenApprovalRequestData } from '../types';

export function instanceOfTokenApprovalRequestData(data: any): data is TokenApprovalRequestData {
  return 'amount' in data;
}

class TransactionDataParser {
  private client: CronosClient;

  constructor(rpcEndPoint: string, explorerAPIEndPoint: string) {
    this.client = new CronosClient(rpcEndPoint, explorerAPIEndPoint);
  }

  parseTokenApprovalData = async (
    chainConfig: EVMChainConfig,
    tokenAddress: string,
    data: string,
  ): Promise<TokenApprovalRequestData> => {
    const amount = data.slice(74, data.length);
    const spender = `0x${data.slice(34, 74)}`;

    const provider = new ethers.providers.JsonRpcProvider(chainConfig.rpcUrls[0]);
    const contract = ERC20__factory.connect(tokenAddress, provider);

    const symbol = await contract.symbol()
    const decimals = await contract.decimals()
    const totalSupply = await contract.totalSupply()

    return {
      amount,
      spender,
      tokenData: {
        contractAddress: tokenAddress,
        symbol,
        name: symbol,
        type: '',
        decimals: decimals.toString(),
        totalSupply: totalSupply.toString(),
        cataloged: false,
      },
    };
  };
}

export { TransactionDataParser };
