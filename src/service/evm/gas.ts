import { ethers } from 'ethers';
import { EVMChainConfig } from '../../models/Chain';

export const getEstimateGas = async (chainConfig: EVMChainConfig, tx: {
  to: string,
  from: string,
  value: ethers.BigNumber,
  data: string,
}) => {
  const provider = new ethers.providers.JsonRpcProvider(chainConfig.rpcUrls[0]);
  const gas = await provider.estimateGas({
    chainId: parseInt(chainConfig.chainId, 16),
    from: tx.from,
    to: tx.to,
    value: tx.value,
    data: tx.data,
  });

  return gas;
};

export const getGasPrice = async (chainConfig: EVMChainConfig, tx: {
  to: string,
  from: string,
  value: ethers.BigNumber,
  data: string
}) => {

  try {
    const provider = new ethers.providers.JsonRpcProvider(chainConfig.rpcUrls[0]);
    const fee = await provider.getFeeData();
    const gasLimit = await getEstimateGas(chainConfig, tx);

    return {
      maxFeePerGas: fee.maxFeePerGas,
      maxPriorityFeePerGas: fee.maxFeePerGas,
      gasPrice: fee.gasPrice,
      gasLimit,
    };

  } catch (error) {
    return {
      maxFeePerGas: null,
      maxPriorityFeePerGas: null,
      gasPrice: null,
      gasLimit: 21000,
    };
  }

};
