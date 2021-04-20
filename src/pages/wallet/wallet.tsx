// import React, { useState, useEffect } from 'react';
import React, { useEffect, useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import './wallet.less';
import 'antd/dist/antd.css';
import { Layout, Space, Spin, Table, Typography } from 'antd';
import { CheckOutlined, LoadingOutlined } from '@ant-design/icons';
import {
  sessionState,
  walletAssetState,
  walletListState,
  fetchingDBState,
} from '../../recoil/atom';
import { Session } from '../../models/Session';
import { walletService } from '../../service/WalletService';
import { NORMAL_WALLET_TYPE } from '../../service/LedgerService';

const { Header, Content, Footer } = Layout;
const { Text } = Typography;

function WalletPage() {
  const [session, setSession] = useRecoilState<Session>(sessionState);
  const [userAsset, setUserAsset] = useRecoilState(walletAssetState);
  const fetchingDB = useRecoilValue(fetchingDBState);
  const walletList = useRecoilValue(walletListState);
  const [loading, setLoading] = useState(false);
  const [processedWalletList, setProcessedWalletList] = useState([]);

  const processWalletList = wallets => {
    const list = wallets.map((wallet, idx) => {
      const walletModel = {
        ...wallet,
        key: `${idx}`,
      };
      return walletModel;
    });
    // Move current wallet to the top
    list.sort((x, y) => {
      if (x.identifier === session.wallet.identifier) {
        return -1;
      }
      if (y.identifier === session.wallet.identifier) {
        return 1;
      }
      return 0;
    });
    return list;
  };

  const walletSelect = async e => {
    setLoading(true);

    await walletService.setCurrentSession(new Session(walletList[e.key]));
    const currentSession = await walletService.retrieveCurrentSession();
    const currentAsset = await walletService.retrieveDefaultWalletAsset(currentSession);
    setSession(currentSession);
    setUserAsset(currentAsset);
    await walletService.syncAll(currentSession);

    // Update walletList sorting
    const wallets = processWalletList(walletList);
    setProcessedWalletList(wallets);
    setLoading(false);
  };

  useEffect(() => {
    const syncWalletList = () => {
      const wallets = processWalletList(walletList);
      setProcessedWalletList(wallets);
    };

    syncWalletList();
  }, [fetchingDB]);

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      render: text => <Text type="success">{text}</Text>,
    },
    {
      title: 'Wallet Type',
      dataIndex: 'walletType',
      key: 'walletType',
      // Old wallets (Before Ledger support ) did not have a wallet type property on creation : So they would crash on this level
      render: walletType =>
        walletType && walletType.length > 2
          ? walletType.charAt(0).toUpperCase() + walletType.slice(1)
          : NORMAL_WALLET_TYPE,
    },
    {
      title: 'Network',
      key: 'network',
      sorter: (a, b) => a.config.name.localeCompare(b.config.name),
      render: record => {
        return record.config.name;
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: record => {
        return (
          <Space size="middle">
            {userAsset.walletId === record.identifier ? (
              <CheckOutlined
                style={{
                  fontSize: '18px',
                  color: '#1199fa',
                  position: 'absolute',
                  top: '10px',
                }}
              />
            ) : (
              <a
                onClick={() => {
                  walletSelect(record);
                }}
              >
                Select
              </a>
            )}
          </Space>
        );
      },
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
