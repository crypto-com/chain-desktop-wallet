import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import numeral from 'numeral';
import { useTranslation } from 'react-i18next';
import './assets.less';
import 'antd/dist/antd.css';
import { Layout, Table, Avatar, Tabs, Tag, Typography, Dropdown, Menu } from 'antd';
import {
  // Icon,
  ArrowLeftOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import {
  sessionState,
  marketState,
  // walletAssetState,
  walletAllAssetsState,
  navbarMenuSelectedKeyState,
  fetchingDBState,
} from '../../recoil/atom';
import { Session } from '../../models/Session';
import { getAssetBalancePrice, UserAsset } from '../../models/UserAsset';
import { getUIDynamicAmount } from '../../utils/NumberUtils';
// import { LEDGER_WALLET_TYPE, createLedgerDevice } from '../../service/LedgerService';
import { AnalyticsService } from '../../service/analytics/AnalyticsService';
// import logoCro from '../../assets/AssetLogo/cro.png';
import ReceiveDetail from './components/ReceiveDetail';
import FormSend from './components/FormSend';
import { walletService } from '../../service/WalletService';
import { middleEllipsis } from '../../utils/utils';
import {
  TransactionDirection,
  TransactionStatus,
  TransferTransactionData,
} from '../../models/Transaction';
// import IconSend from '../../svg/IconSend';
// import IconReceive from '../../svg/IconReceive';

const { Header, Content, Footer } = Layout;
const { TabPane } = Tabs;
const { Text } = Typography;

interface TransferTabularData {
  key: string;
  transactionHash: string;
  recipientAddress: string;
  amount: string;
  time: string;
  direction: TransactionDirection;
  status: TransactionStatus;
}

const convertTransfers = (
  allTransfers: TransferTransactionData[],
  allAssets: UserAsset[],
  sessionData: Session,
  defaultWalletAsset: UserAsset,
) => {
  const { address } = sessionData.wallet;

  function getDirection(from: string, to: string): TransactionDirection {
    if (address === from && address === to) {
      return TransactionDirection.SELF;
    }
    if (address === from) {
      return TransactionDirection.OUTGOING;
    }
    return TransactionDirection.INCOMING;
  }

  return allTransfers.map(transfer => {
    const transferAmount = getUIDynamicAmount(transfer.amount, defaultWalletAsset);
    const data: TransferTabularData = {
      key: transfer.hash + transfer.receiverAddress + transfer.amount,
      recipientAddress: transfer.receiverAddress,
      transactionHash: transfer.hash,
      time: new Date(transfer.date).toLocaleString(),
      amount: `${transferAmount} ${transfer.assetSymbol}`,
      direction: getDirection(transfer.senderAddress, transfer.receiverAddress),
      status: transfer.status,
    };
    return data;
  });
};

const AssetsPage = () => {
  const [session, setSession] = useRecoilState<Session>(sessionState);
  // const userAsset = useRecoilValue(walletAssetState);
  const walletAllAssets = useRecoilValue(walletAllAssetsState);
  const marketData = useRecoilValue(marketState);
  const [navbarMenuSelectedKey, setNavbarMenuSelectedKey] = useRecoilState(
    navbarMenuSelectedKeyState,
  );
  const setFetchingDB = useSetRecoilState(fetchingDBState);

  // const [isLedger, setIsLedger] = useState(false);
  const [currentAsset, setCurrentAsset] = useState<UserAsset | undefined>(session.activeAsset);
  const [isAssetVisible, setIsAssetVisible] = useState(false);
  const [activeAssetTab, setActiveAssetTab] = useState('1');
  const [allTransfer, setAllTransfer] = useState<any>();

  // const [defaultWalletAsset, setdefaultWalletAsset] = useState<UserAsset>();
  const didMountRef = useRef(false);
  const analyticsService = new AnalyticsService(session);

  const [t] = useTranslation();

  const locationState: any = useLocation().state ?? {
    from: '',
    identifier: '',
  };

  const getDefaultAssetTab = (_locationState, _navbarMenuSelectedKey) => {
    if (_locationState.from === '/home' && session.activeAsset) {
      return '1';
    }
    if (_navbarMenuSelectedKey === '/send') {
      return '2';
    }
    return '3';
  };

  useEffect(() => {
    const checkDirectedFrom = async () => {
      if (locationState.from === '/home' && session.activeAsset) {
        const transfers = await walletService.retrieveAllTransfers(
          session.wallet.identifier,
          session.activeAsset,
        );
        setAllTransfer(convertTransfers(transfers, walletAllAssets, session, session.activeAsset));
        setCurrentAsset(session.activeAsset);
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

  const assetIcon = asset => {
    const { icon_url, symbol } = asset;

    return icon_url ? (
      <img src={icon_url} alt="cronos" className="asset-icon" />
    ) : (
      <Avatar>{symbol[0].toUpperCase()}</Avatar>
    );
  };

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
      title: t('assets.assetList.table.price'),
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
      render: record => (
        <>
          {marketData && marketData.price && record.mainnetSymbol === marketData.assetSymbol
            ? `${numeral(getAssetBalancePrice(record, marketData)).format('$0,0.00')} ${
                marketData?.currency
              }`
            : '$--'}
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
          href={`${session.wallet.config.explorerUrl}/tx/${text}`}
        >
          {middleEllipsis(text, 12)}
        </a>
      ),
    },
    {
      title: t('home.transactions.table1.amount'),
      dataIndex: 'amount',
      key: 'amount',
      render: (text, record: TransferTabularData) => {
        const color = record.direction === TransactionDirection.OUTGOING ? 'danger' : 'success';
        const sign = record.direction === TransactionDirection.OUTGOING ? '-' : '+';
        return (
          <Text type={color}>
            {sign}
            {text}
          </Text>
        );
      },
    },
    {
      title: t('home.transactions.table1.recipientAddress'),
      dataIndex: 'recipientAddress',
      key: 'recipientAddress',
      render: text => (
        <a
          data-original={text}
          target="_blank"
          rel="noreferrer"
          href={`${session.wallet.config.explorerUrl}/account/${text}`}
        >
          {middleEllipsis(text, 12)}
        </a>
      ),
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
      render: (text, record: TransferTabularData) => {
        // const color = record.direction === TransactionDirection.OUTGOING ? 'danger' : 'success';
        // const sign = record.direction === TransactionDirection.OUTGOING ? '-' : '+';
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
                    {assetIcon(currentAsset)}
                    <div className="balance">
                      {getUIDynamicAmount(currentAsset!.balance, currentAsset!)}{' '}
                      {currentAsset?.symbol}
                    </div>
                    <div className="value">
                      {marketData &&
                      marketData.price &&
                      currentAsset?.mainnetSymbol === marketData.assetSymbol
                        ? `${numeral(getAssetBalancePrice(currentAsset, marketData)).format(
                            '$0,0.00',
                          )} ${marketData?.currency}`
                        : '$--'}
                    </div>
                  </div>

                  <Tabs
                    defaultActiveKey={getDefaultAssetTab(locationState, navbarMenuSelectedKey)}
                    activeKey={activeAssetTab}
                    onTabClick={key => {
                      setActiveAssetTab(key);
                      if (key === '2') {
                        setNavbarMenuSelectedKey('/send');
                      }
                      if (key === '3') {
                        setNavbarMenuSelectedKey('/receive');
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
                    //       {/* {props.panes.map((tab) => {
                    //       return <div onClick={() => setActiveAssetTab(tab.key)}>
                    //         {tab.key === '2'
                    //           ? <>
                    //             <Icon className="tab" component={IconSend} />
                    //             {tab.props.tab}
                    //           </>
                    //           : <>
                    //             <Icon className="tab" component={IconReceive} />
                    //             {tab.props.tab}
                    //           </>}
                    //       </div>
                    //     })} */}
                    //     </div>
                    //   );
                    // }}
                  >
                    <TabPane tab={t('assets.tab1')} key="1">
                      <Table
                        columns={TransactionColumns}
                        dataSource={allTransfer}
                        className="transfer-table"
                        rowKey={record => record.key}
                      />
                    </TabPane>
                    <TabPane tab={t('assets.tab2')} key="2">
                      <FormSend
                        walletAsset={currentAsset}
                        setWalletAsset={setCurrentAsset}
                        currentSession={session}
                      />
                    </TabPane>

                    <TabPane tab={t('assets.tab3')} key="3">
                      <ReceiveDetail currentAsset={currentAsset} session={session} />
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
                      setSession({
                        ...session,
                        activeAsset: selectedAsset,
                      });
                      await walletService.setCurrentSession({
                        ...session,
                        activeAsset: selectedAsset,
                      });
                      const transfers = await walletService.retrieveAllTransfers(
                        session.wallet.identifier,
                        selectedAsset,
                      );
                      setAllTransfer(
                        convertTransfers(transfers, walletAllAssets, session, selectedAsset!),
                      );
                      setCurrentAsset(selectedAsset);
                      setIsAssetVisible(true);
                    }, // click row
                  };
                }}
                // pagination={false}
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
