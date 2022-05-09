import { Contract, providers } from 'ethers';
import { Filter, Log } from '@ethersproject/abstract-provider';
import { sleep } from '../../../../utils/utils';
import { CronosClient } from '../../../../service/cronos/CronosClient';

export function toFloat(n: number, decimals: number): string {
  return (n / 10 ** decimals).toFixed(3);
}

export const unpackResult = async (promise: Promise<any>) => (await promise)[0];
export const convertString = async (promise: Promise<any>) => String(await promise);

export async function getCRC20TokenData(
  contract: Contract,
  ownerAddress: string,
  nodeURL: string,
  indexingURL: string,
) {
  const cronosClient = new CronosClient(nodeURL, indexingURL);

  const [balance, tokenDataResponse] = await Promise.all([
    convertString(unpackResult(contract.functions.balanceOf(ownerAddress))),
    cronosClient.getContractDataByAddress(contract.address),
  ]);

  const { result } = tokenDataResponse;

  return {
    symbol: result.symbol,
    decimals: Number(result.decimals),
    totalSupply: result.totalSupply,
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
