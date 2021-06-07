import Big from 'big.js';
import {
  AddressType,
  AddressValidator,
} from '@crypto-org-chain/chain-jslib/lib/dist/utils/address';
import { Session } from '../models/Session';
import { UserAsset } from '../models/UserAsset';

export class TransactionUtils {
  public static addressValidator(
    currentSession: Session,
    walletAsset: UserAsset,
    type: AddressType,
  ) {
    const addressType = type === AddressType.VALIDATOR ? 'validator' : 'receiving';
    return () => ({
      validator(rule, value) {
        const reason = `Invalid ${walletAsset.symbol} ${addressType} address provided`;
        try {
          const addressValidator = new AddressValidator({
            address: value,
            network: currentSession.wallet.config.network,
            type,
          });

          if (addressValidator.isValid()) {
            return Promise.resolve();
          }

          // eslint-disable-next-line prefer-promise-reject-errors
          return Promise.reject(reason);
        } catch (e) {
          // eslint-disable-next-line prefer-promise-reject-errors
          return Promise.reject(reason);
        }
      },
    });
  }

  public static validTransactionAmountValidator() {
    return () => ({
      validator(rule, value) {
        if (!Number.isNaN(parseFloat(value)) && Number.isFinite(value) && Number(value) > 0) {
          return Promise.resolve();
        }
        // eslint-disable-next-line prefer-promise-reject-errors
        return Promise.reject(`Invalid sending amount`);
      },
    });
  }

  // min <= value <= max , both inclusive
  public static rangeValidator(min: string, max: string, reason: string) {
    return () => ({
      validator(rule, value) {
        if (Big(value).gte(min) && !Big(value).gt(max)) {
          return Promise.resolve();
        }
        // eslint-disable-next-line prefer-promise-reject-errors
        return Promise.reject(reason);
      },
    });
  }

  public static maxValidator(max: string, reason: string) {
    return () => ({
      validator(rule, value) {
        if (!Big(value).gt(max)) {
          return Promise.resolve();
        }
        // eslint-disable-next-line prefer-promise-reject-errors
        return Promise.reject(reason);
      },
    });
  }

  public static minValidator(min: string, reason: string) {
    return () => ({
      validator(rule, value) {
        if (Big(value).gte(min)) {
          return Promise.resolve();
        }
        // eslint-disable-next-line prefer-promise-reject-errors
        return Promise.reject(reason);
      },
    });
  }

  // public static maxMinValidation(currentBalance: string, inputValue: string) {
  //   const currentBalanceAmount = Big(currentBalance);
  //   const inputAmount = Big(inputValue);
  //
  //   if (inputAmount.gte(currentBalanceAmount)) {
  //     // eslint-disable-next-line prefer-promise-reject-errors
  //     return Promise.reject(`The amount input is greater than current balance`);
  //   }
  //
  //   if (currentBalanceAmount.eq(Big(0))) {
  //     // eslint-disable-next-line prefer-promise-reject-errors
  //     return Promise.reject(`The amount should be bigger than zero`);
  //   }
  //
  //   return Promise.resolve();
  // }
}
