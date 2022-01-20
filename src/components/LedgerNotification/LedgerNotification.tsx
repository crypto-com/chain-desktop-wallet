import React from 'react';
import { Button, notification } from 'antd';
import { setRecoil } from 'recoil-nexus';
import i18n from '../../language/I18n';
import { LedgerConnectedApp, ledgerIsConnectedState } from '../../recoil/atom';
import { Wallet } from '../../models/Wallet';
import IconEth from '../../svg/IconEth';
import IconCro from '../../svg/IconCro';
import { createLedgerDevice, LEDGER_WALLET_TYPE } from '../../service/LedgerService';
import { UserAssetType } from '../../models/UserAsset';

export function ledgerNotification(wallet: Wallet, assetType: UserAssetType) {
  const clickCheckLedger = async () => {
    try {
      const { addressIndex, config, walletType } = wallet;
      const addressprefix = config.network.addressPrefix;
      if (LEDGER_WALLET_TYPE === walletType) {
        const device = createLedgerDevice();
        if (assetType === UserAssetType.TENDERMINT || assetType === UserAssetType.IBC) {
          await device.getAddress(addressIndex, addressprefix, true);
          setRecoil(ledgerIsConnectedState, LedgerConnectedApp.CRYPTO_ORG);
        }
        if (
          assetType === UserAssetType.EVM ||
          assetType === UserAssetType.CRC_20_TOKEN ||
          assetType === UserAssetType.ERC_20_TOKEN
        ) {
          await device.getEthAddress(addressIndex, true);
          setRecoil(ledgerIsConnectedState, LedgerConnectedApp.ETHEREUM);
        }
        notification.close('LedgerNotification');
      }
    } catch (e) {
      notification.error({
        message: i18n.t('receive.notification.ledgerConnect.message'),
        description: i18n.t('receive.notification.ledgerConnect.description'),
        placement: 'topRight',
        duration: 3,
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
        key: 'LedgerNotification',
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
        key: 'LedgerNotification',
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
