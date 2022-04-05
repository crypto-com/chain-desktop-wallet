import axios, { AxiosInstance } from 'axios';
import { NV_GRAPHQL_API_ENDPOINT } from '../../config/StaticConfig';
import { ExternalNftMetadataResponse } from './models/nftApi.models';

export interface MintByCDCRequest {
  denomId: String;
  tokenIds: [String];
}

export interface INftApi {
  getNftListMarketplaceData(payload: MintByCDCRequest[]): Promise<any>;
  getExternalNftMetadataByIdentifier(denomId: string): Promise<ExternalNftMetadataResponse | []>;
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
          link
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

  /**
   * Fetch wrapped NFT metadata by a unique `identifier`
   * @param {string} denomId This is the unique identifier for the wrapped external NFT.
   */
  public async getExternalNftMetadataByIdentifier(
    denomId: string,
  ): Promise<ExternalNftMetadataResponse | []> {
    try {
      const result = await this.axiosClient.post<ExternalNftMetadataResponse>('', {
        operationName: 'TranslatedNft',
        variables: {
          denomId,
        },
        query: ` query TranslatedNft($denomId: String!) {
                    translatedNft(denomId: $denomId) {
                      translatable # Boolean!
                      metadata {
                        name # String!
                        description # String!
                        image # String!
                        mimeType # String!
                        dropId # String
                        animationUrl # String
                        animationMimeType # String
                        collectionId # String
                        attributes { # [AssetAttribute]
                          traitType
                          value
                        }
                      }
                    }
                  }`,
      });

      if (result.status !== 200 || result.data.errors) {
        return [];
      }
      return result.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(
        `[getExternalNftMetadataByIdentifier] Querying external nft metadata failed.`,
        error,
      );
      return [];
    }
  }
}

export const croNftApi = new NftApi();
