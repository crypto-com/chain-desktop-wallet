import { AddressType, AddressValidator } from '@crypto-com/chain-jslib/lib/dist/utils/address';
import { Session } from '../models/Session';
import { UserAsset } from '../models/UserAsset';

export class TransactionUtils {
  public static receivingAddressValidator(currentSession: Session, walletAsset: UserAsset) {
    return () => ({
      validator(rule, value) {
        try {
          const addressValidator = new AddressValidator({
            address: value,
            network: currentSession.wallet.config.network,
            type: AddressType.USER,
          });

          if (addressValidator.isValid()) {
            return Promise.resolve();
          }

          // eslint-disable-next-line prefer-promise-reject-errors
          return Promise.reject(`Invalid ${walletAsset.symbol} receiving address`);
        } catch (e) {
          // eslint-disable-next-line prefer-promise-reject-errors
          return Promise.reject(`Invalid ${walletAsset.symbol} receiving address`);
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
