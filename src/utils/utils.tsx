import { useState, useEffect } from 'react';
import { bech32 } from 'bech32';
import { ethers } from 'ethers';
import { CroNetwork } from '@crypto-org-chain/chain-jslib';
import Web3 from 'web3';
import { UserAsset, UserAssetType } from '../models/UserAsset';
import { Network, WalletConfig, SupportedChainName } from '../config/StaticConfig';
import { CRC20MainnetTokenInfos } from '../config/CRC20Tokens';

export function isElectron() {
  // Renderer process
  if (typeof window !== 'undefined' && typeof window.process === 'object') {
    return true;
  }

  // Main process
  if (
    typeof process !== 'undefined' &&
    typeof process.versions === 'object' &&
    !!process.versions.electron
  ) {
    return true;
  }

  // Detect the user agent when the `nodeIntegration` option is set to true
  if (
    typeof navigator === 'object' &&
    typeof navigator.userAgent === 'string' &&
    navigator.userAgent.indexOf('Electron') >= 0
  ) {
    return true;
  }

  return false;
}

export function middleEllipsis(str: string, len: number) {
  str = str ?? '';
  return `${str.substr(0, len)}...${str.substr(str.length - len, str.length)}`;
}

export function ellipsis(str: string, len: number) {
  str = str ?? '';
  return str.length <= len ? `${str}` : `${str.substr(0, len)}...`;
}

export function capitalizeFirstLetter(value: string) {
  if (!value || value.length < 2) {
    return '';
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function isJson(val: string) {
  try {
    JSON.parse(val);
  } catch (e) {
    return false;
  }
  return true;
}

export function splitToChunks(arr: any[], len: number) {
  const arrays: any[] = [];
  // const result =
  for (let i = 0, j = arr.length; i < j; i += len) {
    arrays.push(arr.slice(i, i + len));
  }
  return arrays;
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function convertIpfsToHttp(ipfsUrl: string) {
  if (ipfsUrl.indexOf('ipfs://') === 0) {
    return ipfsUrl.replace(/ipfs:\/\//i, 'https://ipfs.io/ipfs/');
  }
  throw new Error('Invalid IPFS URL');
}

export const useWindowSize = () => {
  // Initialize state with undefined width/height so server and client renders match
  // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  });
  // Correct window size
  const adjusted = {
    width: 103,
    height: 64,
  };
  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setWindowSize({
        width: window.innerWidth - adjusted.width,
        height: window.innerHeight - adjusted.height,
      });
    }
    // Add event listener
    window.addEventListener('resize', handleResize);
    // Call handler right away so state gets updated with initial window size
    handleResize();
    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty array ensures that effect is only run on mount
  return windowSize;
};

export function isNumeric(n) {
  // eslint-disable-next-line no-restricted-globals
  return !isNaN(parseFloat(n)) && isFinite(n);
}

export function hexToUtf8(s: string) {
  return decodeURIComponent(
    s
      .replace('0x', '')
      .replace(/\s+/g, '') // remove spaces
      .replace(/[0-9a-f]{2}/g, '%$&'), // add '%' before each 2 characters
  );
}

export function bech32ToEVMAddress(bech32Address: string) {
  const decodedFromWords = bech32.fromWords(bech32.decode(bech32Address).words);
  const originalEVMAddress = Buffer.from(new Uint8Array(decodedFromWords)).toString('hex');
  return ethers.utils.getAddress(originalEVMAddress);
}

export function getCronosTendermintAsset(walletAllAssets: UserAsset[]) {
  return walletAllAssets.find(asset => {
    return (
      asset.mainnetSymbol.toUpperCase() === 'CRO' &&
      asset.name.includes('Crypto.org') && // lgtm [js/incomplete-url-substring-sanitization]
      asset.assetType === UserAssetType.TENDERMINT
    );
  });
}

export function getCronosEvmAsset(walletAllAssets: UserAsset[]) {
  return walletAllAssets.find(asset => {
    return (
      asset.mainnetSymbol.toUpperCase() === 'CRO' &&
      asset.name.includes('Cronos') &&
      asset.assetType === UserAssetType.EVM
    );
  });
}

export function getAssetBySymbolAndChain(
  walletAllAssets: UserAsset[],
  symbol: string,
  chainName: string,
) {
  return walletAllAssets.find(asset => {
    return asset.symbol.toUpperCase() === symbol && asset.name.indexOf(chainName) !== -1;
  });
}

export function checkIfTestnet(network: Network) {
  return (
    [CroNetwork.TestnetCroeseid3, CroNetwork.TestnetCroeseid4, CroNetwork.Testnet].includes(
      network,
    ) || network.defaultNodeUrl.includes('testnet')
  );
}

// Temporary measure
export function getChainName(name: string | undefined = '', config: WalletConfig) {
  const isTestnet = checkIfTestnet(config.network);

  name = name.indexOf('Chain') === -1 ? `${name} Chain` : name;

  if (isTestnet) {
    switch (name) {
      case SupportedChainName.CRONOS:
      case SupportedChainName.CRYPTO_ORG:
      case SupportedChainName.ETHEREUM:
        return name.replace('Chain', 'Testnet');
      default:
        return name;
    }
  } else {
    switch (name) {
      case SupportedChainName.CRONOS:
        return name.replace('Chain', 'Beta');
      default:
        return name;
    }
  }
}

export function getAssetTypeName(assetType: UserAssetType | undefined) {
  switch (assetType) {
    case UserAssetType.TENDERMINT:
    case UserAssetType.EVM:
      return 'Cronos';
    case UserAssetType.CRC_20_TOKEN:
      return 'CRC20';
    case UserAssetType.ERC_20_TOKEN:
      return 'ERC20';
    default:
      return 'n.a.';
  }
}

export function isCRC20AssetWhitelisted(
  symbol: string,
  contractAddress: string,
  config: WalletConfig,
) {
  const isTestnet = checkIfTestnet(config.network);
  if (isTestnet) {
    return true;
  }

  const tokenInfo = CRC20MainnetTokenInfos.get(symbol.toUpperCase());
  if (!tokenInfo) {
    return false;
  }

  return tokenInfo.isWhitelisted && isAddressEqual(contractAddress, tokenInfo.address);
}

export function isAddressEqual(lhs: string, rhs: string) {
  return Web3.utils.toChecksumAddress(lhs) === Web3.utils.toChecksumAddress(rhs);
}

export function isValidURL(str: string) {
  const regex = new RegExp(
    '^(http[s]?:\\/\\/(www\\.)?|www\\.){1}([0-9A-Za-z-\\.@:%_+~#=]+)+((\\.[a-zA-Z]{2,3})+)(/(.)*)?(\\?(.)*)?', // lgtm [js/redos]
  );

  const withoutPrefixRegex = new RegExp(
    '^([0-9A-Za-z-\\.@:%_+~#=]+)+((\\.[a-zA-Z]{2,3})+)(/(.)*)?(\\?(.)*)?', // lgtm [js/redos]
  );
  return regex.test(str) || withoutPrefixRegex.test(str);
}

export function addHTTPsPrefixIfNeeded(str: string) {
  if (str.startsWith('http://') || str.startsWith('https://')) {
    return str;
  }

  return `https://${str}`;
}
