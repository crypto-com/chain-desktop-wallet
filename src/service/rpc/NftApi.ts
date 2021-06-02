import axios, { AxiosInstance } from 'axios';
import { NV_GRAPHQL_API_ENDPOINT } from '../../config/StaticConfig';

export interface INftApi {
  getNftTokenMarketplaceUrl(denomId: string, tokenId: string): Promise<any>;
}

export class NftApi implements INftApi {
  private readonly axiosClient: AxiosInstance;

  constructor() {
    this.axiosClient = axios.create({
      baseURL: NV_GRAPHQL_API_ENDPOINT,
    });
  }

  public async getNftTokenMarketplaceUrl(denomId: string, tokenId: string): Promise<string> {
    const result = await this.axiosClient.post('', {
      operationName: null,
      // variables: {
      //   denomId: 'u5bdc5e3e5ac9db7d489adb5fa3a68a5f',
      //   tokenId: 'edition2'
      // },
      variables: {
        denomId,
        tokenId,
      },
      query: `query ($denomId: String!, $tokenId: String!) {
        public {
          nftExplorerLink (
            denomId: $denomId,
            tokenId: $tokenId
          ) {
            link
          }
        }
      }
      `,
    });
    if (result.status !== 200 || result.data.errors) {
      return '';
    }

    return result.data.data.public.nftExplorerLink.link;
  }
}

export const croNftApi = new NftApi();
