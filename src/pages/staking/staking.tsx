import React, { useEffect, useState, useRef } from 'react';
import './staking.less';
import 'antd/dist/antd.css';
import moment from 'moment';
import { Layout, Table, Tabs } from 'antd';
import { useRecoilValue } from 'recoil';
import { useTranslation } from 'react-i18next';
import numeral from 'numeral';

import {
  allMarketState,
  sessionState,
  walletAssetState,
  fetchingDBState,
  validatorListState,
} from '../../recoil/atom';
import {
  AssetMarketPrice,
  getAssetStakingBalancePrice,
  getAssetUnbondingBalancePrice,
  getAssetRewardsBalancePrice,
  scaledStakingBalance,
  scaledUnbondingBalance,
  scaledRewardBalance,
  UserAsset,
} from '../../models/UserAsset';
import { UnbondingDelegationData } from '../../models/Transaction';
import { getUIDynamicAmount } from '../../utils/NumberUtils';
import { AnalyticsService } from '../../service/analytics/AnalyticsService';
import { walletService } from '../../service/WalletService';

import ModalPopup from '../../components/ModalPopup/ModalPopup';

import {
  MODERATION_CONFIG_FILE_URL,
  UNBLOCKING_PERIOD_IN_DAYS,
  SUPPORTED_CURRENCY,
} from '../../config/StaticConfig';
import { ModerationConfig } from '../../models/ModerationConfig';

import { FormDelegationOperations } from './components/FormDelegationOperations';
import { FormWithdrawStakingReward } from './components/FormWithdrawStakingReward';
import { FormDelegationRequest } from './components/FormDelegationRequest';

const { Header, Content, Footer, Sider } = Layout;
const { TabPane } = Tabs;

interface UnbondingDelegationTabularData {
  key: string;
  delegatorAddress: string;
  validatorAddress: string;
  unbondingAmount: string;
  unbondingAmountWithSymbol: string;
  remainingTime: string;
  completionTime: string;
}

const StakingPage = () => {
  const currentSession = useRecoilValue(sessionState);
  const userAsset = useRecoilValue(walletAssetState);
  const currentValidatorList = useRecoilValue(validatorListState);
  const fetchingDB = useRecoilValue(fetchingDBState);
  const allMarketData = useRecoilValue(allMarketState);

  const [marketData, setMarketData] = useState<AssetMarketPrice>();

  const [isUnbondingDelegationModalVisible, setIsUnbondingDelegationModalVisible] = useState(false);
  const [isUnbondingVisible, setIsUnbondingVisible] = useState(false);
  const [unbondingDelegations, setUnbondingDelegations] = useState<
    UnbondingDelegationTabularData[]
  >([]);
  const [moderationConfig, setModerationConfig] = useState<ModerationConfig>();
  const analyticsService = new AnalyticsService(currentSession);
  const didMountRef = useRef(false);

  const [t, i18n] = useTranslation();

  const undelegatePeriod =
    currentSession.wallet.config.name === 'MAINNET'
      ? UNBLOCKING_PERIOD_IN_DAYS.UNDELEGATION.MAINNET
      : UNBLOCKING_PERIOD_IN_DAYS.UNDELEGATION.OTHERS;

  const unbondingDelegationColumns = [
    {
      title: t('staking.modal3.table.validatorAddress'),
      dataIndex: 'validatorAddress',
      key: 'validatorAddress',
      render: text => (
        <a
          target="_blank"
          rel="noreferrer"
          href={`${currentSession.wallet.config.explorerUrl}/validator/${text}`}
        >
          {text}
        </a>
      ),
    },
    {
      title: t('staking.modal3.table.unbondingAmount'),
      dataIndex: 'unbondingAmount',
      key: 'unbondingAmount',
      render: text => {
        return <>{text}</>;
      },
    },
    {
      title: t('staking.modal3.table.remainingTime'),
      dataIndex: 'remainingTime',
      key: 'remainingTime',
      render: text => {
        return <>{text}</>;
      },
    },
    {
      title: t('staking.modal3.table.completionTime'),
      dataIndex: 'completionTime',
      key: 'completionTime',
      render: text => {
        return <>{text}</>;
      },
    },
  ];

  const formatRemainingTime = (completionTime: string) => {
    const currentLanguageLocale = i18n.language.replace(/([A-Z])/, '-$1').toLowerCase();

    const targetDate = moment(completionTime);

    // monent treat days > 26 as "a month", show number of days instead
    return moment
      .duration(targetDate.diff(moment()))
      .locale(currentLanguageLocale)
      .humanize({ d: 31 });
  };

  const convertUnbondingDelegations = (
    allUnbondingDelegations: UnbondingDelegationData[],
    currentAsset: UserAsset,
  ) => {
    return (
      allUnbondingDelegations
        .map((dlg, idx) => {
          const unbondingAmount = getUIDynamicAmount(dlg.unbondingAmount, currentAsset);
          const data: UnbondingDelegationTabularData = {
            key: `${idx}_${dlg.validatorAddress}_${dlg.unbondingAmount}_${dlg.completionTime}`,
            delegatorAddress: dlg.delegatorAddress,
            validatorAddress: dlg.validatorAddress,
            completionTime: new Date(dlg.completionTime).toString(),
            unbondingAmount,
            unbondingAmountWithSymbol: `${unbondingAmount} ${currentAsset.symbol}`,
            remainingTime: formatRemainingTime(dlg.completionTime),
          };
          return data;
        })
        // ONLY DISPLAY ``ACTIVE Unbonding Delegations``
        .filter(dlg => moment().diff(moment(dlg.completionTime)) < 0)
    );
  };

  useEffect(() => {
    const syncUnbondingDelegationsData = async () => {
      const allUnbonding = await walletService.retrieveAllUnbondingDelegations(
        currentSession.wallet.identifier,
      );

      const unbondingDelegationTabularData = convertUnbondingDelegations(allUnbonding, userAsset);
      setUnbondingDelegations(unbondingDelegationTabularData);

      setIsUnbondingVisible(unbondingDelegationTabularData.length > 0);
    };

    const moderationConfigHandler = async () => {
      try {
        const fetchModerationConfigData = await fetch(MODERATION_CONFIG_FILE_URL);
        const moderationConfigData = await fetchModerationConfigData.json();
        setModerationConfig(moderationConfigData);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error occurred while fetching moderation config file', error);
      }
    };

    syncUnbondingDelegationsData();

    setMarketData(allMarketData.get(`${userAsset?.mainnetSymbol}-${currentSession.currency}`));

    if (!didMountRef.current) {
      didMountRef.current = true;
      moderationConfigHandler();
      analyticsService.logPage('Staking');
    }
  }, [fetchingDB, currentValidatorList, userAsset]);

  return (
    <Layout className="site-layout">
      <Header className="site-layout-background">{t('staking.title')}</Header>

      <Content>
        <div className="site-layout-background balance-container">
          <div className="balance">
            <div className="title">{t('staking.balance.title1')}</div>
            {userAsset && (
              <div className="quantity">
                {numeral(scaledStakingBalance(userAsset)).format('0,0.0000')} {userAsset?.symbol}
              </div>
            )}
            <div className="fiat">
              {userAsset && marketData && marketData.price
                ? `${SUPPORTED_CURRENCY.get(marketData.currency)?.symbol}${numeral(
                    getAssetStakingBalancePrice(userAsset, marketData),
                  ).format(`0,0.00`)} ${marketData?.currency}`
                : ''}
            </div>
          </div>
          {isUnbondingVisible ? (
            <div className="balance">
              <div className="title">{t('staking.balance.title2')}</div>
              {userAsset && (
                <div className="quantity">
                  {numeral(scaledUnbondingBalance(userAsset)).format('0,0.0000')}{' '}
                  {userAsset?.symbol}
                </div>
              )}
              <div className="fiat">
                {userAsset && marketData && marketData.price
                  ? `${SUPPORTED_CURRENCY.get(marketData.currency)?.symbol}${numeral(
                      getAssetUnbondingBalancePrice(userAsset, marketData),
                    ).format('0,0.00')} ${marketData?.currency}
                `
                  : ''}
              </div>
            </div>
          ) : (
            <></>
          )}
          <div className="balance">
            <div className="title">{t('staking.balance.title3')}</div>
            {userAsset && (
              <div className="quantity">
                {numeral(scaledRewardBalance(userAsset)).format('0,0.0000')} {userAsset?.symbol}
              </div>
            )}
            <div className="fiat">
              {userAsset && marketData && marketData.price
                ? `${SUPPORTED_CURRENCY.get(marketData.currency)?.symbol}${numeral(
                    getAssetRewardsBalancePrice(userAsset, marketData),
                  ).format('0,0.00')} ${marketData?.currency}
                  `
                : ''}
            </div>
          </div>

          <ModalPopup
            isModalVisible={isUnbondingDelegationModalVisible}
            handleCancel={() => setIsUnbondingDelegationModalVisible(false)}
            handleOk={() => setIsUnbondingDelegationModalVisible(false)}
            className="unbonding-modal"
            footer={[]}
            okText="OK"
          >
            <>
              <div className="title">{t('staking.modal3.title')}</div>
              <div className="description">
                {t('staking.modal3.description', { unbondingPeriod: undelegatePeriod })}
              </div>
              <Table
                locale={{
                  triggerDesc: t('general.table.triggerDesc'),
                  triggerAsc: t('general.table.triggerAsc'),
                  cancelSort: t('general.table.cancelSort'),
                }}
                columns={unbondingDelegationColumns}
                dataSource={unbondingDelegations}
              />
            </>
          </ModalPopup>
        </div>
        <Tabs defaultActiveKey="1">
          <TabPane tab={t('staking.tab1')} key="1">
            <div className="site-layout-background stake-content">
              <div className="container">
                <div className="description">{t('staking.description1')}</div>
                <FormWithdrawStakingReward />
              </div>
            </div>
          </TabPane>
          <TabPane tab={t('staking.tab2')} key="2">
            <div className="site-layout-background stake-content">
              <div className="container">
                <div className="description">{t('staking.description2')}</div>
                <FormDelegationRequest moderationConfig={moderationConfig} />
              </div>
            </div>
          </TabPane>
          <TabPane tab={t('staking.tab3')} key="3">
            <div className="site-layout-background stake-content">
              <div className="container">
                <Layout>
                  <Sider width="60%">
                    <div className="description">{t('staking.description3')}</div>
                  </Sider>
                  {isUnbondingVisible ? (
                    <Content>
                      <div className="view-unstaking">
                        <a
                          onClick={() => {
                            setIsUnbondingDelegationModalVisible(true);
                          }}
                        >
                          {t('staking.modal3.button')}
                        </a>
                      </div>
                    </Content>
                  ) : (
                    <></>
                  )}
                </Layout>
                <FormDelegationOperations moderationConfig={moderationConfig} />
              </div>
            </div>
          </TabPane>
        </Tabs>
      </Content>
      <Footer />
    </Layout>
  );
};

export default StakingPage;
