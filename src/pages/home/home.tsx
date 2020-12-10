import React from 'react';
// import ReactDOM from 'react-dom';
import './home.less';
import 'antd/dist/antd.css';
import { Layout, Menu, Table, Tag, Space } from 'antd';
import MenuContentBlock from '../../components/MenuContentBlock/MenuContentBlock';
// import { Link } from 'react-router-dom';

const { Header, Content, Footer, Sider } = Layout;
const siderWidth = '256px';
const columns = [
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
    title: 'Tags',
    key: 'tags',
    dataIndex: 'tags',
    render: tags => (
      <>
        {tags.map(tag => {
          let color = tag.length > 5 ? 'geekblue' : 'green';
          if (tag === 'loser') {
            color = 'volcano';
          }
          return (
            <Tag color={color} key={tag}>
              {tag.toUpperCase()}
            </Tag>
          );
        })}
      </>
    ),
  },
  {
    title: 'Action',
    key: 'action',
    render: (text: any, record: any) => (
      <Space size="middle">
        <a>Invite {record.name}</a>
        <a>Delete</a>
      </Space>
    ),
  },
];

const data = [
  {
    key: '1',
    index: '1',
    txhash: '0x0edbd6…e0470dc1',
    amount: '500, 000',
    tags: ['nice', 'developer'],
  },
  {
    key: '2',
    index: '2',
    txhash: '0x7a53b75…8104be15',
    amount: '500, 000',
    tags: ['loser'],
  },
  {
    key: '3',
    index: '3',
    txhash: '0x7a53b75…8104be15',
    amount: '500, 000',
    tags: ['cool', 'teacher'],
  },
];

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
          <Menu theme="dark" mode="inline" defaultSelectedKeys={['4']}>
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
        </Sider>
        <Layout className="site-layout" style={{ marginLeft: siderWidth }}>
          <Header className="site-layout-background" style={{ padding: 0, background: '#f0f2f5' }} >Welcome Back!</Header>
          <Content style={{ margin: '24px 16px 0', overflow: 'initial', height: 'calc(100vh - 176px)' }}>
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
            <MenuContentBlock title='Transaction' className="table">
              <Table columns={columns} dataSource={data} />
            </MenuContentBlock>
          </Content>
          <Footer style={{ textAlign: 'center' }} />
        </Layout>
      </Layout>
    </main>
  );
}

export default HomePage;
