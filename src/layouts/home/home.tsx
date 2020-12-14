import React, { useState, useEffect, useRef } from 'react';
import './home.less';
import 'antd/dist/antd.css';
import { Layout, Menu, Dropdown } from 'antd';
import { Link, useHistory } from 'react-router-dom';
import Icon, { CaretDownOutlined } from '@ant-design/icons';
// import {ReactComponent as HomeIcon} from '../../assets/icon-home-white.svg';
import WalletIcon from '../../assets/icon-wallet-grey.svg';
import IconHome from '../../svg/IconHome';
import IconSend from '../../svg/IconSend';
import IconReceive from '../../svg/IconReceive';
import IconAddress from '../../svg/IconAddress';
import { walletService } from '../../service/WalletService';

interface HomeLayoutProps {
  children?: React.ReactNode;
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
  const history = useHistory();
  const [hasWallet, setHasWallet] = useState(true); // Default as true. useEffect will only re-render if result of hasWalletBeenCreated === false
  const didMountRef = useRef(false);

  useEffect(() => {
    const fetchWalletData = async () => {
      const hasWalletBeenCreated = await walletService.hasWalletBeenCreated();
      // eslint-disable-next-line no-console
      console.log('HAS_WALLET_BEEN =>', hasWalletBeenCreated);
      setHasWallet(hasWalletBeenCreated);
    };
    if (!didMountRef.current) {
      fetchWalletData();
      didMountRef.current = true;
    } else if (!hasWallet) {
      history.push('/welcome');
    }
  }, [hasWallet, history]);

  return (
    <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']}>
      <Menu.Item key="1" icon={<Icon component={IconHome} />}>
        <Link to="/home">Home</Link>
      </Menu.Item>
      <Menu.Item key="2" icon={<Icon component={IconAddress} />}>
        Address
      </Menu.Item>
      <Menu.Item key="3" icon={<Icon component={IconSend} />}>
        <Link to="/send">Send</Link>
      </Menu.Item>
      <Menu.Item key="4" icon={<Icon component={IconReceive} />}>
        <Link to="/receive">Receive</Link>
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
