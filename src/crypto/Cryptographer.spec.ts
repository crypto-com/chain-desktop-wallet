import 'mocha';
import { expect } from 'chai';

import { cryptographer } from './Cryptographer';

describe('Testing cryptographic functions', () => {
  it('Test scrypt hashing', () => {
    const salt =
      'b7d77c4ae11ddd640b888d02a75db90ef3c280fef9d0824910cb19572cf815382abef12b146e7f67ef7cee8e1ceef635b44705f1e76a7671ad510133ec3760f2d6f593d374743f8fb3b8d4182f5c';
    const salt2 =
      'ff8aaa88d95817568093f1b8bdafe2a5684ee7aac6f43fa61130069018c6655f64a6712c116a8c985137b7a954545f91ffc68a1135f5d5123c03ca2b98a6813b3d66ddd36a4291f212b7ec111656';

    const data = 'somePass$1100ZX';
    const data2 = 'someAwesomePass##';
    const hashResult = cryptographer.computeHash(data, salt);

    expect(hashResult.data).to.eq(
      '18155f2ca24976b780c4b4614f18ffe78ff3ef37b26a31e8b9810d6208e3652c4179dd4643f06c0a8632ba0d625e7c3dd9d8395c72716b20b3f5df436b09a99c',
    );

    const hashResult2 = cryptographer.computeHash(data2, salt2);
    expect(hashResult2.data).to.eq(
      '993ac70b6306d33883ba049dd68d98cec94c29f6ec7506bc8dc5a6e52cfec9d2b5d1d9a30580131879a763520005c4098ba185b2d5a3e47b77bf3d6499891c92',
    );
  });

  it('Test data encryption & decryption', async () => {
    const phrase =
      'ramp sock spice enrich exhibit skate empower process kit pudding olive mesh friend camp labor coconut devote shell argue system pig then provide nose';

    const encryptionKey = 'somePass$1100ZX';
    const iv = await cryptographer.generateIV();
    const encryptionResult = await cryptographer.encrypt(phrase, encryptionKey, iv);

    const decryptedPhrase = await cryptographer.decrypt(encryptionResult.cipher, encryptionKey, iv);

    expect(decryptedPhrase).to.eq(
      'ramp sock spice enrich exhibit skate empower process kit pudding olive mesh friend camp labor coconut devote shell argue system pig then provide nose',
    );

    const phrase2 =
      'team school reopen cave banner pass autumn march immune album hockey region baby critic insect armor pigeon owner number velvet romance flight blame tone';

    const encryptionKey2 = 'sdSpASS34@@Secure';
    const iv2 = await cryptographer.generateIV();
    const encryptionResult2 = await cryptographer.encrypt(phrase2, encryptionKey2, iv2);

    const decryptedPhrase2 = await cryptographer.decrypt(
      encryptionResult2.cipher,
      encryptionKey2,
      iv2,
    );

    expect(decryptedPhrase2).to.eq(
      'team school reopen cave banner pass autumn march immune album hockey region baby critic insect armor pigeon owner number velvet romance flight blame tone',
    );
  });

  it('Test random salt generator', () => {
    for (let i = 0; i < 10; i++) {
      expect(cryptographer.generateSalt()).to.not.eq(null);
      expect(cryptographer.generateSalt().length).to.eq(128);
    }
  });
});
