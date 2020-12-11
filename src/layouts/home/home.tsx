import React from 'react';
import './home.less';
import 'antd/dist/antd.css';
import { Layout, Menu, Dropdown } from 'antd';
import { Link } from 'react-router-dom';
import Icon, { CaretDownOutlined } from '@ant-design/icons';
// import {ReactComponent as HomeIcon} from '../../assets/icon-home-white.svg';
import WalletIcon from '../../assets/icon-wallet-grey.svg';
import IconHome from '../../svg/IconHome';
import IconSend from '../../svg/IconSend';
import IconReceive from '../../svg/IconReceive';
import IconAddress from '../../svg/IconAddress';

interface HomeLayoutProps {
  children: React.ReactNode;
}

const { Sider } = Layout;

const walletMenu = (
  <Menu>
    <Menu.Item>
      <Link to="/create">Create Wallet</Link>
    </Menu.Item>
    <Menu.Item>
      <Link to="/restore">Restore Wallet</Link>
    </Menu.Item>
    <Menu.Item>Wallet List</Menu.Item>
  </Menu>
);

const HomeMenu = () => {
  return (
    <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']}>
      <Menu.Item key="1" icon={<Icon component={IconHome} />}>
          Home
      </Menu.Item>
      <Menu.Item key="2" icon={<Icon component={IconAddress} />}>
        Address
      </Menu.Item>
      <Menu.Item key="3" icon={<Icon component={IconSend} />}>
          Send
      </Menu.Item>
      <Menu.Item key="4" icon={<Icon component={IconReceive} />}>
        Receive
      </Menu.Item>
    </Menu>
  );
};

function HomeLayout(props: HomeLayoutProps) {
  return (
    <main className="home-layout">
      <Layout>
        <Sider>
          <div className="logo" />
          <div className="version">SAMPLE WALLET v0.0.1</div>
          <HomeMenu />
          <Dropdown
            overlay={walletMenu}
            placement="topCenter"
            className="wallet-selection"
            arrow
            trigger={['click']}
          >
            <div>
              <img src={WalletIcon} alt="walletIcon" /> Wallet - Test 1
              <CaretDownOutlined />
            </div>
          </Dropdown>
        </Sider>
        {props.children}
      </Layout>
    </main>
  );
}

export default HomeLayout;
