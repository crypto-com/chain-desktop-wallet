import sdk from '@crypto-org-chain/chain-jslib';
import { ethers } from 'ethers';
import { UserAssetType } from '../models/UserAsset';
import { HDKey, Secp256k1KeyPair } from '../utils/ChainJsLib';
import { WalletConfig } from '../config/StaticConfig';

export class AddressGenerator {
  private readonly seed: string;

  private readonly config: WalletConfig;

  constructor(seed: string, config: WalletConfig) {
    this.seed = seed;
    this.config = config;
  }

  public getAddress(assetType: UserAssetType): string {
    switch (assetType) {
      case UserAssetType.TENDERMINT:
      case UserAssetType.IBC: {
        const cro = sdk.CroSDK({ network: this.config.network });
        const privateKey = HDKey.fromMnemonic(this.seed).derivePrivKey(this.config.derivationPath);
        const keyPair = Secp256k1KeyPair.fromPrivKey(privateKey);
        return new cro.Address(keyPair).account();
      }
      case UserAssetType.EVM:
        return ethers.Wallet.fromMnemonic(this.seed).address;
      default:
        throw new TypeError(`Unknown asset type: ${assetType}`);
    }
  }
}
