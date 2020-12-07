import { Wallet } from '../models/Wallet';
import { StorageService } from '../storage/StorageService';
import { WalletCreateOptions, WalletCreator } from './WalletCreator';
import { DefaultWalletConfigs, WalletConfig } from '../config/StaticConfig';
import { WalletImporter, WalletImportOptions } from './WalletImporter';

class WalletService {
  private readonly storageService: StorageService;

  constructor() {
    this.storageService = new StorageService('app-db');
  }

  // eslint-disable-next-line class-methods-use-this
  public supportedConfigs(): WalletConfig[] {
    // TODO : Custom configuration wallets will be enabled on future iterations
    return [DefaultWalletConfigs.TestNetConfig, DefaultWalletConfigs.MainNetConfig];
  }

  // Create a new wallet and persist it on the db
  public async createAndSaveWallet(createOptions: WalletCreateOptions): Promise<Wallet> {
    const newWallet = WalletCreator.create(createOptions);
    await this.persistWallet(newWallet);
    return newWallet;
  }

  // Import or restore wallet and persist it on the db
  public async restoreAndSaveWallet(importOptions: WalletImportOptions): Promise<Wallet> {
    const importedWallet = WalletImporter.import(importOptions);
    await this.persistWallet(importedWallet);
    return importedWallet;
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
