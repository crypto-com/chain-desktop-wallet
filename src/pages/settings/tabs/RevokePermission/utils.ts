import { Contract, providers } from 'ethers';
import { Filter, Log } from '@ethersproject/abstract-provider';
import Web3 from 'web3';
import { sleep } from '../../../../utils/utils';
import { CronosClient } from '../../../../service/cronos/CronosClient';
import { ContractData } from '../../../../service/rpc/models/cronos.models';
import { TransactionPrepareService } from '../../../../service/TransactionPrepareService';
import { walletService } from '../../../../service/WalletService';
import { UserAsset } from '../../../../models/UserAsset';

export function toFloat(n: number, decimals: number): string {
  return (n / 10 ** decimals).toFixed(3);
}

export const unpackResult = async (promise: Promise<any>) => (await promise)[0];
export const convertString = async (promise: Promise<any>) => String(await promise);

export function parsePadZero32Value(value: string): string {
  return `0x${value.slice(26)}`;
}

const ContractDataMapping = new Map<string, ContractData>();

export const getGasPrice = async (
  asset: UserAsset,
  config: { from: string; to: string; data: string; value: string },
) => {
  const transactionPrepareService = new TransactionPrepareService(walletService.storageService);
  const prepareTxInfo = await transactionPrepareService.prepareEVMTransaction(asset, config);

  return {
    gasLimit: prepareTxInfo.gasLimit,
    gasPrice: Web3.utils.toHex(prepareTxInfo.loadedGasPrice),
  };
};

export async function getCRC20TokenData(
  contract: Contract,
  ownerAddress: string,
  nodeURL: string,
  indexingURL: string,
) {
  const cronosClient = new CronosClient(nodeURL, indexingURL);

  const fetchContractData = async () => {
    if (ContractDataMapping.has(contract.address)) {
      return ContractDataMapping.get(contract.address)!;
    }

    const response = await cronosClient.getContractDataByAddress(contract.address);

    if (response.result) {
      ContractDataMapping.set(contract.address, response.result);
    }

    return response.result;
  };

  const fetchBalance = async () => {
    const response = await cronosClient.getTokenBalanceByAddress(contract.address, ownerAddress);
    return response.result;
  };

  const [balance, tokenData] = await Promise.all([fetchBalance(), fetchContractData()]);

  return {
    symbol: tokenData.symbol,
    decimals: Number(tokenData.decimals),
    totalSupply: tokenData.totalSupply,
    balance,
  };
}

export const getLogsFromProvider = async (
  provider: providers.Provider,
  baseFilter: Filter,
  fromBlock: number,
  toBlock: number,
): Promise<Log[]> => {
  const filter = { ...baseFilter, fromBlock, toBlock };
  try {
    const result = await provider.getLogs(filter);
    return result;
  } catch (error) {
    const errorMessage =
      ((error as unknown) as any)?.error?.message ??
      ((error as unknown) as any)?.data?.message ??
      ((error as unknown) as any)?.message;
    if (errorMessage !== 'maximum [from, to] blocks distance: 2000') {
      throw error;
    }

    await sleep(300);

    const middle = fromBlock + Math.floor((toBlock - fromBlock) / 2);
    const leftPromise = getLogsFromProvider(provider, baseFilter, fromBlock, middle);
    const rightPromise = getLogsFromProvider(provider, baseFilter, middle + 1, toBlock);
    const [left, right] = await Promise.all([leftPromise, rightPromise]);
    return [...left, ...right];
  }
};
