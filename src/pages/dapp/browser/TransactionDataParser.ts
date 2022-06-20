import { ethers } from 'ethers';
import { ERC20__factory, IERC20__factory } from '../../../contracts';
import { EVMChainConfig } from '../../../models/Chain';
import { TokenApprovalRequestData } from '../types';

export function instanceOfTokenApprovalRequestData(data: any): data is TokenApprovalRequestData {
  return 'amount' in data;
}

class TransactionDataParser {

  static parseTokenApprovalData = async (
    chainConfig: EVMChainConfig,
    tokenAddress: string,
    data: string,
  ): Promise<TokenApprovalRequestData> => {

    const IERC20 = IERC20__factory.createInterface();
    const parsedData = IERC20.decodeFunctionData(IERC20.functions['approve(address,uint256)'].name, data)

    const provider = new ethers.providers.JsonRpcProvider(chainConfig.rpcUrls[0]);
    const contract = ERC20__factory.connect(tokenAddress, provider);
    const [symbol, decimals, totalSupply] = await Promise.all([
      contract.symbol(),
      contract.decimals(),
      contract.totalSupply(),
    ])

    return {
      amount: parsedData.amount,
      spender: parsedData.spender,
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
