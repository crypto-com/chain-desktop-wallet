import { Wallet } from '../models/Wallet';
import { StorageService } from '../storage/StorageService';
import { WalletCreateOptions, WalletCreator } from './WalletCreator';

class WalletService {
  private readonly storageService: StorageService;

  constructor() {
    this.storageService = new StorageService('app-db');
  }

  // Create a new wallet and persist it on the db
  public async createNewWallet(createOptions: WalletCreateOptions) {
    const newWallet = WalletCreator.create(createOptions);
    await this.persistWallet(newWallet);
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
