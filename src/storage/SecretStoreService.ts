import { DatabaseManager } from './DatabaseManager';
import { Credential } from '../models/SecretStorage';

class SecretStoreService {
  private readonly db: DatabaseManager;

  private readonly CREDENTIAL_STORED_ID = 'CREDENTIAL_STORED_ID';

  constructor(namespace: string) {
    this.db = new DatabaseManager(namespace);
  }

  public async savePassword(credential: Credential) {
    return this.db.credentialStore.update<Credential>(
      { _id: this.CREDENTIAL_STORED_ID },
      { $set: credential },
      { upsert: true },
    );
  }

  public async hasPasswordBeenSet(): Promise<boolean> {
    const creds = await this.db.credentialStore.find({});
    return creds.length > 0;
  }
}

export const secretStoreService = new SecretStoreService('secrets');
