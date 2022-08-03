import React, { useState } from 'react';
import { Button, notification } from 'antd';
import { setRecoil } from 'recoil-nexus';
import i18n from '../../language/I18n';
import { LedgerConnectedApp, ledgerIsConnectedState } from '../../recoil/atom';
import { Wallet } from '../../models/Wallet';
import IconEth from '../../svg/IconEth';
import IconCro from '../../svg/IconCro';
import { createLedgerDevice, LEDGER_WALLET_TYPE } from '../../service/LedgerService';
import { UserAsset, UserAssetType } from '../../models/UserAsset';
import { DerivationPathStandard } from '../../service/signers/LedgerSigner';
import { SupportedChainName } from '../../config/StaticConfig';
import IconCosmos from '../../svg/IconCosmos';

export function ledgerNotification(wallet: Wallet, asset: UserAsset) {
  const { assetType } = asset;

  const LedgerNotificationKey = 'LedgerNotification';
  const LedgerSuccessNotificationKey = 'LedgerSuccessNotification';
  const LedgerErrorNotificationKey = 'LedgerErrorNotification';

  const clickCheckLedger = async () => {
    try {
      const { addressIndex, derivationPathStandard, config, walletType } = wallet;
      const addressprefix =
        asset.config?.tendermintNetwork?.addressPrefix ?? config.network.addressPrefix;
      if (LEDGER_WALLET_TYPE === walletType) {
        const device = createLedgerDevice();
        if (assetType === UserAssetType.TENDERMINT || assetType === UserAssetType.IBC) {
          const ledgerAddress = await device.getAddress(
            addressIndex,
            addressprefix,
            asset.config?.tendermintNetwork?.chainName ?? SupportedChainName.CRYPTO_ORG,
            derivationPathStandard ?? DerivationPathStandard.BIP44,
            true,
          );

          if (ledgerAddress === asset.address) {
            if (asset.config?.tendermintNetwork?.chainName === SupportedChainName.COSMOS_HUB) {
              setRecoil(ledgerIsConnectedState, LedgerConnectedApp.COSMOS);
            } else {
              setRecoil(ledgerIsConnectedState, LedgerConnectedApp.CRYPTO_ORG);
            }
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
          const ledgerAddress = await device.getEthAddress(
            addressIndex,
            derivationPathStandard ?? DerivationPathStandard.BIP44,
            true,
          );

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

  const CheckLedgerBtn = () => {
    // eslint-disable-next-line
    const [loading, setLoading] = useState(false);
    return (
      <Button
        type="primary"
        size="small"
        className="btn-restart"
        onClick={async () => {
          setLoading(true);
          setTimeout(async () => {
            await clickCheckLedger();
            setLoading(false);
          }, 500);
        }}
        style={{ height: '30px', margin: '0px', lineHeight: 1.0 }}
        loading={loading}
      >
        {i18n.t('general.connect')}
      </Button>
    );
  };

  switch (assetType) {
    case UserAssetType.EVM:
    case UserAssetType.CRC_20_TOKEN:
    case UserAssetType.ERC_20_TOKEN:
      notification.open({
        key: LedgerNotificationKey,
        message: i18n.t('create.ledgerModalPopup.evmAddress.title2'),
        description: <div>{i18n.t('create.ledgerModalPopup.confirmAppConnection.description1', {
          app: LedgerConnectedApp.ETHEREUM,
        })}</div>,
        duration: 60,
        placement: 'topRight',
        className: 'notification-ledger',
        icon: (
          <div className="ledger-app-icon">
            <IconEth style={{ color: '#fff' }} />
          </div>
        ),
        btn: <CheckLedgerBtn />,
      });
      break;
    case UserAssetType.TENDERMINT:
    case UserAssetType.IBC:
      notification.open({
        key: LedgerNotificationKey,
        message: i18n.t('create.ledgerModalPopup.tendermintAddress.title2'),
        description: <div>{i18n.t('create.ledgerModalPopup.confirmAppConnection.description1', {
          app: asset.config?.tendermintNetwork?.chainName === SupportedChainName.COSMOS_HUB
            ? LedgerConnectedApp.COSMOS
            : LedgerConnectedApp.CRYPTO_ORG,
        })}</div>,
        duration: 60,
        placement: 'topRight',
        className: 'notification-ledger',
        icon: (
          <div className="ledger-app-icon">
            {asset.config?.tendermintNetwork?.chainName === SupportedChainName.COSMOS_HUB ? (
              <IconCosmos style={{ color: '#fff' }} />
            ) : (
              <IconCro style={{ color: '#fff' }} />
            )}
          </div>
        ),
        btn: <CheckLedgerBtn />,
      });
      break;
    default:
      break;
  }
}

export function ledgerNotificationWithoutCheck(
  assetType: UserAssetType,
  chainName?: SupportedChainName,
) {
  const LedgerNotificationKey = 'LedgerNotification';
  const LedgerSuccessNotificationKey = 'LedgerSuccessNotification';
  const LedgerErrorNotificationKey = 'LedgerErrorNotification';

  const clickCheckLedger = async () => {
    try {
      const device = createLedgerDevice();
      if (assetType === UserAssetType.TENDERMINT || assetType === UserAssetType.IBC) {
        await device.getPubKey(0, chainName!, DerivationPathStandard.BIP44, false);

        if (chainName === SupportedChainName.COSMOS_HUB) {
          setRecoil(ledgerIsConnectedState, LedgerConnectedApp.COSMOS);
        } else {
          setRecoil(ledgerIsConnectedState, LedgerConnectedApp.CRYPTO_ORG);
        }
        notification.close(LedgerNotificationKey);
        notification.close(LedgerErrorNotificationKey);
        notification.success({
          message: i18n.t('home.ledgerModalPopup.tendermintAsset.title1'),
          description: i18n.t('home.ledgerModalPopup.tendermintAsset.description1'),
          placement: 'topRight',
          duration: 2,
          key: LedgerSuccessNotificationKey,
        });
      }
      if (
        assetType === UserAssetType.EVM ||
        assetType === UserAssetType.CRC_20_TOKEN ||
        assetType === UserAssetType.ERC_20_TOKEN
      ) {
        await device.getEthAddress(0, DerivationPathStandard.BIP44, false);
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

  const CheckLedgerBtn = () => {
    // eslint-disable-next-line
    const [loading, setLoading] = useState(false);
    return (
      <Button
        type="primary"
        size="small"
        className="btn-restart"
        onClick={async () => {
          setLoading(true);
          setTimeout(async () => {
            await clickCheckLedger();
            setLoading(false);
          }, 500);
        }}
        style={{ height: '30px', margin: '0px', lineHeight: 1.0 }}
        loading={loading}
      >
        {i18n.t('general.connect')}
      </Button>
    );
  };

  switch (assetType) {
    case UserAssetType.EVM:
    case UserAssetType.CRC_20_TOKEN:
    case UserAssetType.ERC_20_TOKEN:
      notification.open({
        key: LedgerNotificationKey,
        message: i18n.t('create.ledgerModalPopup.evmAddress.title2'),
        description: <div>{i18n.t('create.ledgerModalPopup.confirmAppConnection.description1', {
          app: LedgerConnectedApp.ETHEREUM,
        })}</div>,
        duration: 60,
        placement: 'topRight',
        className: 'notification-ledger',
        icon: (
          <div className="ledger-app-icon">
            <IconEth style={{ color: '#fff' }} />
          </div>
        ),
        btn: <CheckLedgerBtn />,
      });
      break;
    case UserAssetType.TENDERMINT:
    case UserAssetType.IBC:
      notification.open({
        key: LedgerNotificationKey,
        message: i18n.t('create.ledgerModalPopup.tendermintAddress.title2'),
        description: <div>{i18n.t('create.ledgerModalPopup.confirmAppConnection.description1', {
          app: chainName === SupportedChainName.COSMOS_HUB ? LedgerConnectedApp.COSMOS : LedgerConnectedApp.CRYPTO_ORG,
        })}</div>,
        duration: 60,
        placement: 'topRight',
        className: 'notification-ledger',
        icon: (
          <div className="ledger-app-icon">
            {chainName === SupportedChainName.COSMOS_HUB ? (
              <IconCosmos style={{ color: '#fff' }} />
            ) : (
              <IconCro style={{ color: '#fff' }} />
            )}
          </div>
        ),
        btn: <CheckLedgerBtn />,
      });
      break;
    default:
      break;
  }
}
