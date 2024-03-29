import { CryptoOrgNftResponse, NftDenomData } from '../service/rpc/ChainIndexingModels';
import { NftAssetsResponseAssetModel } from '../service/rpc/indexing/nft/cronos/CronosNftIndexingModels';
import { Attribute } from '../service/rpc/models/nftApi.models';

export enum NftType {
  CRONOS_TENDERMINT = 'CRONOS_TENDERMINT',

  CRC_721_TOKEN = 'CRC_721_TOKEN',
}

export type NftList = CommonNftModel[];

export interface CronosCRC721NftModelData extends NftAssetsResponseAssetModel {}

export interface BaseNftModel {
  walletId: string;
  type: NftType;
}

export interface CryptoOrgNftTokenData {
  name: string;
  drop: string;
  description: string;
  image?: string;
  mimeType?: string;
  animation_url?: string;
  animationUrl?: string;
  animationMimeType?: string;
  attributes?: Attribute[];
}

export interface CryptoOrgNftModelData extends CryptoOrgNftResponse {
  isMintedByCDC: boolean;
  marketplaceLink: string;
}

export type CommonNftModel = CryptoOrgNftModel | CronosCRC721NftModel;

export interface CryptoOrgNftModel extends BaseNftModel {
  type: NftType.CRONOS_TENDERMINT;
  model: CryptoOrgNftModelData;
  tokenData?: CryptoOrgNftTokenData;
  denomSchema?: any;
}

export interface CronosCRC721NftModel extends BaseNftModel {
  type: NftType.CRC_721_TOKEN;
  model: CronosCRC721NftModelData;
}

export function isCryptoOrgNftModel(
  checkObj: CommonNftModel | undefined,
): checkObj is CryptoOrgNftModel {
  const optionalUser = checkObj as CryptoOrgNftModel;
  // need to be sufficient to identify your case
  return isObject(optionalUser) && optionalUser.type === NftType.CRONOS_TENDERMINT;
}

export function isCronosNftModel(
  checkObj: CommonNftModel | undefined,
): checkObj is CronosCRC721NftModel {
  const optionalUser = checkObj as CronosCRC721NftModel;
  // need to be sufficient to identify your case
  return isObject(optionalUser) && optionalUser.type === NftType.CRC_721_TOKEN;
}

function isObject(obj: any) {
  return obj !== null && typeof obj === 'object';
}

export interface NftDenomModel extends NftDenomData {}
