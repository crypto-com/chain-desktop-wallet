import React from 'react';
// import ReactDOM from 'react-dom';
import './home.less';
import 'antd/dist/antd.css';
import { Layout, Menu, Table, Space, Dropdown, Tabs } from 'antd';
// import MenuContentBlock from '../../components/MenuContentBlock/MenuContentBlock';
// import { Link } from 'react-router-dom';

const { Header, Content, Footer, Sider } = Layout;
const siderWidth = '256px';

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
    address: 'tcro1reyshfdygf7673xm9p8v0xvtd96m6cd6dzswyj',
    amount: '500, 000',
    tags: ['loser'],
  },
  {
    key: '3',
    index: '3',
    address: 'tcro1reyshfdygf7673xm9p8v0xvtd96m6cd6dzswyj',
    amount: '500, 000',
    tags: ['cool', 'teacher'],
  },
];

const menu = (
  <Menu>
    <Menu.Item>
      <a target="_blank" rel="noopener noreferrer" href="http://www.alipay.com/">
        Create Wallet
      </a>
    </Menu.Item>
    <Menu.Item>
      <a target="_blank" rel="noopener noreferrer" href="http://www.taobao.com/">
        Restore Wallet
      </a>
    </Menu.Item>
    <Menu.Item>
      <a target="_blank" rel="noopener noreferrer" href="http://www.tmall.com/">
        Wallet List
      </a>
    </Menu.Item>
  </Menu>
);
const { TabPane } = Tabs;

function HomePage() {
  return (
    <main className="home-page">
      <Layout>
        <Sider
          style={{
            overflow: 'auto',
            height: '100vh',
            position: 'fixed',
            left: 0,
          }}
          width={siderWidth}
        >
          <div className="logo" />
          <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']}>
            <Menu.Item key="1">
              Home
            </Menu.Item>
            <Menu.Item key="2">
              Address
            </Menu.Item>
            <Menu.Item key="3">
              Send
            </Menu.Item>
            <Menu.Item key="4">
              Receive
            </Menu.Item>
          </Menu>
          {/* <div className='back-to-welcome'>
            <Link to='welcome'>
              Back to welcome
            </Link>
          </div> */}

          <Dropdown overlay={menu} placement="topCenter">
            <a className="ant-dropdown-link" onClick={e => e.preventDefault()}>
              Wallet - Test 1{/* Hover me <DownOutlined /> */}
            </a>
          </Dropdown>
        </Sider>
        <Layout className="site-layout" style={{ marginLeft: siderWidth }}>
          <Header className="site-layout-background" style={{ padding: 0, background: '#f0f2f5' }} >Welcome Back!</Header>
          <Content style={{ margin: '24px 16px 0' }}>
            <div className="site-layout-background balance-container" style={{ padding: 24, textAlign: 'center' }}>
              <div className="balance">
                <div className="title">TOTAL BALANCE</div>
                <div className="quantity">500,000 CRO</div>
              </div>
              <div className="balance">
                <div className="title">STAKED BALANCE</div>
                <div className="quantity">250,000 CRO</div>
              </div>
            </div>
            <Tabs defaultActiveKey="1">
              <TabPane tab="Transactions" key="1">
                <Table columns={TransactionColumns} dataSource={TransactionData} style={{ minHeight: 500 }} />
              </TabPane>
              <TabPane tab="Staking" key="2">
                <Table columns={StakingColumns} dataSource={StakingData} style={{ minHeight: 500 }} />
              </TabPane>
            </Tabs>
            {/* <MenuContentBlock title='Transaction' className="table">
              <Table columns={columns} dataSource={data} style={{ minHeight: 500 }} />
            </MenuContentBlock> */}
          </Content>
          <Footer style={{ textAlign: 'center' }} />
        </Layout>
      </Layout>
    </main>
  );
}

export default HomePage;
