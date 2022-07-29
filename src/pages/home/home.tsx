import React, { useEffect, useState, useRef } from 'react';
import { Link, useHistory } from 'react-router-dom';
import './home.less';
import 'antd/dist/antd.css';
import {
  Button,
  Layout,
  notification,
  Table,
  Tabs,
  Card,
  List,
  Avatar,
  Tag,
  Tooltip,
  Spin,
} from 'antd';
import { ExclamationCircleOutlined, LoadingOutlined, SyncOutlined } from '@ant-design/icons';
import { useRecoilState, useSetRecoilState } from 'recoil';
import numeral from 'numeral';
import Big from 'big.js';
import { useTranslation } from 'react-i18next';
import {
  hasShownWarningOnWalletTypeState,
  sessionState,
  allMarketState,
  walletAssetState,
  walletAllAssetsState,
  nftListState,
  navbarMenuSelectedKeyState,
  fetchingDBState,
} from '../../recoil/atom';
import { NOT_KNOWN_YET_VALUE, SUPPORTED_CURRENCY, WalletConfig } from '../../config/StaticConfig';
import { getUIDynamicAmount } from '../../utils/NumberUtils';
import { NftUtils } from '../../utils/NftUtils';
import { middleEllipsis, getChainName } from '../../utils/utils';
import {
  scaledAmount,
  scaledStakingBalance,
  getAssetBalancePrice,
  getAssetStakingBalancePrice,
  getAssetTotalBalancePrice,
  UserAsset,
  AssetMarketPrice,
} from '../../models/UserAsset';

import { RewardsBalances } from '../../models/Transaction';
import { CommonNftModel, isCronosNftModel, isCryptoOrgNftModel, NftList } from '../../models/Nft';

import { walletService } from '../../service/WalletService';
import { AnalyticsService } from '../../service/analytics/AnalyticsService';

// import logoCro from '../../assets/AssetLogo/cro.png';
import IconTick from '../../svg/IconTick';
import RewardModalPopup from '../../components/RewardModalPopup/RewardModalPopup';
import { AssetIcon } from '../../components/AssetIcon';
import NftPreview from '../nft/components/NftPreview';

const { ipcRenderer } = window.require('electron');

const { Header, Content, Footer } = Layout;
const { TabPane } = Tabs;
const { Meta } = Card;

const maxNftPreview = 5;

const isWalletNotLive = (config: WalletConfig) => {
  return config.nodeUrl === NOT_KNOWN_YET_VALUE && config.indexingUrl === NOT_KNOWN_YET_VALUE;
};

const HomePage = () => {
  const [currentSession, setCurrentSession] = useRecoilState(sessionState);
  // const [transfers, setTransfers] = useState<TransferTabularData[]>([]);
  // const [nftTransfers, setNftTransfers] = useState<NftTransferTabularData[]>([]);
  const setWalletAsset = useSetRecoilState(walletAssetState);
  const [walletAllAssets, setWalletAllAssets] = useRecoilState(walletAllAssetsState);
  // const isIbcVisible = useRecoilValue(isIbcVisibleState);
  const setNavbarMenuSelectedKey = useSetRecoilState(navbarMenuSelectedKeyState);
  const setNFTList = useSetRecoilState(nftListState);
  const [allMarketData, setAllMarketData] = useRecoilState(allMarketState);
  const [marketData, setMarketData] = useState<AssetMarketPrice>();

  const [fetchingDB, setFetchingDB] = useRecoilState(fetchingDBState);
  const didMountRef = useRef(false);
  const history = useHistory();

  const [processedNftList, setProcessedNftList] = useState<CommonNftModel[]>([]);

  const [hasShownNotLiveWallet, setHasShownNotLiveWallet] = useRecoilState(
    hasShownWarningOnWalletTypeState,
  );

  const [defaultWalletAsset, setDefaultWalletAsset] = useState<UserAsset>();

  const [isRewardModalVisible, setIsRewardModalVisible] = useState(false);
  const [rewards, setRewards] = useState<RewardsBalances>();

  const [assetsLoading, setAssetsLoading] = useState(false);

  const analyticsService = new AnalyticsService(currentSession);

  const [t] = useTranslation();

  const AssetColumns = [
    {
      title: t('home.assetList.table.name'),
      // dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (record: UserAsset) => {
        const { symbol } = record;
        return (
          <div className="name">
            <AssetIcon asset={record} />
            {symbol}
            {record.isWhitelisted === false && (
              <Tooltip title={t('assets.whitelist.warning')}>
                <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginLeft: '6px' }} />
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      title: t('home.assetList.table.chainName'),
      // dataIndex: 'name',
      key: 'chainName',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: record => {
        const { name } = record;

        return (
          <Tag
            style={{ border: 'none', padding: '5px 14px', marginLeft: '10px' }}
            color="processing"
          >
            {getChainName(name, currentSession.wallet.config)}
          </Tag>
        );
      },
    },
    {
      title: t('home.assetList.table.price'),
      // dataIndex: 'price',
      key: 'price',
      render: record => {
        const assetMarketData = allMarketData.get(
          `${record.mainnetSymbol}-${currentSession.currency}`,
        );
        return (
          <>
            {assetMarketData &&
            assetMarketData.price &&
            record.mainnetSymbol === assetMarketData.assetSymbol
              ? `${SUPPORTED_CURRENCY.get(assetMarketData.currency)?.symbol}${numeral(
                  assetMarketData.price,
                ).format('0,0.00')} ${assetMarketData?.currency}`
              : `${SUPPORTED_CURRENCY.get(currentSession.currency)?.symbol}--`}
          </>
        );
      },
    },
    {
      title: t('home.assetList.table.amount'),
      // dataIndex: 'amount',
      key: 'amount',
      render: (record: UserAsset) => {
        return (
          <>
            {getUIDynamicAmount(record.balance, record)} {record.symbol}
          </>
        );
      },
    },
    {
      title: t('home.assetList.table.value'),
      // dataIndex: 'value',
      key: 'value',
      render: record => {
        const assetMarketData = allMarketData.get(
          `${record.mainnetSymbol}-${currentSession.currency}`,
        );
        return (
          <>
            {assetMarketData &&
            assetMarketData.price &&
            record.mainnetSymbol === assetMarketData.assetSymbol
              ? `${SUPPORTED_CURRENCY.get(assetMarketData.currency)?.symbol}${numeral(
                  getAssetBalancePrice(record, assetMarketData),
                ).format('0,0.00')} ${assetMarketData?.currency}`
              : `${SUPPORTED_CURRENCY.get(currentSession.currency)?.symbol}--`}
          </>
        );
      },
    },
  ];

  const showWalletStateNotification = (config: WalletConfig) => {
    setTimeout(async () => {
      if (isWalletNotLive(config) && !hasShownNotLiveWallet) {
        notification.warning({
          message: t('home.notification.walletInfo.message'),
          description: `${t('home.notification.walletInfo.description1')} ${config.name} ${t(
            'home.notification.walletInfo.description2',
          )}`,
          placement: 'topRight',
          duration: 0,
        });
      }
    }, 200);
  };

  const onSyncAndRefreshBtnCall = async () => {
    setFetchingDB(true);

    await walletService.syncAll();
    const sessionData = await walletService.retrieveCurrentSession();
    const allAssets = await walletService.retrieveCurrentWalletAssets(sessionData);

    showWalletStateNotification(sessionData.wallet.config);
    setWalletAllAssets(allAssets);
    setHasShownNotLiveWallet(true);

    await walletService.fetchAndSaveNFTs(sessionData);

    const allPrices = await walletService.retrieveAllAssetsPrices(sessionData.currency);
    setAllMarketData(allPrices);

    setFetchingDB(false);
  };

  function listenToNewVersionUpdates() {
    ipcRenderer.on('update_available', () => {
      ipcRenderer.removeAllListeners('update_available');

      const newVersionNotificationKey = `open-update_available`;

      notification.info({
        message: t('home.notification.updateAvailable.message'),
        description: t('home.notification.updateAvailable.description'),
        duration: 10,
        key: newVersionNotificationKey,
        placement: 'topRight',
      });
    });
  }

  function listenToUpdatesDownloaded() {
    ipcRenderer.on('update_downloaded', () => {
      ipcRenderer.removeAllListeners('update_downloaded');

      const newVersionNotificationKey = `open-update_downloaded`;

      const restartBtn = (
        <Button
          type="primary"
          size="small"
          className="btn-restart"
          onClick={() => {
            ipcRenderer.send('auto_updater_restart_app');
            notification.close(newVersionNotificationKey);
          }}
          style={{ height: '30px', margin: '0px', lineHeight: 1.0 }}
        >
          {t('home.notification.downloadComplete.button')}
        </Button>
      );

      notification.success({
        message: t('home.notification.downloadComplete.message'),
        description: t('home.notification.downloadComplete.description'),
        duration: 20,
        key: newVersionNotificationKey,
        placement: 'topRight',
        btn: restartBtn,
      });
    });
  }

  function getAllAssetsTotalBalance() {
    let totalBalance = Big('0');
    walletAllAssets.forEach(asset => {
      const priceData = allMarketData.get(`${asset.mainnetSymbol}-${currentSession.currency}`);
      if (priceData) {
        const addingBalance = getAssetTotalBalancePrice(asset, priceData);
        totalBalance = totalBalance.add(addingBalance);
      }
    });
    return totalBalance.toFixed(2);
  }

  useEffect(() => {

    const syncAssetData = async () => {
      setAssetsLoading(true);

      const sessionData = await walletService.retrieveCurrentSession();
      const currentAsset = await walletService.retrieveDefaultWalletAsset(sessionData);
      const allAssets = await walletService.retrieveCurrentWalletAssets(sessionData);
      const allNFTs: NftList = await walletService.retrieveNFTs(sessionData.wallet.identifier);
      const allRewards = await walletService.retrieveRewardsBalances(
        currentSession.wallet.identifier,
      );

      const allNftList = await NftUtils.groupAllNftList(allNFTs, maxNftPreview);
      setProcessedNftList(allNftList);

      setNFTList(allNFTs);
      setDefaultWalletAsset(currentAsset);
      setWalletAsset(currentAsset);
      setMarketData(allMarketData.get(`${currentAsset?.mainnetSymbol}-${sessionData.currency}`));

      setRewards(allRewards);

      showWalletStateNotification(sessionData.wallet.config);
      setWalletAllAssets(allAssets);
      setHasShownNotLiveWallet(true);

      // Fetch again balances data
      await walletService.syncBalancesData(sessionData);

      const marketPrices = await walletService.retrieveAllAssetsPrices(sessionData.currency);
      setAllMarketData(marketPrices);

      setAssetsLoading(false);
    };

    syncAssetData();
    listenToNewVersionUpdates();
    listenToUpdatesDownloaded();

    if (!didMountRef.current) {
      didMountRef.current = true;
      analyticsService.logPage('Home');
    }
  }, [fetchingDB]);

  return (
    <Layout className="site-layout">
      <Header className="site-layout-background">
        {t('home.title')}
        <SyncOutlined
          onClick={() => {
            onSyncAndRefreshBtnCall();
          }}
          style={{ position: 'absolute', right: '36px', marginTop: '6px' }}
          spin={fetchingDB}
        />
      </Header>
      <Content>
        <div className="site-layout-background balance-container">
          {/* <div className="balance">
            <div className="title">TOTAL ASSET BALANCE</div>
            <div className="quantity">
              $
              {numeral(
                new Big(getAssetStakingBalancePrice(userAsset, marketData))
                  .add(new Big(getAssetBalancePrice(userAsset, marketData)))
                  .toFixed(4),
              ).format('0,0.00')}{' '}
              USD
            </div>
          </div> */}
          <div className="balance">
            <div className="title">{t('home.balance.title1')}</div>
            <div className="quantity">
              {defaultWalletAsset && marketData && marketData.price
                ? `${SUPPORTED_CURRENCY.get(marketData.currency)?.symbol}${numeral(
                    getAllAssetsTotalBalance(),
                  ).format(`0,0.00`)} ${marketData?.currency}`
                : ''}
            </div>
          </div>
          <div className="balance">
            <div className="title">{t('home.balance.title2')}</div>
            {defaultWalletAsset && (
              <div className="quantity">
                {numeral(scaledStakingBalance(defaultWalletAsset)).format('0,0.0000')}{' '}
                {defaultWalletAsset?.symbol}
              </div>
            )}
            <div className="fiat">
              {defaultWalletAsset && marketData && marketData.price
                ? `${SUPPORTED_CURRENCY.get(marketData.currency)?.symbol}${numeral(
                    getAssetStakingBalancePrice(defaultWalletAsset, marketData),
                  ).format('0,0.00')} ${marketData?.currency}
                  `
                : ''}
            </div>
          </div>
          <div className="balance">
            <div className="title">{t('home.balance.title3')}</div>
            {defaultWalletAsset && (
              <div className="quantity">
                {numeral(
                  scaledAmount(
                    new Big(defaultWalletAsset?.rewardsBalance || '0')
                      .add(rewards?.claimedRewardsBalance || '0')
                      .toFixed(2),
                    defaultWalletAsset.decimals,
                  ),
                ).format('0,0.0000')}{' '}
                {defaultWalletAsset?.symbol}
              </div>
            )}
            <div className="fiat">
              <a
                onClick={() => {
                  setIsRewardModalVisible(true);
                }}
              >
                {t('staking.button.viewMore')}
              </a>
              <RewardModalPopup
                handleOk={() => setIsRewardModalVisible(false)}
                handleCancel={() => setIsRewardModalVisible(false)}
                isModalVisible={isRewardModalVisible}
                walletAsset={defaultWalletAsset}
                marketData={marketData}
                rewards={rewards}
              />
            </div>
          </div>
        </div>
        <Tabs defaultActiveKey="1">
          {/* <TabPane tab={t('home.transactions.tab1')} key="1">
            <Table
              locale={{
                triggerDesc: t('general.table.triggerDesc'),
                triggerAsc: t('general.table.triggerAsc'),
                cancelSort: t('general.table.cancelSort'),
              }}
              columns={TransactionColumns}
              dataSource={transfers}
              rowKey={record => record.key}
            />
          </TabPane> */}
          <TabPane tab={t('home.transactions.tab1')} key="1">
            <div className="site-layout-background asset-container">
              <Table
                columns={AssetColumns}
                dataSource={walletAllAssets}
                rowKey={record => record.identifier}
                className="asset-table"
                pagination={false}
                onRow={selectedAsset => {
                  return {
                    onClick: async () => {
                      setNavbarMenuSelectedKey('/assets');
                      setFetchingDB(true);
                      setCurrentSession({
                        ...currentSession,
                        activeAsset: selectedAsset,
                      });
                      await walletService.setCurrentSession({
                        ...currentSession,
                        activeAsset: selectedAsset,
                      });
                      history.push({
                        pathname: '/assets',
                        state: {
                          from: '/home',
                        },
                      });
                    }, // click row
                  };
                }}
                locale={{
                  triggerDesc: t('general.table.triggerDesc'),
                  triggerAsc: t('general.table.triggerAsc'),
                  cancelSort: t('general.table.cancelSort'),
                }}
              />
              <Link
                to="/assets"
                className="all"
                onClick={() => setNavbarMenuSelectedKey('/assets')}
              >
                {t('general.seeAll')}
              </Link>
            </div>
          </TabPane>
        </Tabs>
        <Tabs>
          <TabPane tab={t('home.nft.tab1')} key="1">
            <div className="site-layout-background nft-container">
              <Spin
                spinning={assetsLoading}
                indicator={<LoadingOutlined style={{ fontSize: 36 }} />}
              >
                <div className="container">
                  <List
                    grid={{
                      gutter: 16,
                      xs: 1,
                      sm: 2,
                      md: 4,
                      lg: 5,
                      xl: 5,
                      xxl: 5,
                    }}
                    dataSource={processedNftList}
                    renderItem={item => {
                      if (isCryptoOrgNftModel(item)) {
                        const { model } = item;
                        return (
                          <List.Item>
                            <Card
                              style={{ width: 170 }}
                              cover={<NftPreview nft={item} />}
                              hoverable
                              className="nft"
                            >
                              <Meta
                                title={NftUtils.renderNftTitle(item)}
                                description={
                                  <>
                                    <Avatar
                                      style={{
                                        background:
                                          'linear-gradient(210.7deg, #1199FA -1.45%, #93D2FD 17.77%, #C1CDFE 35.71%, #EEC9FF 51.45%, #D4A9EA 67.2%, #41B0FF 85.98%)',
                                        verticalAlign: 'middle',
                                      }}
                                    />
                                    {middleEllipsis(model.tokenMinter, 6)}{' '}
                                    {model.isMintedByCDC ? (
                                      <IconTick style={{ height: '12px' }} />
                                    ) : (
                                      ''
                                    )}
                                  </>
                                }
                              />
                            </Card>
                          </List.Item>
                        );
                      }
                      if (isCronosNftModel(item)) {
                        const { model } = item;
                        return (
                          <List.Item>
                            <Card
                              style={{ width: 170 }}
                              cover={<NftPreview nft={item} />}
                              hoverable
                              className="nft"
                            >
                              <Meta
                                title={NftUtils.renderNftTitle(item)}
                                description={
                                  <>
                                    <Avatar
                                      style={{
                                        background:
                                          'linear-gradient(210.7deg, #1199FA -1.45%, #93D2FD 17.77%, #C1CDFE 35.71%, #EEC9FF 51.45%, #D4A9EA 67.2%, #41B0FF 85.98%)',
                                        verticalAlign: 'middle',
                                      }}
                                    />
                                    {middleEllipsis(model.token_address, 6)}{' '}
                                  </>
                                }
                              />
                            </Card>
                          </List.Item>
                        );
                      }

                      return <></>;
                    }}
                    pagination={false}
                  />
                  <Link
                    to="/nft"
                    style={{ position: 'absolute', bottom: '0', right: '0' }}
                    onClick={() => setNavbarMenuSelectedKey('/nft')}
                  >
                    {t('general.seeAll')}
                  </Link>
                </div>
              </Spin>
            </div>
          </TabPane>
        </Tabs>
      </Content>
      <Footer />
    </Layout>
  );
};

export default HomePage;
