import { Promise } from 'bluebird';

import { ellipsis, isJson } from './utils';
import {
  CommonNftModel,
  CryptoOrgNftModel,
  isCronosNftModel,
  isCryptoOrgNftModel,
  NftList,
} from '../models/Nft';
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

  public static renderNftTitle = (_nft: CommonNftModel | undefined, length: number = 999) => {
    if (_nft) {
      if (isCryptoOrgNftModel(_nft)) {
        const { model, tokenData } = _nft;

        if (tokenData && tokenData.name) {
          return ellipsis(tokenData.name, length);
        }
        if (tokenData && tokenData.drop) {
          return ellipsis(tokenData.drop, length);
        }

        return ellipsis(`${model.denomId} - #${model.tokenId}`, length);
      }
      if (isCronosNftModel(_nft)) {
        const { model } = _nft;
        if (model.name) {
          return ellipsis(`${model.name} - #${model.token_id}`, length);
        }

        return ellipsis(`${model.token_address} - #${model.token_id}`, length);
      }
    }

    return 'n.a.';
  };

  public static supportedVideo = (mimeType: string | undefined) => {
    switch (mimeType) {
      case 'video/mp4':
        // case 'video/webm':
        // case 'video/ogg':
        // case 'audio/ogg':
        // case 'audio/mpeg':
        return true;
      default:
        return false;
    }
  };

  public static processNftList = async (
    currentList: CommonNftModel[] | undefined,
    maxTotal: number = currentList?.length ?? 0,
  ) => {
    if (currentList) {
      return await Promise.map(currentList.slice(0, maxTotal), async nft => {
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

  public static groupAllNftList = async (lists: NftList[] | undefined, maxTotal: number = 0) => {
    const fullNftList: CommonNftModel[] = [];

    if (!lists || lists?.length === 0) {
      return [];
    }

    await Promise.all(
      lists.map(async list => {
        await Promise.all(
          list.nfts.map(async nft => {
            if (isCryptoOrgNftModel(nft)) {
              const { model } = nft;

              const denomSchema = isJson(model.denomSchema) ? JSON.parse(model.denomSchema) : null;
              const tokenData = isJson(model.tokenData)
                ? await NftUtils.extractTokenMetadata(model.tokenData, model.denomId)
                : null;

              fullNftList.push({
                ...nft,
                denomSchema,
                tokenData,
              });
            }
            if (isCronosNftModel(nft)) {
              fullNftList.push(nft);
            }
          }),
        );
      }),
    );

    return fullNftList.slice(0, maxTotal !== 0 ? maxTotal : fullNftList.length);
  };
}
