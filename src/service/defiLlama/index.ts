import axios from 'axios';

export interface Protocol {
  id: string;
  name: string;
  address?: string;
  symbol: string;
  url: string;
  description?: string;
  chain: string;
  logo: string;
  audits?: string;
  audit_note?: string;
  gecko_id?: string;
  cmcId?: string;
  category: string;
  chains: string[];
  module: string;
  twitter?: string;
  oracles?: string[];
  language?: string;
  slug: string;
  tvl: number;
  chainTvls: any;
  change_1h?: number;
  change_1d?: number;
  change_7d?: number;
  staking?: number;
  fdv?: number;
  mcap?: number;
  pool2?: number;
  forkedFrom: any;
  listedAt?: number;
  audit?: string;
  audit_links?: string[];
}

const Config = {
  host: 'https://api.llama.fi',
};

export function fetchProtocols(): Promise<Protocol[]> {
  return new Promise((resolve, reject) => {
    const url = `${Config.host}/protocols`;
    axios
      .get(url)
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        reject(error);
      });
  });
}
