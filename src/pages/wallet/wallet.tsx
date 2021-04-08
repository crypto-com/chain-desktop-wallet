// import React, { useState, useEffect } from 'react';
import React, { useState, useEffect, useRef } from 'react';
import { useRecoilValue, useRecoilState } from 'recoil';
import './wallet.less';
import 'antd/dist/antd.css';
import { Layout, Table, Space } from 'antd';
import { sessionState, walletAssetState, walletListState } from '../../recoil/atom';
import { Session } from '../../models/Session';
import { walletService } from '../../service/WalletService';
// import { LEDGER_WALLET_TYPE, createLedgerDevice } from '../../service/LedgerService';

const { Header, Content, Footer } = Layout;

function WalletPage() {
  // const session: Session = useRecoilValue<Session>(sessionState);
  const [session, setSession] = useRecoilState<Session>(sessionState);
  const [userAsset, setUserAsset] = useRecoilState(walletAssetState);
  // const [walletList, setWalletList] = useState([]);
  const walletList = useRecoilValue(walletListState);
  // const [walletList, setWalletList] = useRecoilState(walletListState);
  const [processedWalletList, setProcessedWalletList] = useState([]);
  const didMountRef = useRef(false);

  console.log(session);
  console.log(userAsset);
  console.log(walletList);

  const walletSelect = async e => {
    // setLoading(true);
    await walletService.setCurrentSession(new Session(walletList[e.key]));
    const currentSession = await walletService.retrieveCurrentSession();
    const currentAsset = await walletService.retrieveDefaultWalletAsset(currentSession);
    setSession(currentSession);
    setUserAsset(currentAsset);
    await walletService.syncAll(currentSession);
    // await fetchAndSetNewValidators();
    // setLoading(false);
  };

  // const walletDelete = async e => {
  //   await walletService.deleteWallet(e.identifier);

  //   // Switch to existing default wallet
  //   const allWalletsData = await walletService.retrieveAllWallets();
  //   setWalletList(allWalletsData);
  //   await walletService.setCurrentSession(new Session(walletList[0]));
  //   const currentSession = await walletService.retrieveCurrentSession();
  //   const currentAsset = await walletService.retrieveDefaultWalletAsset(currentSession);
  //   setSession(currentSession);
  //   setUserAsset(currentAsset);
  //   await walletService.syncAll(currentSession);
  // }

  const processWalletList = wallets => {
    const list = wallets.map((wallet, idx) => {
      const walletModel = {
        ...wallet,
        key: `${idx}`,
      };
      return walletModel;
    });
    list.sort((x, y) => {
      if (x.identifier === userAsset.walletId) {
        return -1;
      }
      if (y.identifier === userAsset.walletId) {
        return 1;
      }
      return 0;
    });
    return list;
  };

  useEffect(() => {
    let unmounted = false;

    const syncWalletList = () => {
      if (!unmounted) {
        const wallets = processWalletList(walletList);
        setProcessedWalletList(wallets);
      }
    };

    if (!didMountRef.current) {
      syncWalletList();
      didMountRef.current = true;
    }

    return () => {
      unmounted = true;
    };
  });

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: 'Wallet Type',
      dataIndex: 'walletType',
      key: 'walletType',
      render: walletType => walletType.charAt(0).toUpperCase() + walletType.slice(1),
    },
    {
      title: 'Network',
      key: 'network',
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
              'Selected'
            ) : (
              <a
                onClick={() => {
                  walletSelect(record);
                }}
              >
                Select
              </a>
            )}
            {/* <a
            onClick={() => {
              walletDelete(record);
            }}
          >
            Delete
          </a> */}
          </Space>
        );
      },
    },
  ];

  return (
    <Layout className="site-layout">
      <Header className="site-layout-background">Wallet</Header>
      <div className="header-description">You may review all your wallets here.</div>
      <Content>
        <div className="site-layout-background wallet-content">
          <div className="container">
            <Table dataSource={processedWalletList} columns={columns} />
          </div>
        </div>
      </Content>
      <Footer />
    </Layout>
  );
}

export default WalletPage;
