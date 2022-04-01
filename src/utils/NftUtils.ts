import { Promise } from 'bluebird';

import { isJson } from './utils';
import { CommonNftModel, CryptoOrgNftModel, isCryptoOrgNftModel } from '../models/Transaction';
import { croNftApi } from '../service/rpc/NftApi';
import { ExternalNftMetadataResponse } from '../service/rpc/models/nftApi.models';

export class NftUtils {
  public static async extractTokenMetadata(tokenDataString: string, denomId?: string) {
    const parsedTokenData = JSON.parse(tokenDataString);

    // ETH Wrapped or External issued NFT
    if (parsedTokenData.isExternal && denomId) {
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
    currentList: CommonNftModel[] | undefined,
    maxTotal: number = currentList?.length ?? 0,
  ) => {
    if (currentList) {
      // const cryptoOrgNftList: CryptoOrgNftModel[] = currentList.filter(nft => {
      //   return nft.type === NftType.CRYPTO_ORG;
      // })
      return await Promise.map(currentList.slice(0, maxTotal), async nft => {
        // console.log('nft', nft)
        if (isCryptoOrgNftModel(nft)) {
          const { model } = nft;

          const denomSchema = isJson(model.denomSchema) ? JSON.parse(model.denomSchema) : null;
          const tokenData = isJson(model.tokenData)
            ? await NftUtils.extractTokenMetadata(model.tokenData, model.denomId)
            : null;
          const nftModel: CryptoOrgNftModel = {
            ...nft,
            denomSchema,
            tokenData,
          };
          return nftModel;
        }
        return nft;
      });
    }
    return [];
  };
}
