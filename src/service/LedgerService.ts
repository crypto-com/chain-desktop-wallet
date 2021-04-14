import { ISignerProvider } from './signers/SignerProvider';
// eslint-disable-next-line   @typescript-eslint/no-unused-vars
import { LedgerWalletSignerProviderNative } from './signers/LedgerWalletSignerProviderNative';
// eslint-disable-next-line     @typescript-eslint/no-unused-vars
import { LedgerWalletSignerProviderWebusb } from './signers/LedgerWalletSignerProviderWebusb';
import { LedgerWalletMaximum } from '../config/StaticConfig';

export const useWebusbForLedger = false;
export const LEDGER_WALLET_TYPE = 'ledger';
export const NORMAL_WALLET_TYPE = 'normal';
export function createLedgerDevice(): ISignerProvider {
  let signerProvider: ISignerProvider;
  if (useWebusbForLedger) {
    signerProvider = new LedgerWalletSignerProviderWebusb();
  } else {
    signerProvider = new LedgerWalletSignerProviderNative();
  }
  return signerProvider;
}

// true: ledger is expert-mode
export async function detectLedgerNormalMode(): Promise<boolean> {
  try {
    const device = createLedgerDevice();
    await device.getPubKey(LedgerWalletMaximum, false);
    return false;
  } catch (err) {
    return true;
  }
}
