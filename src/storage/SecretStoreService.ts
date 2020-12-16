import { DatabaseManager } from './DatabaseManager';
import { EncryptedCredential, EncryptionResult, EncryptedSeed } from '../models/SecretStorage';
import { cryptographer } from '../crypto/Cryptographer';

class SecretStoreService {
  private readonly db: DatabaseManager;

  private readonly CREDENTIAL_STORED_ID = 'CREDENTIAL_STORED_ID';

  constructor(namespace: string) {
    this.db = new DatabaseManager(namespace);
  }

  public async savePassword(credential: EncryptedCredential) {
    return this.db.credentialStore.update<EncryptedCredential>(
      { _id: this.CREDENTIAL_STORED_ID },
      { $set: credential },
      { upsert: true },
    );
  }

  public async hasPasswordBeenSet(): Promise<boolean> {
    const creds = await this.db.credentialStore.find({});
    return creds.length > 0;
  }

  public async checkIfPasswordIsValid(inputPassword: string): Promise<boolean> {
    const savedCred = await this.db.credentialStore.findOne<EncryptedCredential>({});
    const { salt } = savedCred.hash;
    const hashResult = cryptographer.computeHash(inputPassword, salt);
    return hashResult.data === savedCred.hash.data;
  }

  public async persistEncryptedPhrase(walletId: string, data: EncryptionResult) {
    const encryptedSeed: EncryptedSeed = {
      data,
      walletId,
    };
    return this.db.seedStore.insert<EncryptedSeed>(encryptedSeed);
  }
}

export const secretStoreService = new SecretStoreService('secrets');
