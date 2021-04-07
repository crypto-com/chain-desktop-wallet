// import React, { useState, useEffect } from 'react';
import React, { useState, useEffect, useRef } from 'react';
import { useRecoilValue, useRecoilState } from 'recoil';
import './wallet.less';
import 'antd/dist/antd.css';
import { Layout, Table } from 'antd';
import { sessionState, walletAssetState, walletListState } from '../../recoil/atom';
import { Session } from '../../models/Session';
import { walletService } from '../../service/WalletService';
// import { LEDGER_WALLET_TYPE, createLedgerDevice } from '../../service/LedgerService';

const { Header, Content, Footer } = Layout;

function WalletPage() {
  // const session: Session = useRecoilValue<Session>(sessionState);
  const [session, setSession] = useRecoilState<Session>(sessionState);
  const [userAsset, setUserAsset] = useRecoilState(walletAssetState);
  const [walletList, setWalletList] = useState([]);
  const allWalletsData = useRecoilValue(walletListState);
  const didMountRef = useRef(false);

  console.log(session);
  console.log(userAsset);
  console.log(allWalletsData);

  const walletSelect = async e => {
    // setLoading(true);
    console.log(e);
    await walletService.setCurrentSession(new Session(walletList[e.key]));
    const currentSession = await walletService.retrieveCurrentSession();
    const currentAsset = await walletService.retrieveDefaultWalletAsset(currentSession);
    setSession(currentSession);
    setUserAsset(currentAsset);
    await walletService.syncAll(currentSession);
    // await fetchAndSetNewValidators();
    // setLoading(false);
  };

  const processWalletList = wallets => {
    return wallets.map((wallet, idx) => {
      const walletModel = {
        ...wallet,
        key: `${idx}`,
      };
      return walletModel;
    });
  };

  useEffect(() => {
    let unmounted = false;

    const syncWalletList = () => {
      if (!unmounted) {
        const wallets = processWalletList(allWalletsData);
        setWalletList(wallets);
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
    // {
    //   title: 'No.',
    //   dataIndex: 'key',
    //   key: 'key',
    //   render: key => (key.parseInt+1)
    // },
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
      title: 'Network',
      // dataIndex: 'walletType',
      key: 'network',
      render: record => {
        return record.config.name;
      },
    },
    {
      title: 'Type',
      dataIndex: 'walletType',
      key: 'walletType',
    },
    {
      title: 'Action',
      key: 'action',
      render: record => (
        <a
          onClick={() => {
            walletSelect(record);
          }}
        >
          Select
        </a>
      ),
    },
  ];

  return (
    <Layout className="site-layout">
      <Header className="site-layout-background">Wallet</Header>
      <div className="header-description">You may review all your wallets here.</div>
      <Content>
        <div className="site-layout-background wallet-content">
          <div className="container">
            <Table dataSource={walletList} columns={columns} />
          </div>
        </div>
      </Content>
      <Footer />
    </Layout>
  );
}

export default WalletPage;
