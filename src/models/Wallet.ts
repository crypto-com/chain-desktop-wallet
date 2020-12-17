import { WalletConfig } from '../config/StaticConfig';

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
  public readonly hasBeenEncrypted: boolean = false;

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
