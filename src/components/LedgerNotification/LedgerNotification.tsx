import React from 'react';
import { Button, notification } from 'antd';
import { setRecoil } from 'recoil-nexus';
import i18n from '../../language/I18n';
import { LedgerConnectedApp, ledgerIsConnectedState } from '../../recoil/atom';
import { Wallet } from '../../models/Wallet';
import IconEth from '../../svg/IconEth';
import IconCro from '../../svg/IconCro';
import { createLedgerDevice, LEDGER_WALLET_TYPE } from '../../service/LedgerService';
import { UserAsset, UserAssetType } from '../../models/UserAsset';

export function ledgerNotification(wallet: Wallet, asset: UserAsset) {
  const { assetType } = asset;

  const LedgerNotificationKey = 'LedgerNotification';
  const LedgerSuccessNotificationKey = 'LedgerSuccessNotification';
  const LedgerErrorNotificationKey = 'LedgerErrorNotification';

  const clickCheckLedger = async () => {
    try {
      const { addressIndex, config, walletType } = wallet;
      const addressprefix = config.network.addressPrefix;
      if (LEDGER_WALLET_TYPE === walletType) {
        const device = createLedgerDevice();
        if (assetType === UserAssetType.TENDERMINT || assetType === UserAssetType.IBC) {
          const ledgerAddress = await device.getAddress(addressIndex, addressprefix, true);

          if (ledgerAddress === wallet.address) {
            setRecoil(ledgerIsConnectedState, LedgerConnectedApp.CRYPTO_ORG);
            notification.close(LedgerNotificationKey);
            notification.close(LedgerErrorNotificationKey);
            notification.success({
              message: i18n.t('home.ledgerModalPopup.tendermintAsset.title1'),
              description: i18n.t('home.ledgerModalPopup.tendermintAsset.description1'),
              placement: 'topRight',
              duration: 2,
              key: LedgerSuccessNotificationKey,
            });
          } else {
            notification.error({
              message: i18n.t('general.ledgerNotification.error.addressMismatch.title'),
              description: i18n.t('general.ledgerNotification.error.addressMismatch.description'),
              duration: 10,
              key: LedgerErrorNotificationKey,
            });
          }
        }
        if (
          assetType === UserAssetType.EVM ||
          assetType === UserAssetType.CRC_20_TOKEN ||
          assetType === UserAssetType.ERC_20_TOKEN
        ) {
          const ledgerAddress = await device.getEthAddress(addressIndex, true);

          if (ledgerAddress === asset.address) {
            setRecoil(ledgerIsConnectedState, LedgerConnectedApp.ETHEREUM);
            notification.close(LedgerNotificationKey);
            notification.close(LedgerErrorNotificationKey);
            notification.success({
              message: i18n.t('home.ledgerModalPopup.tendermintAsset.title1'),
              description: i18n.t('home.ledgerModalPopup.tendermintAsset.description1'),
              placement: 'topRight',
              duration: 2,
              key: LedgerSuccessNotificationKey,
            });
          } else {
            notification.error({
              message: i18n.t('general.ledgerNotification.error.addressMismatch.title'),
              description: i18n.t('general.ledgerNotification.error.addressMismatch.description'),
              duration: 10,
              key: LedgerErrorNotificationKey,
            });
          }
        }
      }
    } catch (e) {
      notification.error({
        message: i18n.t('receive.notification.ledgerConnect.message'),
        description: (
          <>
            {i18n.t('receive.notification.ledgerConnect.description')}
            <br /> -{' '}
            <a
              href="https://crypto.org/docs/wallets/ledger_desktop_wallet.html#ledger-connection-troubleshoot"
              target="_blank"
              rel="noreferrer"
            >
              {i18n.t('general.errorModalPopup.ledgerTroubleshoot')}
            </a>
          </>
        ),
        placement: 'topRight',
        duration: 10,
        key: LedgerErrorNotificationKey,
      });
      setRecoil(ledgerIsConnectedState, LedgerConnectedApp.NOT_CONNECTED);
    }
  };

  const checkLedgerBtn = (
    <Button
      type="primary"
      size="small"
      className="btn-restart"
      onClick={() => {
        clickCheckLedger();
      }}
      style={{ height: '30px', margin: '0px', lineHeight: 1.0 }}
    >
      {i18n.t('general.connect')}
    </Button>
  );

  switch (assetType) {
    case UserAssetType.EVM:
    case UserAssetType.CRC_20_TOKEN:
    case UserAssetType.ERC_20_TOKEN:
      notification.open({
        key: LedgerNotificationKey,
        message: i18n.t('create.ledgerModalPopup.evmAddress.title2'),
        description: <div>{i18n.t('create.ledgerModalPopup.evmAddress.description2')}</div>,
        duration: 60,
        placement: 'topRight',
        className: 'notification-ledger',
        icon: (
          <div className="ledger-app-icon">
            <IconEth style={{ color: '#fff' }} />
          </div>
        ),
        btn: checkLedgerBtn,
      });
      break;
    case UserAssetType.TENDERMINT:
    case UserAssetType.IBC:
      notification.open({
        key: LedgerNotificationKey,
        message: i18n.t('create.ledgerModalPopup.tendermintAddress.title2'),
        description: <div>{i18n.t('create.ledgerModalPopup.tendermintAddress.description2')}</div>,
        duration: 60,
        placement: 'topRight',
        className: 'notification-ledger',
        icon: (
          <div className="ledger-app-icon">
            <IconCro style={{ color: '#fff' }} />
          </div>
        ),
        btn: checkLedgerBtn,
      });
      break;
    default:
      break;
  }
}
