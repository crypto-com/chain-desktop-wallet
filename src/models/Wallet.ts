import { DefaultWalletConfigs, Network, WalletConfig } from '../config/StaticConfig';

export class Wallet {
  public readonly identifier: string;

  public readonly name: string;

  public readonly address: string;

  public encryptedPhrase: string;

  public readonly config: WalletConfig;

  // Initially the wallet phrase is not encrypted,
  // it gets encrypted once the user provide a password,
  // which will later be used as encryption key
  // This will be set to true once the wallet phrase has been encrypted
  public hasBeenEncrypted: boolean = false;

  constructor(
    id: string,
    name: string,
    address: string,
    config: WalletConfig,
    encryptedPhrase: string,
  ) {
    this.identifier = id;
    this.name = name;
    this.address = address;
    this.config = config;
    this.encryptedPhrase = encryptedPhrase;
  }
}

export interface NodeData {
  walletId: string;
  chainId?: string | undefined;
  nodeUrl?: string | undefined;
  indexingUrl?: string | undefined;
}

export interface CustomConfigFormValue {
  derivationPath: string;
  chainId: string;
  addressPrefix: string;
  baseDenom: string;
  croDenom: string;
  nodeUrl: string;
  indexingUrl: string;
}

export function reconstructCustomConfig(formValues: CustomConfigFormValue): WalletConfig {
  const customNetwork: Network = {
    addressPrefix: formValues.addressPrefix,
    bip44Path: { account: 0, coinType: 0 },
    chainId: formValues.chainId,
    coin: { baseDenom: formValues.baseDenom, croDenom: formValues.croDenom },
    validatorAddressPrefix: '', // Ignored
    validatorPubKeyPrefix: '', // Ignored
  };
  return {
    derivationPath: formValues.derivationPath,
    enabled: true,
    explorerUrl: '',
    name: DefaultWalletConfigs.CustomDevNet.name,
    network: customNetwork,
    nodeUrl: formValues.nodeUrl,
    indexingUrl: formValues.indexingUrl,
  };
}
