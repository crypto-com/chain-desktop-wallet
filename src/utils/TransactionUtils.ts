import Big from 'big.js';
import { AddressType } from '@crypto-org-chain/chain-jslib/lib/dist/utils/address';
import { Session } from '../models/Session';
import { UserAsset } from '../models/UserAsset';
import i18n from '../language/I18n';
import { AssetAddressValidator } from '../service/AssetAddressValidator';

export class TransactionUtils {
  public static addressValidator(
    currentSession: Session,
    walletAsset: UserAsset,
    type: AddressType,
  ) {
    const addressType =
      type === AddressType.VALIDATOR ? i18n.t('general.validator') : i18n.t('general.receiving');

    return () => ({
      validator(rule, value) {
        const reason = `${i18n.t('general.addressValidator.reason1')} ${
          walletAsset.symbol
        } ${addressType} ${i18n.t('general.addressValidator.reason2')}`;

        const addressValidator = new AssetAddressValidator(
          value,
          currentSession.wallet.config,
          walletAsset.assetType,
        );

        try {
          if (addressValidator.validate(type)) {
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
        return Promise.reject(`${i18n.t('general.validTransactionAmountValidator.reason')}`);
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
}
