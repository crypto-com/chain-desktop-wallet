import React from 'react';
// import ReactDOM from 'react-dom';
import './home.less';
import 'antd/dist/antd.css';
import { Layout, Menu } from 'antd';
import { Link } from 'react-router-dom';

const { Header, Content, Footer, Sider } = Layout;

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
          <div className='back-to-welcome'>
            <Link to='welcome'>
              Back to welcome
            </Link>
          </div>
        </Sider>
        <Layout className="site-layout" style={{ marginLeft: 200 }}>
          <Header className="site-layout-background" style={{ padding: 0, background: '#f0f2f5' }} >Welcome Back!</Header>
          <Content style={{ margin: '24px 16px 0', overflow: 'initial', height: 'calc(100vh - 136px)' }}>
            <div className="site-layout-background" style={{ padding: 24, textAlign: 'center' }}>
              content
            </div>
          </Content>
          <Footer style={{ textAlign: 'center' }} />
        </Layout>
      </Layout>
    </main>
  );
}

export default HomePage;
