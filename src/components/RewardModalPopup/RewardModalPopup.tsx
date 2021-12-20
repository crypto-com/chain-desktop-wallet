import React, { useState, useEffect } from 'react';
import { Tooltip } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import numeral from 'numeral';
import Big from 'big.js';
import { useTranslation } from 'react-i18next';
import './RewardModalPopup.less';

import {
  UserAsset,
  AssetMarketPrice,
  scaledAmount,
  scaledAmountByAsset,
  scaledRewardBalance,
  getAssetAmountInFiat,
  getAssetRewardsBalancePrice,
} from '../../models/UserAsset';
import { RewardsBalances } from '../../models/Transaction';
import { SUPPORTED_CURRENCY } from '../../config/StaticConfig';
import ModalPopup from '../ModalPopup/ModalPopup';

interface RewardModalPopupProps {
  // children: React.ReactNode;
  handleOk(): void;
  handleCancel(): void;
  isModalVisible: boolean;
  walletAsset: UserAsset | undefined;
  marketData: AssetMarketPrice | undefined;
  rewards: RewardsBalances | undefined;
  title?: string; // card title
  className?: string; // combine parent className
  style?: object;
  button?: React.ReactNode;
  // okButtonProps?: object;
  disabled?: boolean;
  footer?: Array<React.ReactNode>;
}

const RewardModalPopup: React.FC<RewardModalPopupProps> = props => {
  const { handleOk, handleCancel, isModalVisible, walletAsset, marketData, rewards } = props;
  const [claimedRewards, setClaimedRewards] = useState('0');
  const [estimatedRewards, setEstimatedRewards] = useState('0');
  const [estimatedApy, setEstimatedApy] = useState('0');

  const [t] = useTranslation();

  useEffect(() => {
    setClaimedRewards(rewards?.claimedRewardsBalance ?? '0');
    setEstimatedRewards(rewards?.estimatedRewardsBalance ?? '0');
    setEstimatedApy((Number(rewards?.estimatedApy ?? '0') * 100).toPrecision(4));
  });

  return (
    <ModalPopup
      isModalVisible={isModalVisible}
      handleCancel={handleCancel}
      handleOk={handleOk}
      className="my-reward-modal"
      footer={[]}
      okText="OK"
    >
      <>
        <div className="upper-container">
          <div className="title">{t('staking.modal4.title')}</div>
          <div className="my-total-rewards balance">
            <div className="title">{t('staking.modal4.label1')}</div>
            {walletAsset && (
              <div className="quantity">
                {numeral(
                  scaledAmount(
                    new Big(walletAsset.rewardsBalance || '0')
                      .add(claimedRewards || '0')
                      .toFixed(2),
                    walletAsset.decimals,
                  ),
                ).format('0,0.0000')}{' '}
                {walletAsset?.symbol}
              </div>
            )}
            <div className="fiat">
              {walletAsset && marketData && marketData.price
                ? `${SUPPORTED_CURRENCY.get(marketData.currency)?.symbol}${numeral(
                    getAssetAmountInFiat(
                      scaledAmount(
                        new Big(walletAsset.rewardsBalance || '0')
                          .add(claimedRewards || '0')
                          .toFixed(2),
                        walletAsset.decimals,
                      ),
                      marketData,
                    ),
                  ).format('0,0.00')} ${marketData?.currency}
              `
                : ''}
            </div>
          </div>
        </div>
        <div className="lower-container">
          {walletAsset && (
            <>
              <div className="balance">
                <div className="title">
                  <span>{t('staking.modal4.label5')}</span>
                  <Tooltip placement="top" title={t('staking.modal4.tooltip1')}>
                    <ExclamationCircleOutlined style={{ color: '#1199fa', marginLeft: '5px' }} />
                  </Tooltip>
                </div>
                {walletAsset && (
                  <div className="quantity">
                    {numeral(scaledRewardBalance(walletAsset)).format('0,0.0000')}{' '}
                    {walletAsset?.symbol}
                  </div>
                )}
                <div className="fiat">
                  {walletAsset && marketData && marketData.price
                    ? `${SUPPORTED_CURRENCY.get(marketData.currency)?.symbol}${numeral(
                        getAssetRewardsBalancePrice(walletAsset, marketData),
                      ).format('0,0.00')} ${marketData?.currency}
              `
                    : ''}
                </div>
              </div>
              <div className="balance">
                <div className="title">
                  <span>{t('staking.modal4.label2')}</span>
                  <Tooltip placement="top" title={t('staking.modal4.tooltip2')}>
                    <ExclamationCircleOutlined style={{ color: '#1199fa', marginLeft: '5px' }} />
                  </Tooltip>
                </div>
                {walletAsset && (
                  <div className="quantity">
                    {numeral(scaledAmountByAsset(claimedRewards, walletAsset)).format('0,0.0000')}{' '}
                    {walletAsset?.symbol}
                  </div>
                )}
                <div className="fiat">
                  {walletAsset && marketData && marketData.price
                    ? `${SUPPORTED_CURRENCY.get(marketData.currency)?.symbol}${numeral(
                        getAssetAmountInFiat(
                          scaledAmountByAsset(claimedRewards, walletAsset),
                          marketData,
                        ),
                      ).format('0,0.00')} ${marketData?.currency}
              `
                    : ''}
                </div>
              </div>
              <div className="balance">
                <div className="title">
                  <span>{t('staking.modal4.label3')}</span>
                  <Tooltip placement="top" title={t('staking.modal4.tooltip3')}>
                    <ExclamationCircleOutlined style={{ color: '#1199fa', marginLeft: '5px' }} />
                  </Tooltip>
                </div>
                {walletAsset && (
                  <div className="quantity">
                    {numeral(scaledAmountByAsset(estimatedRewards, walletAsset)).format('0,0.0000')}{' '}
                    {walletAsset?.symbol}
                  </div>
                )}
                <div className="fiat">
                  {walletAsset && marketData && marketData.price
                    ? `${SUPPORTED_CURRENCY.get(marketData.currency)?.symbol}${numeral(
                        getAssetAmountInFiat(
                          scaledAmountByAsset(estimatedRewards, walletAsset),
                          marketData,
                        ),
                      ).format('0,0.00')} ${marketData?.currency}
              `
                    : ''}
                </div>
              </div>
              <div className="balance">
                <div className="title">
                  <span>{t('staking.modal4.label4')}</span>
                  <Tooltip placement="top" title={t('staking.modal4.tooltip4')}>
                    <ExclamationCircleOutlined style={{ color: '#1199fa', marginLeft: '5px' }} />
                  </Tooltip>
                </div>
                <div className="quantity">{`${estimatedApy}%`}</div>
              </div>
            </>
          )}
        </div>
      </>
    </ModalPopup>
  );
};

export default RewardModalPopup;
