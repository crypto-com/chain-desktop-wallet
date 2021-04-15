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

// NORMAL
// EXPERT
// DISCONNECTED
export async function detectLedgerStatus(): Promise<String> {
  try {
    const device = createLedgerDevice();
    await device.getPubKey(LedgerWalletMaximum, false);
    return 'EXPERT';
  } catch (err) {
    const findResult = err.toString().search('Conditions not satisfied');
    if (findResult >= 0) return 'NORMAL';

    return 'DISCONNECTED';
  }
}
