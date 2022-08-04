import { HdPath, Slip10RawIndex } from '@cosmjs/stargate/node_modules/@cosmjs/crypto';
import { DerivationPathStandard } from '../signers/LedgerSigner';

export class MakeHdPath {
  private readonly account: number;

  private readonly addressIndex: number;

  private constructor(index: number, standard: DerivationPathStandard) {
    this.account = standard === DerivationPathStandard.BIP44 ? 0 : index;
    this.addressIndex = standard === DerivationPathStandard.LEDGER_LIVE ? 0 : index;
  }

  public static init(index: number, standard: DerivationPathStandard) {
    return new MakeHdPath(index, standard);
  }

  public cryptoOrgTestnet(): HdPath {
    return [
      Slip10RawIndex.hardened(44),
      Slip10RawIndex.hardened(1),
      Slip10RawIndex.hardened(this.account),
      Slip10RawIndex.normal(0),
      Slip10RawIndex.normal(this.addressIndex),
    ];
  }

  public cryptoOrgMainnet(): HdPath {
    return [
      Slip10RawIndex.hardened(44),
      Slip10RawIndex.hardened(394),
      Slip10RawIndex.hardened(this.account),
      Slip10RawIndex.normal(0),
      Slip10RawIndex.normal(this.addressIndex),
    ];
  }

  public cosmosHubMainnet(): HdPath {
    return [
      Slip10RawIndex.hardened(44),
      Slip10RawIndex.hardened(118),
      Slip10RawIndex.hardened(this.account),
      Slip10RawIndex.normal(0),
      Slip10RawIndex.normal(this.addressIndex),
    ];
  }
}
