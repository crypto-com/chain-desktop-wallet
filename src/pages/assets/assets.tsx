import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import moment from 'moment';
import numeral from 'numeral';
import { useTranslation } from 'react-i18next';
import './assets.less';
import 'antd/dist/antd.css';
import { BaseType } from 'antd/lib/typography/Base';
import { Layout, Table, Tabs, Tag, Typography, Dropdown, Menu, Tooltip, Alert, Spin } from 'antd';
import {
  ArrowLeftOutlined,
  ExclamationCircleOutlined,
  MoreOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import {
  sessionState,
  allMarketState,
  walletAllAssetsState,
  navbarMenuSelectedKeyState,
  fetchingDBState,
  fetchingComponentState,
} from '../../recoil/atom';
import { Session } from '../../models/Session';
import {
  AssetMarketPrice,
  getAssetBalancePrice,
  UserAsset,
  UserAssetType,
} from '../../models/UserAsset';
import { renderExplorerUrl } from '../../models/Explorer';
import { SUPPORTED_CURRENCY } from '../../config/StaticConfig';
import { getUIDynamicAmount } from '../../utils/NumberUtils';
// import { LEDGER_WALLET_TYPE, createLedgerDevice } from '../../service/LedgerService';
import { AnalyticsService } from '../../service/analytics/AnalyticsService';
// import logoCro from '../../assets/AssetLogo/cro.png';
import ReceiveDetail from './components/ReceiveDetail';
import TransactionDetail from './components/TransactionDetail';
import TagMsgType from './components/TagMsgType';
import FormSend from './components/FormSend';
import { walletService } from '../../service/WalletService';
import { getChainName, middleEllipsis } from '../../utils/utils';
import { TransactionDirection, TransactionStatus } from '../../models/Transaction';
import { AssetIcon } from '../../components/AssetIcon';
import AssetTypeTooltip from './components/AssetTypeTooltip';

const { Sider, Header, Content, Footer } = Layout;
const { TabPane } = Tabs;
const { Text } = Typography;

export interface TransactionTabularData {
  key: string;
  assetType: UserAssetType;
  transactionHash: string;
  time: string;
  msgTypeName: string;
  direction: TransactionDirection;
  status: TransactionStatus;
  amount?: string;
  stakedAmount?: string;
  senderAddress?: string;
  recipientAddress?: string;
  validatorAddress?: string;
  delegatorAddress?: string;
  autoClaimedRewards?: string;
}

const convertTransactions = (
  allTransactions: any[],
  allAssets: UserAsset[],
  sessionData: Session,
  asset: UserAsset,
) => {
  const address = asset.address?.toLowerCase() || sessionData.wallet.address.toLowerCase();
  function getDirection(from: string = '', to: string = ''): TransactionDirection {
    if (address === from.toLowerCase() && address === to.toLowerCase()) {
      return TransactionDirection.SELF;
    }
    if (address === to.toLowerCase()) {
      return TransactionDirection.INCOMING;
    }
    if (address === from.toLowerCase()) {
      return TransactionDirection.OUTGOING;
    }

    return TransactionDirection.SELF;
  }

  return allTransactions.map(transaction => {
    const { txData } = transaction;

    const data: TransactionTabularData = {
      key: txData.hash + txData.receiverAddress + txData.amount,
      assetType: asset.assetType ?? UserAssetType.TENDERMINT,
      senderAddress: txData.senderAddress,
      recipientAddress: txData.receiverAddress,
      validatorAddress: txData.validatorAddress,
      delegatorAddress: txData.delegatorAddress,
      transactionHash: txData.hash,
      time: `${moment(new Date(txData.date)).format('YYYY-MM-DD, HH:mm:ss Z')}`,
      amount: `${getUIDynamicAmount(txData.amount, asset)} ${txData.assetSymbol}`,
      stakedAmount: `${getUIDynamicAmount(txData.stakedAmount, asset)} ${txData.assetSymbol}`,
      autoClaimedRewards: `${getUIDynamicAmount(txData.autoClaimedRewards, asset)} ${
        txData.assetSymbol
      }`,
      msgTypeName: transaction.messageTypeName,
      direction: getDirection(txData.senderAddress, txData.receiverAddress),
      status: txData.status,
    };
    return data;
  });
};

const AssetsPage = () => {
  const [session, setSession] = useRecoilState<Session>(sessionState);
  const [walletAllAssets, setWalletAllAssets] = useRecoilState(walletAllAssetsState);
  const allMarketData = useRecoilValue(allMarketState);
  const setNavbarMenuSelectedKey = useSetRecoilState(navbarMenuSelectedKeyState);
  const setFetchingDB = useSetRecoilState(fetchingDBState);
  const [fetchingComoponent, setFetchingComponent] = useRecoilState(fetchingComponentState);

  // const [isLedger, setIsLedger] = useState(false);
  const [currentAsset, setCurrentAsset] = useState<UserAsset | undefined>(session.activeAsset);
  const [currentAssetMarketData, setCurrentAssetMarketData] = useState<AssetMarketPrice>();
  const [isAssetVisible, setIsAssetVisible] = useState(false);
  const [activeAssetTab, setActiveAssetTab] = useState('transaction');
  const [allTransactions, setAllTransactions] = useState<any>();

  const didMountRef = useRef(false);
  const analyticsService = new AnalyticsService(session);

  const [t] = useTranslation();
  const locationState: any = useLocation().state ?? {
    from: '',
    identifier: '',
  };

  const syncTransactions = async asset => {
    setFetchingComponent(true);
    const transactions = await walletService.syncTransactionRecordsByAsset(session, asset);
    setAllTransactions(convertTransactions(transactions, walletAllAssets, session, asset));
    setFetchingComponent(false);
  };

  const syncAssetBalance = async asset => {
    const allAssets = await walletService.retrieveCurrentWalletAssets(session);
    setWalletAllAssets(allAssets);
    allAssets.forEach(item => {
      if (asset.identifier === item.identifier) {
        setCurrentAsset(item);
      }
    });
  };

  useEffect(() => {
    const checkDirectedFrom = async () => {
      if (locationState.from === '/home' && session.activeAsset) {
        syncTransactions(session.activeAsset);
        setCurrentAsset(session.activeAsset);
        setCurrentAssetMarketData(
          allMarketData.get(`${session.activeAsset.mainnetSymbol}-${session.currency}`),
        );
        setIsAssetVisible(true);
        setFetchingDB(false);
      }
    };

    if (!didMountRef.current) {
      checkDirectedFrom();
      didMountRef.current = true;
      analyticsService.logPage('Assets');
    }
  });

  const moreMenu = (
    <Menu className="moreDropdown">
      <Menu.Item key="node-configuration">
        <Link
          to={{
            pathname: '/settings',
          }}
          onClick={() => setNavbarMenuSelectedKey('/settings')}
        >
          {t('assets.moreMenu.nodeConfiguration')}
        </Link>
      </Menu.Item>
    </Menu>
  );

  const AssetColumns = [
    {
      title: t('assets.assetList.table.name'),
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
      title: t('assets.assetList.table.chainName'),
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
            {getChainName(name, session.wallet.config)}
          </Tag>
        );
      },
    },
    {
      title: t('assets.assetList.table.price'),
      // dataIndex: 'price',
      key: 'price',
      render: record => {
        const assetMarketData = allMarketData.get(`${record.mainnetSymbol}-${session.currency}`);
        return (
          <>
            {assetMarketData &&
            assetMarketData.price &&
            record.mainnetSymbol === assetMarketData.assetSymbol
              ? `${SUPPORTED_CURRENCY.get(assetMarketData.currency)?.symbol}${numeral(
                  assetMarketData.price,
                ).format('0,0.00')} ${assetMarketData.currency}`
              : `${SUPPORTED_CURRENCY.get(session.currency)?.symbol}--`}
          </>
        );
      },
    },
    {
      title: t('assets.assetList.table.amount'),
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
      title: t('assets.assetList.table.value'),
      // dataIndex: 'value',
      key: 'value',
      render: record => {
        const assetMarketData = allMarketData.get(`${record.mainnetSymbol}-${session.currency}`);
        return (
          <>
            {assetMarketData &&
            assetMarketData.price &&
            record.mainnetSymbol === assetMarketData.assetSymbol
              ? `${SUPPORTED_CURRENCY.get(assetMarketData.currency)?.symbol}${numeral(
                  getAssetBalancePrice(record, assetMarketData),
                ).format('0,0.00')} ${assetMarketData?.currency}`
              : `${SUPPORTED_CURRENCY.get(session.currency)?.symbol}--`}
          </>
        );
      },
    },
    {
      title: t('general.action'),
      dataIndex: 'action',
      key: 'action',
      render: () => (
        <>
          <a
            onClick={() => {
              setTimeout(() => {
                setActiveAssetTab('send');
              }, 50);
            }}
          >
            {t('assets.assetList.table.actionSend')}
          </a>

          <a
            style={{ marginLeft: '20px' }}
            onClick={() => {
              setTimeout(() => {
                setActiveAssetTab('receive');
              }, 50);
            }}
          >
            {t('assets.assetList.table.actionReceive')}
          </a>
        </>
      ),
    },
  ];

  const TransactionColumns = [
    {
      title: t('home.transactions.table1.transactionHash'),
      dataIndex: 'transactionHash',
      key: 'transactionHash',
      render: text => (
        <a
          data-original={text}
          target="_blank"
          rel="noreferrer"
          href={`${renderExplorerUrl(
            session.activeAsset?.config ?? session.wallet.config,
            'tx',
          )}/${text}`}
        >
          {middleEllipsis(text, 6)}
        </a>
      ),
    },
    ...(currentAsset?.assetType === UserAssetType.TENDERMINT ||
    currentAsset?.assetType === UserAssetType.IBC
      ? [
          {
            title: t('home.transactions.table1.msgTypeName'),
            dataIndex: 'msgTypeName',
            key: 'msgTypeName',
            render: text => {
              return <TagMsgType msgTypeName={text} />;
            },
          },
        ]
      : []),
    {
      title: t('home.transactions.table1.amount'),
      // dataIndex: 'amount',
      key: 'amount',
      render: (record: TransactionTabularData) => {
        let color: BaseType = 'secondary';
        let sign = '';
        switch (record.direction) {
          case TransactionDirection.OUTGOING:
            color = 'danger';
            sign = '-';
            break;
          case TransactionDirection.INCOMING:
            color = 'success';
            sign = '+';
            break;
          case TransactionDirection.SELF:
            color = 'secondary';
            break;
          default:
            break;
        }
        const text =
          record.msgTypeName === 'MsgDelegate' || record.msgTypeName === 'MsgUndelegate'
            ? record.stakedAmount
            : record.amount;
        return (
          <Text type={color}>
            {sign}
            {text}
          </Text>
        );
      },
    },
    {
      title: t('home.transactions.table1.time'),
      dataIndex: 'time',
      key: 'time',
    },
    {
      title: t('home.transactions.table1.status'),
      dataIndex: 'status',
      key: 'status',
      render: (text, record: TransactionTabularData) => {
        let statusColor;
        if (record.status === TransactionStatus.SUCCESS) {
          statusColor = 'success';
        } else if (record.status === TransactionStatus.FAILED) {
          statusColor = 'error';
        } else {
          statusColor = 'processing';
        }

        return (
          <Tag style={{ border: 'none', padding: '5px 14px' }} color={statusColor}>
            {record.status.toString()}
          </Tag>
        );
      },
    },
  ];

  return (
    <Layout className="site-layout">
      <Header className="site-layout-background">{t('assets.title')}</Header>
      <div className="header-description">{t('assets.description')}</div>
      <Content>
        <div className="site-layout-background assets-content">
          <div className="container">
            {isAssetVisible ? (
              <Layout className="asset-detail">
                <Content>
                  <div className="detail-header">
                    <a>
                      <div
                        className="back-button"
                        onClick={() => setIsAssetVisible(false)}
                        style={{ fontSize: '16px' }}
                      >
                        <ArrowLeftOutlined style={{ fontSize: '16px', color: '#1199fa' }} />{' '}
                        {t('assets.backToList')}
                      </div>
                    </a>

                    <Dropdown overlay={moreMenu} placement="bottomRight" trigger={['click']}>
                      <MoreOutlined />
                    </Dropdown>
                  </div>
                  <div className="detail-container">
                    <Layout>
                      <Sider width="80px">
                        {currentAsset && <AssetIcon asset={currentAsset} />}
                      </Sider>
                      <Content>
                        <div className="balance">
                          {getUIDynamicAmount(currentAsset!.balance, currentAsset!)}{' '}
                          {currentAsset?.symbol}
                          <Tag
                            style={{ border: 'none', padding: '5px 14px', marginLeft: '10px' }}
                            color="processing"
                          >
                            {getChainName(currentAsset?.name, session.wallet.config)}
                          </Tag>
                        </div>
                        <div className="value">
                          {currentAssetMarketData &&
                          currentAssetMarketData.price &&
                          currentAsset?.mainnetSymbol === currentAssetMarketData.assetSymbol
                            ? `${
                                SUPPORTED_CURRENCY.get(currentAssetMarketData.currency)?.symbol
                              }${numeral(
                                getAssetBalancePrice(currentAsset, currentAssetMarketData),
                              ).format('0,0.00')} ${currentAssetMarketData?.currency}`
                            : `${SUPPORTED_CURRENCY.get(session.currency)?.symbol}--`}
                        </div>
                      </Content>
                    </Layout>
                    <AssetTypeTooltip currentAsset={currentAsset} currentSession={session} />

                    {currentAsset?.isWhitelisted === false && (
                      <Alert
                        message={t('assets.whitelist.warning')}
                        type="error"
                        showIcon
                        icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
                      />
                    )}
                  </div>
                  <Tabs
                    activeKey={activeAssetTab}
                    onTabClick={key => {
                      setActiveAssetTab(key);
                      if (key === 'transaction') {
                        syncTransactions(currentAsset);
                        syncAssetBalance(currentAsset);
                        setNavbarMenuSelectedKey('/assets');
                      }
                    }}
                    centered
                    // renderTabBar={() => {
                    //   // renderTabBar={(props) => {
                    //   return (
                    //     <div className="tab-container">
                    //       <div onClick={() => setActiveAssetTab('2')}>
                    //         <>
                    //           <Icon
                    //             className={`tab ${activeAssetTab === '2' ? 'active' : ''}`}
                    //             component={IconSend}
                    //           />
                    //           {t('navbar.send')}
                    //         </>
                    //       </div>
                    //       <div onClick={() => setActiveAssetTab('3')}>
                    //         <>
                    //           <Icon
                    //             className={`tab ${activeAssetTab === '3' ? 'active' : ''}`}
                    //             component={IconReceive}
                    //           />
                    //           {t('navbar.receive')}
                    //         </>
                    //       </div>
                    //     </div>
                    //   );
                    // }}
                  >
                    <TabPane tab={t('assets.tab2')} key="send">
                      <FormSend
                        walletAsset={currentAsset}
                        setWalletAsset={setCurrentAsset}
                        currentSession={session}
                      />
                    </TabPane>
                    <TabPane tab={t('assets.tab3')} key="receive">
                      <ReceiveDetail currentAsset={currentAsset} session={session} />
                    </TabPane>
                    <TabPane tab={t('assets.tab1')} key="transaction">
                      <Table
                        columns={TransactionColumns}
                        dataSource={allTransactions}
                        className="transaction-table"
                        rowKey={record => record.key}
                        locale={{
                          triggerDesc: t('general.table.triggerDesc'),
                          triggerAsc: t('general.table.triggerAsc'),
                          cancelSort: t('general.table.cancelSort'),
                        }}
                        loading={{
                          indicator: (
                            <Spin indicator={<LoadingOutlined style={{ fontSize: 36 }} spin />} />
                          ),
                          spinning: fetchingComoponent,
                        }}
                        expandable={{
                          expandedRowRender: record => (
                            <TransactionDetail transaction={record} session={session} />
                          ),
                        }}
                      />
                    </TabPane>
                  </Tabs>
                </Content>
              </Layout>
            ) : (
              <Table
                columns={AssetColumns}
                dataSource={walletAllAssets}
                className="asset-table"
                rowKey={record => record.identifier}
                onRow={selectedAsset => {
                  return {
                    onClick: async () => {
                      setActiveAssetTab('transaction');
                      setSession({
                        ...session,
                        activeAsset: selectedAsset,
                      });
                      await walletService.setCurrentSession({
                        ...session,
                        activeAsset: selectedAsset,
                      });
                      syncTransactions(selectedAsset);
                      setCurrentAsset(selectedAsset);
                      setCurrentAssetMarketData(
                        allMarketData.get(`${selectedAsset.mainnetSymbol}-${session.currency}`),
                      );
                      setIsAssetVisible(true);
                    }, // click row
                  };
                }}
                locale={{
                  triggerDesc: t('general.table.triggerDesc'),
                  triggerAsc: t('general.table.triggerAsc'),
                  cancelSort: t('general.table.cancelSort'),
                }}
              />
            )}
          </div>
        </div>
      </Content>
      <Footer />
    </Layout>
  );
};

export default AssetsPage;
