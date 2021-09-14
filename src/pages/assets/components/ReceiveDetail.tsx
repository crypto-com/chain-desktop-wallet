import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode.react';
// import numeral from 'numeral';
import { useTranslation } from 'react-i18next';
import 'antd/dist/antd.css';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Button, notification } from 'antd';
import { CopyOutlined } from '@ant-design/icons';

import './ReceiveDetail.less';
import { Session } from '../../../models/Session';
import { UserAsset, UserAssetType } from '../../../models/UserAsset';
import { LEDGER_WALLET_TYPE, createLedgerDevice } from '../../../service/LedgerService';

interface ReceiveDetailProps {
  currentAsset: UserAsset | undefined;
  session: Session;
}

const ReceiveDetail: React.FC<ReceiveDetailProps> = props => {
  const { currentAsset, session } = props;
  const [isLedger, setIsLedger] = useState(false);

  const [t] = useTranslation();

  useEffect(() => {
    const { walletType } = session.wallet;
    setIsLedger(LEDGER_WALLET_TYPE === walletType);
  });

  const clickCheckLedger = async () => {
    try {
      const { addressIndex, walletType, config } = session.wallet;
      const addressprefix = config.network.addressPrefix;
      if (LEDGER_WALLET_TYPE === walletType) {
        const device = createLedgerDevice();
        await device.getAddress(addressIndex, addressprefix, true);
      }
    } catch (e) {
      notification.error({
        message: t('receive.notification.ledgerConnect.message'),
        description: t('receive.notification.ledgerConnect.description'),
        placement: 'topRight',
        duration: 3,
      });
    }
  };

  const onCopyClick = () => {
    setTimeout(() => {
      notification.success({
        message: t('receive.notification.addressCopy.message'),
        description: t('receive.notification.addressCopy.description'),
        placement: 'topRight',
        duration: 2,
        key: 'copy',
      });
    }, 100);
  };

  // const assetIcon = asset => {
  //   const { icon_url, symbol } = asset;

  //   return icon_url ? (
  //     <img src={icon_url} alt="cronos" className="asset-icon" />
  //   ) : (
  //     <Avatar>{symbol[0].toUpperCase()}</Avatar>
  //   );
  // };

  const assetAddress = (asset, _session) => {
    const { assetType, address } = asset;
    const { wallet } = _session;
    // TO-DO Missing CRONOS support for Ledger
    if (wallet.walletType === LEDGER_WALLET_TYPE) {
      return wallet.address;
    }
    // For Multi-Assets
    switch (assetType) {
      case UserAssetType.TENDERMINT:
        return address;
      case UserAssetType.EVM:
        return address;
      case UserAssetType.IBC:
        return wallet.address;
      default:
        return wallet.address;
    }
  };

  return (
    <div className="receive-detail">
      {/* <div className="title">
        {assetIcon(currentAsset)}
        {currentAsset?.name} ({currentAsset?.symbol})
      </div> */}
      <div className="address">
        <QRCode value={assetAddress(currentAsset, session)} size={180} />
        <div className="name">{session.wallet.name}</div>
      </div>
      <CopyToClipboard text={assetAddress(currentAsset, session)}>
        <div className="copy" onClick={onCopyClick}>
          {assetAddress(currentAsset, session)}
          <CopyOutlined />
        </div>
      </CopyToClipboard>
      {isLedger && (
        <div className="ledger">
          <Button type="primary" onClick={clickCheckLedger}>
            {t('receive.button')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ReceiveDetail;
