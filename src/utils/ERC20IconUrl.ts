import Web3 from 'web3';
const { isAddress, toChecksumAddress } = Web3.utils;

const TRUSTWALLET_ASSETS_BASE_URI = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/';

export const getErc20IconUrlByContractAddress = (contractAddress: string) => {
    if (!isAddress(contractAddress)) {
        return '';
    }

    return TRUSTWALLET_ASSETS_BASE_URI.concat(`${toChecksumAddress(contractAddress)}/logo.png`)
}