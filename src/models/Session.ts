import { Wallet } from './Wallet';
import { UserAsset } from './UserAsset';

export class Session {
  // Session holds currently selected wallet
  public readonly wallet: Wallet;

  public readonly currency: string;

  public readonly activeAsset?: UserAsset;

  public static SESSION_ID = 'SESSION_ID';

  constructor(
    wallet: Wallet,
    activeAsset: UserAsset | undefined = undefined,
    currency: string = 'USD',
  ) {
    this.wallet = wallet;
    this.activeAsset = activeAsset;
    this.currency = currency;
  }
}
