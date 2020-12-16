import { DatabaseManager } from './DatabaseManager';
import { Credential } from '../models/SecretStorage';
import { Session } from '../models/Session';

export class SecretStoreService {
  private readonly db: DatabaseManager;

  private readonly CREDENTIAL_STORED_ID = 'CREDENTIAL_STORED_ID';

  constructor(namespace: string) {
    this.db = new DatabaseManager(namespace);
  }

  public async savePassword(credential: Credential) {
    return this.db.credentialStore.update<Credential>(
      { _id: Session.SESSION_ID },
      { $set: credential },
      { upsert: true },
    );
  }
}
