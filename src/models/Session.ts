import { Wallet } from './Wallet';

export class Session {
  // Session holds currently selected wallet
  public readonly wallet: Wallet;

  public readonly currency: string;

  public static SESSION_ID = 'SESSION_ID';

  constructor(wallet: Wallet, currency: string = 'USD') {
    this.wallet = wallet;
    this.currency = currency;
  }
}
