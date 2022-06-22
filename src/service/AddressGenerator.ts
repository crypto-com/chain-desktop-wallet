import sdk from '@crypto-org-chain/chain-jslib';
import { DirectSecp256k1HdWallet } from '@cosmjs/stargate/node_modules/@cosmjs/proto-signing';
import { ethers } from 'ethers';
import { UserAssetConfig, UserAssetType } from '../models/UserAsset';
import { HDKey, Secp256k1KeyPair } from '../utils/ChainJsLib';
import { SupportedChainName, WalletConfig } from '../config/StaticConfig';
import { MakeHdPath } from './tendermint/MakeHdPath';
import { DerivationPathStandard } from './signers/LedgerSigner';

export class AddressGenerator {
  private readonly seed: string;

  private readonly config: WalletConfig;

  constructor(seed: string, config: WalletConfig) {
    this.seed = seed;
    this.config = config;
  }

  public async getAddress(
    assetType: UserAssetType,
    assetConfig?: UserAssetConfig,
  ): Promise<string> {
    switch (assetType) {
      case UserAssetType.TENDERMINT:
      case UserAssetType.IBC: {
        if (assetConfig?.tendermint) {
          const { tendermint } = assetConfig;
          const { addressPrefix: prefix, chain } = tendermint;
          let hdPaths;
          switch (chain) {
            case SupportedChainName.COSMOS_HUB:
              hdPaths = [MakeHdPath.init(0, DerivationPathStandard.BIP44).cosmosHubMainnet()];
              break;
            default:
              throw new TypeError(`Unsupported Chain: ${chain}`);
          }
          const wallet = await DirectSecp256k1HdWallet.fromMnemonic(this.seed, {
            hdPaths,
            prefix,
          });
          const [{ address: walletAddress }] = await wallet.getAccounts();
          return walletAddress;
        }
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
