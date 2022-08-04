import { BigNumber, ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { IERC20__factory } from '../../../contracts';

const getERC20Contract = (provider: ethers.providers.JsonRpcProvider, address: string) => {
  const contract = IERC20__factory.connect(address, provider);

  return contract;
};

export const fetchBalance = async (
  provider: ethers.providers.JsonRpcProvider,
  accountAddress: string,
  tokenAddress?: string,
) => {
  if (!tokenAddress) {
    return await provider.getBalance(accountAddress);
  }

  const token = getERC20Contract(provider, tokenAddress);

  const balance = await token?.balanceOf(accountAddress);

  return balance;
};

export const useBalance = (rpcURL: string, accountAddress: string, tokenAddress?: string) => {

  const [balance, setBalance] = useState<BigNumber | null>(null);
  const [isFetchingBalance, setIsFetchingBalance] = useState(false);
  const [error, setError] = useState('');


  useEffect(() => {

    const provider = new ethers.providers.JsonRpcProvider(rpcURL);

    setIsFetchingBalance(true);
    fetchBalance(provider, accountAddress, tokenAddress).then((num) => {
      setBalance(num);
    }).catch(e => {
      setError(e.toString());
    }).finally(() => {
      setIsFetchingBalance(false);
    });
  }, [tokenAddress, rpcURL, accountAddress]);

  return {
    balance,
    isFetchingBalance,
    error
  };
};