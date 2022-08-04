import {
  AddressType,
  AddressValidator,
} from '@crypto-org-chain/chain-jslib/lib/dist/utils/address';
import { ethers } from 'ethers';
import { Network } from '../config/StaticConfig';
import { UserAssetType } from '../models/UserAsset';

export class AssetAddressValidator {
  private readonly address: string;

  private readonly network: Network;

  private readonly assetType?: UserAssetType;

  constructor(address: string, network: Network, assetType?: UserAssetType) {
    this.address = address;
    this.network = network;
    this.assetType = assetType;
  }

  public validate(addressType: AddressType): boolean {
    switch (this.assetType) {
      case undefined:
      case UserAssetType.TENDERMINT:
      case UserAssetType.IBC: {
        const addressValidator = new AddressValidator({
          address: this.address,
          network: this.network,
          type: addressType,
        });
        return addressValidator.isValid();
      }
      case UserAssetType.EVM:
      case UserAssetType.CRC_20_TOKEN:
        return ethers.utils.isAddress(this.address);
      default:
        throw new TypeError(`Unknown asset type: ${this.assetType}`);
    }
  }
}
