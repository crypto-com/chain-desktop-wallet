import { WalletConfig } from '../config/StaticConfig';

export class Wallet {
  public readonly id: string;

  public readonly name: string;

  public readonly address: string;

  public readonly encryptedPhrase: string;

  public readonly config: WalletConfig;

  constructor(
    id: string,
    name: string,
    address: string,
    config: WalletConfig,
    encryptedPhrase: string,
  ) {
    this.id = id;
    this.name = name;
    this.address = address;
    this.config = config;
    this.encryptedPhrase = encryptedPhrase;
  }
}
