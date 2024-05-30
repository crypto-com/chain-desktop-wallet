import { toChecksumAddress } from 'web3-utils';
import { isAddress } from 'web3-validator';

const TRUSTWALLET_ASSETS_BASE_URI = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/';

export const getErc20IconUrlByContractAddress = (contractAddress: string) => {
  if (!isAddress(contractAddress)) {
    return '';
  }

  return TRUSTWALLET_ASSETS_BASE_URI.concat(`${toChecksumAddress(contractAddress)}/logo.png`);
};
