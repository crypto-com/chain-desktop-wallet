import axios from 'axios';
import { ethers } from 'ethers';
import { getRecoil } from 'recoil-nexus';
import { FIXED_DEFAULT_FEE, FIXED_DEFAULT_GAS_LIMIT } from '../config/StaticConfig';
import { sessionState } from '../recoil/atom';
import { getCosmosHubTendermintAsset, getCronosTendermintAsset } from '../utils/utils';
import { walletService } from './WalletService';

export async function getCronosTendermintFeeConfig() {
  const currentSession = getRecoil(sessionState);
  const allAssets = await walletService.retrieveWalletAssets(currentSession.wallet.identifier);
  const chainConfig = getCronosTendermintAsset(allAssets)?.config;

  return {
    networkFee: chainConfig?.fee.networkFee ?? FIXED_DEFAULT_FEE,
    gasLimit: Number(chainConfig?.fee.gasLimit ?? FIXED_DEFAULT_GAS_LIMIT),
  };
}

export async function getCosmosHubTendermintFeeConfig() {
  const currentSession = getRecoil(sessionState);
  const allAssets = await walletService.retrieveWalletAssets(currentSession.wallet.identifier);
  const chainConfig = getCosmosHubTendermintAsset(allAssets)?.config;

  return {
    networkFee: chainConfig?.fee.networkFee ?? FIXED_DEFAULT_FEE,
    gasLimit: Number(chainConfig?.fee.gasLimit ?? FIXED_DEFAULT_GAS_LIMIT),
  };
}

interface EthereumGasStepsInfoResponse {
  fast: number;
  fastest: number;
  safeLow: number;
  average: number;
  block_time: number;
  blockNum: number;
  speed: number;
  safeLowWait: number;
  avgWait: number;
  fastWait: number;
  fastestWait: number;
}

export interface EthereumGasStepInfo {
  average: ethers.BigNumber; // wei
  averageWait: number; // minutes

  fast: ethers.BigNumber;
  fastWait: number;

  safeLow: ethers.BigNumber;
  safeLowWait: number;
}

// https://docs.ethgasstation.info/gas-price
export async function fetchEthereumGasSteps() {
  const response = await axios.get<EthereumGasStepsInfoResponse>(
    'https://ethgasstation.info/api/ethgasAPI.json',
  );
  return response.data;
}

export async function getEthereumGasSteps(): Promise<EthereumGasStepInfo | undefined> {
  try {
    const response = await fetchEthereumGasSteps();
    return {
      average: ethers.utils.parseUnits((response.average / 10).toString(), 'gwei'),
      averageWait: response.avgWait,
      fast: ethers.utils.parseUnits((response.fast / 10).toString(), 'gwei'),
      fastWait: response.fastWait,
      safeLow: ethers.utils.parseUnits((response.safeLow / 10).toString(), 'gwei'),
      safeLowWait: response.safeLowWait,
    };
  } catch (error) {
    console.error('Failed to fetch gas steps ', error);
  }

  return undefined;
}
