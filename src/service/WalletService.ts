import { Wallet } from '../models/Wallet';
import { StorageService } from '../storage/StorageService';
import { WalletCreateOptions, WalletCreator } from './WalletCreator';
import { DefaultWalletConfigs, WalletConfig } from '../config/StaticConfig';

export class WalletService {
  private readonly storageService: StorageService;

  constructor() {
    this.storageService = new StorageService('app-db');
  }

  public static supportedConfigs(): WalletConfig[] {
    // TODO : On first iteration only TestNet configuration is supported
    return [DefaultWalletConfigs.TestNetConfig];
  }

  // Create a new wallet and persist it on the db
  public async createAndSaveWallet(createOptions: WalletCreateOptions): Promise<Wallet> {
    const newWallet = WalletCreator.create(createOptions);
    await this.persistWallet(newWallet);
    return newWallet;
  }

  // Load all persisted wallets
  public async loadAllWallets(): Promise<Wallet[]> {
    const wallets = await this.storageService.fetchWallets();
    return wallets.map(
      data =>
        new Wallet(data.identifier, data.name, data.address, data.config, data.encryptedPhrase),
    );
  }

  // Save freshly created or imported wallet
  public async persistWallet(wallet: Wallet) {
    await this.storageService.saveWallet(wallet);
  }

  public async findWalletByIdenifier(identifier: string): Promise<Wallet> {
    return this.storageService.findWalletByIdentifier(identifier);
  }
}

export const walletService = new WalletService();
