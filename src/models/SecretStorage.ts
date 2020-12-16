// Hashed credential
export interface EncryptedCredential {
  hash: HashResult;
}

export interface EncryptedSeed {
  walletId: string;
  data: EncryptionResult;
}

export interface WalletEncrypted {
  walletId: string;
  encryption: EncryptionResult;
}

export interface HashResult {
  data: string;
  salt: string;
}

export interface EncryptionResult {
  cipher: string;
  iv: InitialVector;
}

export interface InitialVector {
  words: number[];
  sigBytes: number;
}
