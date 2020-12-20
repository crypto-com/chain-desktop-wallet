import React, { useEffect, useRef, useState } from 'react';
import './home.less';
import 'antd/dist/antd.css';
import { Layout, Table, Tabs } from 'antd';
import { useRecoilState } from 'recoil';
import { scaledAmount, scaledBalance, scaledStakingBalance } from '../../models/UserAsset';
import { walletAssetState } from '../../recoil/atom';
import { walletService } from '../../service/WalletService';
import { StakingTransactionData } from '../../models/Transaction';

// import {ReactComponent as HomeIcon} from '../../assets/icon-home-white.svg';

const { Header, Content, Footer } = Layout;
const { TabPane } = Tabs;

const TransactionColumns = [
  {
    title: 'Index',
    dataIndex: 'index',
    key: 'index',
  },
  {
    title: 'Transaction Hash',
    dataIndex: 'txhash',
    key: 'txhash',
    render: text => <a>{text}</a>,
  },
  {
    title: 'Amount',
    dataIndex: 'amount',
    key: 'amount',
  },
  {
    title: 'Time',
    dataIndex: 'time',
    key: 'time',
  },
];

const TransactionData = [
  {
    key: '1',
    index: '1',
    txhash: '0x0edbd6…e0470dc1',
    amount: '500, 000',
    time: '31/12/2020 23:59:59',
  },
  {
    key: '2',
    index: '2',
    txhash: '0x7a53b75…8104be15',
    amount: '500, 000',
    time: '31/12/2020 23:59:59',
  },
  {
    key: '3',
    index: '3',
    txhash: '0x7a53b75…8104be15',
    amount: '500, 000',
    time: '31/12/2020 23:59:59',
  },
];

interface StakingTabularData {
  key: string;
  stakedAmount: string;
  validatorAddress: string;
  delegatorAddress: string;
}

function HomePage() {
  const [userAsset, setUserAsset] = useRecoilState(walletAssetState);
  const [delegations, setDelegations] = useState<StakingTabularData[]>([]);
  const didMountRef = useRef(false);

  useEffect(() => {
    let unmounted = false;

    const syncAssetData = async () => {
      const sessionData = await walletService.retrieveCurrentSession();
      const currentAsset = await walletService.retrieveDefaultWalletAsset(sessionData);
      const allDelegations: StakingTransactionData[] = await walletService.retrieveAllDelegations(
        sessionData.wallet.identifier,
      );

      const stakingTabularData = allDelegations.map(dlg => {
        const stakedAmount = scaledAmount(dlg.stakedAmount, currentAsset.decimals).toString();
        const data: StakingTabularData = {
          key: dlg.validatorAddress + dlg.stakedAmount,
          delegatorAddress: dlg.delegatorAddress,
          validatorAddress: dlg.validatorAddress,
          stakedAmount: `${stakedAmount}  ${currentAsset.symbol}`,
        };
        return data;
      });

      if (!unmounted) {
        setDelegations(stakingTabularData);
        setUserAsset(currentAsset);
      }
    };

    if (!didMountRef.current) {
      syncAssetData();
      didMountRef.current = true;
    }

    return () => {
      unmounted = true;
    };
  }, [delegations, setUserAsset]);

  const StakingColumns = [
    {
      title: 'Index',
      dataIndex: 'index',
      key: 'index',
    },
    {
      title: 'Validator Address',
      dataIndex: 'validatorAddress',
      key: 'validatorAddress',
      render: text => <a>{text}</a>,
    },
    {
      title: 'Amount',
      dataIndex: 'stakedAmount',
      key: 'stakedAmount',
    },
    {
      title: 'Delegator Address',
      dataIndex: 'delegatorAddress',
      key: 'delegatorAddress',
      render: text => <a>{text}</a>,
    },
  ];

  return (
    <Layout className="site-layout">
      <Header className="site-layout-background">Welcome Back!</Header>
      <Content>
        <div className="site-layout-background balance-container">
          <div className="balance">
            <div className="title">TOTAL BALANCE</div>
            <div className="quantity">
              {scaledBalance(userAsset)} {userAsset?.symbol}
            </div>
          </div>
          <div className="balance">
            <div className="title">STAKED BALANCE</div>
            <div className="quantity">
              {scaledStakingBalance(userAsset)} {userAsset?.symbol}
            </div>
          </div>
        </div>
        <Tabs defaultActiveKey="1">
          <TabPane tab="Transactions" key="1">
            <Table columns={TransactionColumns} dataSource={TransactionData} />
          </TabPane>
          <TabPane tab="Delegations" key="2">
            <Table columns={StakingColumns} dataSource={delegations} />
          </TabPane>
        </Tabs>
      </Content>
      <Footer />
    </Layout>
  );
}

export default HomePage;
