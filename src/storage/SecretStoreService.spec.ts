import 'mocha';
import { expect } from 'chai';

import { SecretStoreService } from './SecretStoreService';
import { getRandomId } from '../crypto/RandomGen';
import { EncryptedCredential } from '../models/SecretStorage';

describe('Testing Secret storage service', () => {
  const hashedCredential: EncryptedCredential = {
    hash: {
      data:
        '993ac70b6306d33883ba049dd68d98cec94c29f6ec7506bc8dc5a6e52cfec9d2b5d1d9a30580131879a763520005c4098ba185b2d5a3e47b77bf3d6499891c92',
      salt:
        'ff8aaa88d95817568093f1b8bdafe2a5684ee7aac6f43fa61130069018c6655f64a6712c116a8c985137b7a954545f91ffc68a1135f5d5123c03ca2b98a6813b3d66ddd36a4291f212b7ec111656',
    },
  };
  it('Test password hashing and comparison', async () => {
    const mockSecretStoreService = new SecretStoreService(`mock-${getRandomId()}`);

    await mockSecretStoreService.savePassword(hashedCredential);

    expect(await mockSecretStoreService.checkIfPasswordIsValid('someAwesomePass##')).to.eq(true);
  });
});
