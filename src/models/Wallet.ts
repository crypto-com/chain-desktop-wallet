import {
  DefaultWalletConfigs,
  FIXED_DEFAULT_FEE,
  FIXED_DEFAULT_GAS_LIMIT,
  Network,
  WalletConfig,
} from '../config/StaticConfig';

export class Wallet {
  public readonly identifier: string;

  public readonly name: string;

  // Legacy field - Relevant only for single asset wallets created
  public address: string; // cosmos address

  public encryptedPhrase: string;

  public readonly config: WalletConfig;

  // Initially the wallet phrase is not encrypted,
  // it gets encrypted once the user provide a password,
  // which will later be used as encryption key
  // This will be set to true once the wallet phrase has been encrypted
  public hasBeenEncrypted: boolean = false;

  public readonly walletType: string;

  public readonly addressIndex: number; // for ledger

  constructor(
    id: string,
    name: string,
    address: string,
    config: WalletConfig,
    encryptedPhrase: string,
    hasBeenEncrypted: boolean = false,
    walletType: string,
    addressIndex: number,
  ) {
    this.identifier = id;
    this.name = name;
    this.address = address;
    this.config = config;
    this.encryptedPhrase = encryptedPhrase;
    this.hasBeenEncrypted = hasBeenEncrypted;
    this.walletType = walletType;
    this.addressIndex = addressIndex;
    // this.assets = [];
  }
}

export interface SettingsDataUpdate {
  walletId: string;
  chainId?: string | undefined;
  nodeUrl?: string | undefined;
  indexingUrl?: string | undefined;
  gasLimit?: string | undefined;
  networkFee?: string | undefined;
  explorer?: any | undefined;
}

export interface DisableDefaultMemoSettings {
  walletId: string;
  disableDefaultMemoAppend: boolean;
}

export interface DisableGASettings {
  walletId: string;
  analyticsDisabled: boolean;
}

export interface EnableGeneralSettingsPropagation {
  networkName: string;
  enabledGeneralSettings: boolean;
}

export interface CustomConfigFormValue {
  derivationPath: string;
  chainId: string;
  addressPrefix: string;
  validatorPrefix: string;
  baseDenom: string;
  croDenom: string;
  nodeUrl: string;
  indexingUrl: string;
}

export function reconstructCustomConfig(formValues: CustomConfigFormValue): WalletConfig {
  const customNetwork: Network = {
    defaultNodeUrl: formValues.nodeUrl,
    addressPrefix: formValues.addressPrefix,
    bip44Path: { account: 0, coinType: 0 },
    chainId: formValues.chainId,
    coin: { baseDenom: formValues.baseDenom, croDenom: formValues.croDenom },
    validatorAddressPrefix: formValues.validatorPrefix,
    validatorPubKeyPrefix: '', // Ignored
  };
  return {
    derivationPath: formValues.derivationPath,
    enabled: true,
    explorer: {},
    explorerUrl: '',
    name: DefaultWalletConfigs.CustomDevNet.name,
    network: customNetwork,
    nodeUrl: formValues.nodeUrl,
    indexingUrl: formValues.indexingUrl,
    disableDefaultClientMemo: false,
    enableGeneralSettings: false,
    analyticsDisabled: false,
    fee: {
      gasLimit: FIXED_DEFAULT_GAS_LIMIT,
      networkFee: FIXED_DEFAULT_FEE,
    },
  };
}
