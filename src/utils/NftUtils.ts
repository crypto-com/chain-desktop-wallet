import { Promise } from 'bluebird';

import { isJson } from './utils';
import { NftModel } from '../models/Transaction';
import { croNftApi } from '../service/rpc/NftApi';
import { ExternalNftMetadataResponse } from '../service/rpc/models/nftApi.models';

export class NftUtils {
  public static async extractTokenMetadata(tokenDataString: string, denomId: string) {
    const parsedTokenData = JSON.parse(tokenDataString);

    // ETH Wrapped or External issued NFT
    if (parsedTokenData.isExternal) {
      let externalMetadata = await croNftApi.getExternalNftMetadataByIdentifier(denomId);

      // On errors
      if (Array.isArray(externalMetadata) && !externalMetadata.length) {
        // eslint-disable-next-line no-console
        console.log(`[extractTokenMetadata], Unable to extract External token metadata.`);
        return parsedTokenData;
      }

      // Type casting for leveraging type support
      externalMetadata = externalMetadata as ExternalNftMetadataResponse;

      // On external metadata being `non-translatable`
      if (!externalMetadata.data.translatedNft.translatable) {
        // eslint-disable-next-line no-console
        console.log(`[extractTokenMetadata], External metadata is untranslatable.`);
        return parsedTokenData;
      }

      // Transform `translatable` external nft metadata
      if (
        externalMetadata.data.translatedNft.translatable &&
        externalMetadata.data.translatedNft.metadata
      ) {
        const { metadata } = externalMetadata.data.translatedNft;
        return {
          description: metadata?.description || '',
          drop: metadata?.dropId || null,
          image: metadata?.image || undefined,
          mimeType: metadata?.mimeType || '',
          animationUrl: metadata?.animationUrl || '',
          animationMimeType: metadata?.animationMimeType || '',
          name: metadata?.name || '',
          collectionId: metadata?.collectionId || '',
          attributes: metadata?.attributes || [],
        };
      }
    }

    // Crypto.org chain NFT Issued NFT
    return parsedTokenData;
  }

  public static processNftList = async (
    currentList: NftModel[] | undefined,
    maxTotal: number = currentList?.length ?? 0,
  ) => {
    if (currentList) {
      return await Promise.map(currentList.slice(0, maxTotal), async item => {
        const denomSchema = isJson(item.denomSchema)
          ? JSON.parse(item.denomSchema)
          : item.denomSchema;
        const tokenData = isJson(item.tokenData)
          ? await NftUtils.extractTokenMetadata(item.tokenData, item.denomId)
          : item.tokenData;
        const nftModel = {
          ...item,
          denomSchema,
          tokenData,
        };
        return nftModel;
      });
    }
    return [];
  };
}
