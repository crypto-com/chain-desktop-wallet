import {
  AddressType,
  AddressValidator,
} from '@crypto-org-chain/chain-jslib/lib/dist/utils/address';
import { ethers } from 'ethers';
import { WalletConfig } from '../config/StaticConfig';
import { UserAssetType } from '../models/UserAsset';

export class AssetAddressValidator {
  private readonly address: string;

  private readonly config: WalletConfig;

  private readonly assetType?: UserAssetType;

  constructor(address: string, config: WalletConfig, assetType?: UserAssetType) {
    this.address = address;
    this.config = config;
    this.assetType = assetType;
  }

  public validate(addressType: AddressType): boolean {
    switch (this.assetType) {
      case undefined:
      case UserAssetType.TENDERMINT:
      case UserAssetType.IBC: {
        const addressValidator = new AddressValidator({
          address: this.address,
          network: this.config.network,
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
