import React from 'react';
import 'antd/dist/antd.css';
import './TransactionDetail.less';
import { Tooltip } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { UserAsset, UserAssetType } from '../../../models/UserAsset';
import { getAssetTypeName, getChainName } from '../../../utils/utils';
import { Session } from '../../../models/Session';

interface AssetTypeTooltipProps {
  currentAsset: UserAsset | undefined;
  currentSession: Session;
}

const AssetTypeTooltip: React.FC<AssetTypeTooltipProps> = props => {
  const { currentAsset, currentSession } = props;

  const [t] = useTranslation();

  let tooltipMessage = <></>;
  switch (currentAsset?.assetType) {
    case UserAssetType.TENDERMINT:
    case UserAssetType.EVM:
      tooltipMessage = (
        <>
          {t('assets.assetTypeTooltip.nativeToken', {
            chainName: getChainName(currentAsset?.name, currentSession.wallet.config),
            nativeToken: 'CRO',
            assetType: 'Cronos',
          })}
          <br />
          <a
            href="https://help.crypto.com/en/articles/5495745-all-about-network-settings-mainnet-and-evm-chains"
            target="_blank"
            rel="noreferrer"
          >
            {t('assets.assetTypeTooltip.learnMore')}
          </a>
        </>
      );
      break;
    case UserAssetType.CRC_20_TOKEN:
      tooltipMessage = (
        <>
          {t('assets.assetTypeTooltip.crc20', {
            chainName: getChainName(currentAsset?.name, currentSession.wallet.config),
            nativeToken: 'CRO',
            assetType: 'CRC20',
          })}
          <br />
          <a
            href="https://help.crypto.com/en/articles/5495745-all-about-network-settings-mainnet-and-evm-chains"
            target="_blank"
            rel="noreferrer"
          >
            {t('assets.assetTypeTooltip.learnMore')}
          </a>
        </>
      );
      break;
    case UserAssetType.ERC_20_TOKEN:
      tooltipMessage = (
        <>
          {t('assets.assetTypeTooltip.crc20', {
            chainName: getChainName(currentAsset?.name, currentSession.wallet.config),
            nativeToken: 'ETH',
            assetType: 'ERC20',
          })}
          <br />
          <a
            href="https://help.crypto.com/en/articles/5495745-all-about-network-settings-mainnet-and-evm-chains"
            target="_blank"
            rel="noreferrer"
          >
            {t('assets.assetTypeTooltip.learnMore')}
          </a>
        </>
      );
      break;
    default:
  }

  return !currentAsset || !currentSession ? (
    <></>
  ) : (
    <div>
      {t('assets.assetTypeTooltip.whatIs')} {getAssetTypeName(currentAsset?.assetType)}?
      <Tooltip placement="top" title={tooltipMessage}>
        <ExclamationCircleOutlined
          style={{ color: '#1199fa', marginLeft: '5px', cursor: 'pointer' }}
        />
      </Tooltip>
    </div>
  );
};

export default AssetTypeTooltip;
