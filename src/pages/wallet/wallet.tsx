// import React, { useState, useEffect } from 'react';
import React, { useEffect, useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import './wallet.less';
import 'antd/dist/antd.css';
import { Layout, Space, Spin, Table, Typography, Tag } from 'antd';
import Icon, { CheckOutlined, LoadingOutlined } from '@ant-design/icons';
import {
  sessionState,
  walletAssetState,
  walletListState,
  fetchingDBState,
} from '../../recoil/atom';
import { Session } from '../../models/Session';
import { walletService } from '../../service/WalletService';
import { LEDGER_WALLET_TYPE, NORMAL_WALLET_TYPE } from '../../service/LedgerService';
import { DefaultWalletConfigs } from '../../config/StaticConfig';
import IconLedger from '../../svg/IconLedger';

const { Header, Content, Footer } = Layout;
const { Text } = Typography;

enum sortOrder {
  asc = 'ascend',
  desc = 'descend',
}

function WalletPage() {
  const [session, setSession] = useRecoilState<Session>(sessionState);
  const [userAsset, setUserAsset] = useRecoilState(walletAssetState);
  const fetchingDB = useRecoilValue(fetchingDBState);
  const walletList = useRecoilValue(walletListState);
  const [loading, setLoading] = useState(false);
  const [processedWalletList, setProcessedWalletList] = useState([]);

  const processWalletList = wallets => {
    const list = wallets.reduce((resultList, wallet, idx) => {
      const walletModel = {
        ...wallet,
        key: `${idx}`,
      };
      if (wallet.identifier !== session.wallet.identifier) {
        resultList.push(walletModel);
      } else {
        console.log(wallet.name);
      }
      return resultList;
    }, []);

    return list;
  };

  const processNetworkTag = (network, selectedWallet) => {
    let networkColor;

    switch (network) {
      case DefaultWalletConfigs.MainNetConfig.name:
        networkColor = 'success';
        break;
      case DefaultWalletConfigs.TestNetConfig.name:
        networkColor = 'error';
        break;
      default:
        networkColor = 'default';
    }
    return (
      <Tag
        style={{ border: 'none', padding: '5px 14px', fontSize: selectedWallet ? '14px' : '12px' }}
        color={networkColor}
      >
        {network}
      </Tag>
    );
  };

  const walletSelect = async e => {
    setLoading(true);

    await walletService.setCurrentSession(new Session(walletList[e.key]));
    const currentSession = await walletService.retrieveCurrentSession();
    const currentAsset = await walletService.retrieveDefaultWalletAsset(currentSession);
    setSession(currentSession);
    setUserAsset(currentAsset);
    await walletService.syncAll(currentSession);

    setLoading(false);
  };

  useEffect(() => {
    const syncWalletList = () => {
      const wallets = processWalletList(walletList);
      setProcessedWalletList(wallets);
    };

    syncWalletList();
  }, [fetchingDB, userAsset]);

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      children: [
        {
          title: session?.wallet.name,
          dataIndex: 'name',
          sortDirections: [],
          sorter: (a, b) => a.name.localeCompare(b.name),
          defaultSortOrder: sortOrder.asc,
        },
      ],
      defaultSortOrder: sortOrder.asc,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      children: [
        {
          title: session?.wallet.address,
          dataIndex: 'address',
        },
      ],
      render: text => <Text type="success">{text}</Text>,
    },
    {
      title: 'Wallet Type',
      dataIndex: 'walletType',
      key: 'walletType',
      children: [
        {
          // Old wallets (Before Ledger support ) did not have a wallet type property on creation : So they would crash on this level
          title:
            session?.wallet.walletType && session?.wallet.walletType.length > 2 ? (
              <>
                {session?.wallet.walletType.charAt(0).toUpperCase() +
                  session?.wallet.walletType.slice(1)}{' '}
                {session?.wallet.walletType === LEDGER_WALLET_TYPE ? (
                  <Icon component={IconLedger} />
                ) : (
                  ''
                )}
              </>
            ) : (
              NORMAL_WALLET_TYPE
            ),
          dataIndex: 'walletType',
          // Same as title above
          render: walletType =>
            walletType && walletType.length > 2 ? (
              <>
                {walletType.charAt(0).toUpperCase() + walletType.slice(1)}{' '}
                {walletType === LEDGER_WALLET_TYPE ? <Icon component={IconLedger} /> : ''}
              </>
            ) : (
              NORMAL_WALLET_TYPE
            ),
        },
      ],
    },
    {
      title: 'Network',
      key: 'network',
      children: [
        {
          title: processNetworkTag(session?.wallet.config.name, true),
          render: record => {
            return processNetworkTag(record.config.name, false);
          },
        },
      ],
      sorter: (a, b) => a.config.name.localeCompare(b.config.name),
    },
    {
      title: 'Action',
      key: 'action',
      children: [
        {
          title: (
            <CheckOutlined
              style={{
                fontSize: '22px',
                color: '#1199fa',
                position: 'absolute',
                top: '20px',
              }}
            />
          ),
          render: record => {
            return (
              <Space size="middle">
                <a
                  onClick={() => {
                    walletSelect(record);
                  }}
                >
                  Select
                </a>
              </Space>
            );
          },
        },
      ],
    },
  ];

  return (
    <Layout className="site-layout">
      <Header className="site-layout-background">All Wallets</Header>
      <div className="header-description">You may review all your wallets here.</div>
      <Content>
        <div className="site-layout-background wallet-content">
          <div className="container">
            <Table
              dataSource={processedWalletList}
              columns={columns}
              loading={{
                indicator: <Spin indicator={<LoadingOutlined style={{ fontSize: 36 }} spin />} />,
                spinning: loading,
              }}
            />
          </div>
        </div>
      </Content>
      <Footer />
    </Layout>
  );
}

export default WalletPage;
