export interface nftAssetsResponseAssetModel {
  token_address: string;
  token_id: string; // 7191
  token_uri: string; // "https://arweave.net/z3ieHRy4RjFwWGExaRS3BRw0f3HrWAHnUQqhPmPhOII/7191.json",
  image_url: string; // "https://arweave.net/KOnXn6F7zRoLrJYu-SIrY9wJZATcQG2fYnXwG5xMBQA/7191.png",
  owner: string; // "0x85e0280712aabdd0884732141b048b3b6fde405b",
  approval: string; // "0x0000000000000000000000000000000000000000",
  type: string; // "erc721",
  name: string; // "CronosChimp",
  symbol: string; // "CHIMP",
  balance: string; // "",
  total_score: string; // "288.97",
  rank: number; // "4913",
  collection: {
    name: string; // "CronosChimp",
    description: string; // "",
    image_url: string; // "https://app.ebisusbay.com/collection/cronos-chimp-club",
    slug: string; // "0x562f021423d75a1636db5be1c4d99bc005ccebfe"
  };
  uri_detail: {
    name: string; // "Chimp #7191",
    image: string; // "https://arweave.net/KOnXn6F7zRoLrJYu-SIrY9wJZATcQG2fYnXwG5xMBQA/7191.png"
  };
  attributes?: {
    trait_type: string;
    value: string;
    score?: string;
    rarity?: string;
    occurrence?: string;
    count?: number;
  }[];
  listed_market?: {
    price?: string;
    market_name?: string;
    market_url?: string;
    market_icon_url?: string;
    market_chain_icon_url?: string;
    market_nft_url?: string;
  }[];
}

export interface nftAssetsResponseData {
  limit: number;
  offset: number;
  address: string;
  nft_assets: nftAssetsResponseAssetModel[];
}

export interface nftAssetsResponse {
  code: number;
  data: nftAssetsResponseData;
  message?: string;
}

export interface nftTxsResponse {
  code: number;
  data: nftTxsResponseData;
  message?: string;
}

export interface nftTxsResponseData {
  limit: number;
  offset: number;
  address: string;
  nft_txs: nftTxsResponseTxModel[];
}

export interface nftTxsResponseTxModel {
  tx_hash: string; // "0xae55f817726bdff73cb75fa3869cab77183a86622db7b4f80e1bf1b4e2e123bd",
  block_id: number; // 1060601,
  time: number; // 1642394400;
  token_address: string; // "0x562f021423d75a1636db5be1c4d99bc005ccebfe"
  type: string; // "erc721";
  event_type: string; // "Transfer";
  event_detail: {
    from: string; // "0x610aa200bec7564a38287328b39c844a2f822442";
    to: string; // "0x85e0280712aabdd0884732141b048b3b6fde405b";
    token_id: string; // "2241"
  };
  token_name: string; // "CronosChimp";
  token_symbol: string; // "CHIMP"
}
