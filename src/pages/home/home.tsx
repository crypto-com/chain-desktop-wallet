import React from 'react';
import './home.less';
import 'antd/dist/antd.css';
import { Layout, Table, Space, Tabs } from 'antd';
// import {ReactComponent as HomeIcon} from '../../assets/icon-home-white.svg';

const { Header, Content, Footer } = Layout;
const { TabPane } = Tabs;
const totalBalance = '500,000';
const stakedBalance = '250,000';

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

const StakingColumns = [
  {
    title: 'Index',
    dataIndex: 'index',
    key: 'index',
  },
  {
    title: 'Address',
    dataIndex: 'address',
    key: 'address',
    render: text => <a>{text}</a>,
  },
  {
    title: 'Amount',
    dataIndex: 'amount',
    key: 'amount',
  },
  {
    title: 'Action',
    key: 'action',
    render: () => (
      <Space size="middle">
        <a>Deposit Stake</a>
        <a>Unbond Stake</a>
      </Space>
    ),
  },
];

const StakingData = [
  {
    key: '1',
    index: '1',
    address: 'tcro1reyshfdygf7673xm9p8v0xvtd96m6cd6dzswyj',
    amount: '500, 000',
    tags: ['nice', 'developer'],
  },
  {
    key: '2',
    index: '2',
    address: 'tcro1uevms2nv4f2dhvm5u7sgus2yncgh7gdwn6urwe',
    amount: '300, 000',
    tags: ['loser'],
  },
  {
    key: '3',
    index: '3',
    address: 'tcro1uvvmzes9kazpkt359exm67qqj384l7c74mjgrr',
    amount: '100, 000',
    tags: ['cool', 'teacher'],
  },
];


function HomePage() {
  return (
      <Layout className="site-layout">
        <Header className="site-layout-background">Welcome Back!</Header>
        <Content>
          <div className="site-layout-background balance-container">
            <div className="balance">
              <div className="title">TOTAL BALANCE</div>
              <div className="quantity">{totalBalance} CRO</div>
            </div>
            <div className="balance">
              <div className="title">STAKED BALANCE</div>
              <div className="quantity">{stakedBalance} CRO</div>
            </div>
          </div>
          <Tabs defaultActiveKey="1">
            <TabPane tab="Transactions" key="1">
              <Table columns={TransactionColumns} dataSource={TransactionData} />
            </TabPane>
            <TabPane tab="Staking" key="2">
              <Table columns={StakingColumns} dataSource={StakingData} />
            </TabPane>
          </Tabs>
        </Content>
        <Footer />
      </Layout>
  );
}

export default HomePage;
