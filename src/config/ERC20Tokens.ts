import json from './whitelist_tokens_20220602.json';

export interface ERC20TokenInfo {
  address: string;
  // is tradable on VVS
  isWhitelisted: boolean;
  iconURL?: string;
  slug?: string;
}

// https://cronos.org/explorer/tokens
// case doesn't matter, will change to checksum before comparison
export const ERC20MainnetTokenInfos: Map<string, ERC20TokenInfo> = new Map(
  json.currencies
    .filter(token => {
      return token.chain_name === 'Ethereum' && token.enabled;
    })
    .map(token => {
      return [
        token.symbol,
        {
          address: token.contract_address.toLowerCase(),
          isWhitelisted: token.enabled,
          iconURL: token.colorful_image_url,
          slug: token.slug,
        },
      ];
    }),
);
