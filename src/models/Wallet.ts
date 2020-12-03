import { WalletConfig } from '../config/StaticConfig';

export class Wallet {
  public readonly id: string;

  public readonly address: string;

  public readonly encryptedPhrase: string;

  public readonly config: WalletConfig;

  constructor(address: string, config: WalletConfig, encryptedPhrase: string) {
    const getRandomId = () =>
      Math.random()
        .toString(36)
        .substring(10);

    this.id = getRandomId();
    this.address = address;
    this.config = config;
    this.encryptedPhrase = encryptedPhrase;
  }
}
