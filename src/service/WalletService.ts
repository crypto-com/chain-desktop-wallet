import { Wallet } from '../models/Wallet';
import { StorageService } from '../storage/StorageService';
import { WalletCreateOptions, WalletCreator } from './WalletCreator';
import { DefaultWalletConfigs, WalletConfig } from '../config/StaticConfig';
import { WalletImporter, WalletImportOptions } from './WalletImporter';
import { NodeRpcService } from './rpc/NodeRpcService';
import { TransferTransaction } from './signers/TransferTransaction';
import { TransactionSigner } from './signers/TransactionSigner';
import { Session } from '../models/Session';

class WalletService {
  private readonly storageService: StorageService;

  constructor() {
    this.storageService = new StorageService('app-db');
  }

  public async sendTransfer(fromAddress: string, toAddress: string, amount: string, memo: string) {
    const currentSession = await this.storageService.retrieveCurrentSession();
    const currentWallet = currentSession.wallet;

    const nodeRpc = await NodeRpcService.init(currentWallet.config.nodeUrl);

    const accountNumber = await nodeRpc.fetchAccountNumber(currentWallet.address);
    const accountSequence = await nodeRpc.loadSequenceNumber(currentWallet.address);

    const phrase = await this.decryptPhrase(currentSession);

    const transfer: TransferTransaction = {
      fromAddress,
      toAddress,
      amount,
      memo,
      accountNumber,
      accountSequence,
    };

    const transactionSigner = new TransactionSigner(currentWallet.config);

    const signedTxHex = transactionSigner.signTransfer(transfer, phrase);

    return nodeRpc.broadcastTransaction(signedTxHex);
  }

  // eslint-disable-next-line class-methods-use-this
  public async decryptPhrase(session: Session): Promise<string> {
    // TODO : Implement actual phrase decryption
    return Promise.resolve(session.wallet.encryptedPhrase);
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
