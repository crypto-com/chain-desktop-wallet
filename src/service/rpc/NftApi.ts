import axios, { AxiosInstance } from 'axios';
import { NV_GRAPHQL_API_ENDPOINT } from '../../config/StaticConfig';

export interface MintByCDCRequest {
  denomId: String;
  tokenIds: [String];
}

export interface INftApi {
  getNftListMarketplaceData(payload: MintByCDCRequest[]): Promise<any>;
}

export class NftApi implements INftApi {
  private readonly axiosClient: AxiosInstance;

  constructor() {
    this.axiosClient = axios.create({
      baseURL: NV_GRAPHQL_API_ENDPOINT,
    });
  }

  public async getNftListMarketplaceData(payload: MintByCDCRequest[]): Promise<any> {
    const result = await this.axiosClient.post('', {
      operationName: null,
      variables: {
        payload,
      },
      query: ` query ($payload: [MintByCDCRequest!]!) {
        isMintedByCDC(
          payload: $payload
        ) {
          isMinted
          denomId
          tokenId
        }
      }
      `,
    });

    if (result.status !== 200 || result.data.errors) {
      return [];
    }

    return result.data.data.isMintedByCDC;
  }
}

export const croNftApi = new NftApi();
