import React, { useEffect, useState, useRef } from 'react';
import { Link, useHistory } from 'react-router-dom';
import './home.less';
import 'antd/dist/antd.css';
import { Button, Layout, notification, Table, Tabs, Card, List, Avatar } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import numeral from 'numeral';
import { useTranslation } from 'react-i18next';

import {
  hasShownWarningOnWalletTypeState,
  sessionState,
  marketState,
  walletAllAssetsState,
  nftListState,
  navbarMenuSelectedKeyState,
  fetchingDBState,
} from '../../recoil/atom';
import { NOT_KNOWN_YET_VALUE, WalletConfig } from '../../config/StaticConfig';
import { getUIDynamicAmount } from '../../utils/NumberUtils';
import { middleEllipsis, isJson, ellipsis } from '../../utils/utils';
import {
  scaledBalance,
  scaledStakingBalance,
  getAssetBalancePrice,
  getAssetStakingBalancePrice,
  UserAsset,
} from '../../models/UserAsset';
import { NftModel, NftProcessedModel } from '../../models/Transaction';

import { walletService } from '../../service/WalletService';
import { AnalyticsService } from '../../service/analytics/AnalyticsService';

// import logoCro from '../../assets/AssetLogo/cro.png';
import IconTick from '../../svg/IconTick';
import nftThumbnail from '../../assets/nft-thumbnail.png';

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
  const [walletAllAssets, setWalletAllAssets] = useRecoilState(walletAllAssetsState);
  // const isIbcVisible = useRecoilValue(isIbcVisibleState);
  const setNavbarMenuSelectedKey = useSetRecoilState(navbarMenuSelectedKeyState);
  const setNFTList = useSetRecoilState(nftListState);
  const marketData = useRecoilValue(marketState);
  const [fetchingDB, setFetchingDB] = useRecoilState(fetchingDBState);
  const didMountRef = useRef(false);
  const history = useHistory();

  const [processedNftList, setProcessedNftList] = useState<NftProcessedModel[]>([]);

  const [hasShownNotLiveWallet, setHasShownNotLiveWallet] = useRecoilState(
    hasShownWarningOnWalletTypeState,
  );

  const [defaultWalletAsset, setdefaultWalletAsset] = useState<UserAsset>();

  const analyticsService = new AnalyticsService(currentSession);

  const [t] = useTranslation();

  const assetIcon = asset => {
    const { icon_url, symbol } = asset;

    return icon_url ? (
      <img src={icon_url} alt="cronos" className="asset-icon" />
    ) : (
      <Avatar>{symbol[0].toUpperCase()}</Avatar>
    );
  };

  const AssetColumns = [
    {
      title: t('home.assetList.table.name'),
      // dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: record => {
        const { name, symbol } = record;
        return (
          <div className="name">
            {assetIcon(record)}
            {name} ({symbol})
          </div>
        );
      },
    },
    {
      title: t('home.assetList.table.price'),
      // dataIndex: 'price',
      key: 'price',
      render: record => (
        <>
          {marketData && marketData.price && record.mainnetSymbol === marketData.assetSymbol
            ? `${numeral(marketData.price).format('$0,0.00')} ${marketData?.currency}`
            : '$--'}
        </>
      ),
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
        return (
          <>
            {marketData && marketData.price && record.mainnetSymbol === marketData.assetSymbol
              ? `${numeral(getAssetBalancePrice(record, marketData)).format('$0,0.00')} ${
                  marketData?.currency
                }`
              : '$--'}
          </>
        );
      },
    },
  ];

  const renderPreview = (_nft: NftProcessedModel) => {
    return (
      <img
        alt={_nft?.denomName}
        src={_nft?.tokenData.image ? _nft?.tokenData.image : nftThumbnail}
        onError={e => {
          (e.target as HTMLImageElement).src = nftThumbnail;
        }}
      />
    );
  };

  const renderNftTitle = (_nft: NftProcessedModel | undefined, length: number = 999) => {
    if (_nft?.tokenData && _nft?.tokenData.name) {
      return ellipsis(_nft?.tokenData.name, length);
    }
    if (_nft?.tokenData && _nft?.tokenData.drop) {
      return ellipsis(_nft?.tokenData.drop, length);
    }
    if (_nft) {
      return ellipsis(`${_nft?.denomId} - #${_nft?.tokenId}`, length);
    }
    return 'n.a.';
  };

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
    await walletService.IBCAssetsFetch(sessionData);
    showWalletStateNotification(currentSession.wallet.config);
    setWalletAllAssets(allAssets);
    setHasShownNotLiveWallet(true);

    await walletService.fetchAndSaveNFTs(sessionData);
    setFetchingDB(false);
  };

  const processNftList = (currentList: NftModel[] | undefined) => {
    if (currentList) {
      return currentList.slice(0, maxNftPreview).map(item => {
        const denomSchema = isJson(item.denomSchema)
          ? JSON.parse(item.denomSchema)
          : item.denomSchema;
        const tokenData = isJson(item.tokenData) ? JSON.parse(item.tokenData) : item.tokenData;
        const nftModel: NftProcessedModel = {
          ...item,
          denomSchema,
          tokenData,
        };
        return nftModel;
      });
    }
    return [];
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
            ipcRenderer.send('restart_app');
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

  useEffect(() => {
    const syncAssetData = async () => {
      const sessionData = await walletService.retrieveCurrentSession();
      const currentAsset = await walletService.retrieveDefaultWalletAsset(sessionData);
      const allAssets = await walletService.retrieveCurrentWalletAssets(sessionData);
      await walletService.IBCAssetsFetch(sessionData);

      const allNFTs: NftModel[] = await walletService.retrieveNFTs(sessionData.wallet.identifier);
      const currentNftList = processNftList(allNFTs);
      setProcessedNftList(currentNftList);
      setNFTList(allNFTs);

      setdefaultWalletAsset(currentAsset);
      showWalletStateNotification(currentSession.wallet.config);
      setWalletAllAssets(allAssets);
      setHasShownNotLiveWallet(true);
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
            <div className="title">CRO BALANCE</div>
            {defaultWalletAsset && (
              <div className="quantity">
                {numeral(scaledBalance(defaultWalletAsset)).format('0,0.0000')}{' '}
                {defaultWalletAsset?.symbol}
              </div>
            )}
            <div className="fiat">
              {defaultWalletAsset && marketData && marketData.price
                ? `${numeral(getAssetBalancePrice(defaultWalletAsset, marketData)).format(
                    '$0,0.00',
                  )} ${marketData?.currency}`
                : ''}
            </div>
          </div>
          <div className="balance">
            <div className="title">STAKED CRO BALANCE</div>
            {defaultWalletAsset && (
              <div className="quantity">
                {numeral(scaledStakingBalance(defaultWalletAsset)).format('0,0.0000')}{' '}
                {defaultWalletAsset?.symbol}
              </div>
            )}
            <div className="fiat">
              {defaultWalletAsset && marketData && marketData.price
                ? `${numeral(getAssetStakingBalancePrice(defaultWalletAsset, marketData)).format(
                    '$0,0.00',
                  )} ${marketData?.currency}
                  `
                : ''}
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
                      setNavbarMenuSelectedKey('/send');
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
                        pathname: '/send',
                        state: {
                          from: '/home',
                        },
                      });
                    }, // click row
                  };
                }}
              />
              <Link to="/send" className="all" onClick={() => setNavbarMenuSelectedKey('/send')}>
                {t('general.seeAll')}
              </Link>
            </div>
          </TabPane>
          <TabPane tab={t('home.nft.tab1')} key="2">
            <div className="site-layout-background nft-container">
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
                renderItem={item => (
                  <List.Item>
                    <Card
                      style={{ width: 170 }}
                      cover={renderPreview(item)}
                      hoverable
                      className="nft"
                    >
                      <Meta
                        title={renderNftTitle(item)}
                        description={
                          <>
                            <Avatar
                              style={{
                                background:
                                  'linear-gradient(210.7deg, #1199FA -1.45%, #93D2FD 17.77%, #C1CDFE 35.71%, #EEC9FF 51.45%, #D4A9EA 67.2%, #41B0FF 85.98%)',
                                verticalAlign: 'middle',
                              }}
                            />
                            {middleEllipsis(item?.tokenMinter, 6)}{' '}
                            {item?.isMintedByCDC ? <IconTick style={{ height: '12px' }} /> : ''}
                          </>
                        }
                      />
                    </Card>
                  </List.Item>
                )}
                pagination={false}
              />
              <Link
                to="/nft"
                style={{ textAlign: 'right' }}
                onClick={() => setNavbarMenuSelectedKey('/nft')}
              >
                {t('general.seeAll')}
              </Link>
            </div>
          </TabPane>
        </Tabs>
      </Content>
      <Footer />
    </Layout>
  );
};

export default HomePage;
