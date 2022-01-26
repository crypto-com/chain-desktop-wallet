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
import { LEDGER_WALLET_TYPE } from '../../../service/LedgerService';
import NoticeDisclaimer from '../../../components/NoticeDisclaimer/NoticeDisclaimer';
import { ledgerNotification } from '../../../components/LedgerNotification/LedgerNotification';

interface ReceiveDetailProps {
  currentAsset: UserAsset | undefined;
  session: Session;
  isNft?: boolean;
}

const ReceiveDetail: React.FC<ReceiveDetailProps> = props => {
  const { currentAsset, session, isNft } = props;
  const [isLedger, setIsLedger] = useState(false);

  const [t] = useTranslation();
  useEffect(() => {
    const { walletType } = session.wallet;
    setIsLedger(LEDGER_WALLET_TYPE === walletType);
  });

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

  const assetAddress = (asset, _session) => {
    const { assetType, address } = asset;
    const { wallet } = _session;

    // For Multi-Assets
    switch (assetType) {
      case UserAssetType.TENDERMINT:
        return address;
      case UserAssetType.EVM:
      case UserAssetType.CRC_20_TOKEN:
        return address;
      case UserAssetType.IBC:
        return wallet.address;
      default:
        return wallet.address;
    }
  };

  return (
    <div className="receive-detail">
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
      <NoticeDisclaimer>
        {t('receive.disclaimer', {
          assetSymbol: isNft ? 'NFT' : currentAsset?.symbol,
          assetName: currentAsset?.name,
        })}
      </NoticeDisclaimer>
      {isLedger && (
        <div className="ledger">
          <Button type="primary" onClick={() => ledgerNotification(session.wallet, currentAsset!)}>
            {t('receive.button')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ReceiveDetail;
