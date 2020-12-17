import React, { useEffect, useRef, useState } from 'react';
import './home.less';
import 'antd/dist/antd.css';
import { Dropdown, Layout, Menu, Spin } from 'antd';
import { Link, useHistory, useLocation } from 'react-router-dom';
import Icon, { CaretDownOutlined, LoadingOutlined } from '@ant-design/icons';
// import {ReactComponent as HomeIcon} from '../../assets/icon-home-white.svg';
import { useRecoilState } from 'recoil';

import { sessionState, walletAssetState, walletListState } from '../../recoil/atom';
import WalletIcon from '../../assets/icon-wallet-grey.svg';
import IconHome from '../../svg/IconHome';
import IconSend from '../../svg/IconSend';
import IconReceive from '../../svg/IconReceive';
import IconAddress from '../../svg/IconAddress';
import { walletService } from '../../service/WalletService';
import { Session } from '../../models/Session';

interface HomeLayoutProps {
  children?: React.ReactNode;
}

const { Sider } = Layout;
const { SubMenu } = Menu;

function HomeLayout(props: HomeLayoutProps) {
  const history = useHistory();
  const [hasWallet, setHasWallet] = useState(true); // Default as true. useEffect will only re-render if result of hasWalletBeenCreated === false
  const [session, setSession] = useRecoilState(sessionState);
  const [userAsset, setUserAsset] = useRecoilState(walletAssetState);
  const [walletList, setWalletList] = useRecoilState(walletListState);
  const [loading, setLoading] = useState(false);
  const didMountRef = useRef(false);

  useEffect(() => {
    const fetchDB = async () => {
      setLoading(true);
      const hasWalletBeenCreated = await walletService.hasWalletBeenCreated();
      const sessionData = await walletService.retrieveCurrentSession();
      const currentAsset = await walletService.retrieveDefaultWalletAsset(sessionData);
      const allWalletsData = await walletService.retrieveAllWallets();
      setHasWallet(hasWalletBeenCreated);
      setSession(sessionData);
      setUserAsset(currentAsset);
      setWalletList(allWalletsData);
      setLoading(false);
    };

    if (!didMountRef.current) {
      fetchDB();
      didMountRef.current = true;
    } else if (!hasWallet) {
      history.push('/welcome');
    }
  }, [history, hasWallet, session, setSession, userAsset, setUserAsset, walletList, setWalletList]);

  const HomeMenu = () => {
    const locationPath = useLocation().pathname;
    const paths = ['/home', '/staking', '/send', '/receive'];

    let menuSelectedKey = locationPath;
    if (!paths.includes(menuSelectedKey)) {
      menuSelectedKey = '/home';
    }

    return (
      <Menu theme="dark" mode="inline" defaultSelectedKeys={[menuSelectedKey]}>
        <Menu.Item key="/home" icon={<Icon component={IconHome} />}>
          <Link to="/home">Home</Link>
        </Menu.Item>
        <Menu.Item key="/staking" icon={<Icon component={IconAddress} />}>
          <Link to="/staking">Staking</Link>
        </Menu.Item>
        <Menu.Item key="/send" icon={<Icon component={IconSend} />}>
          <Link to="/send">Send</Link>
        </Menu.Item>
        <Menu.Item key="/receive" icon={<Icon component={IconReceive} />}>
          <Link to="/receive">Receive</Link>
        </Menu.Item>
      </Menu>
    );
  };

  const WalletMenu = () => {
    const walletClick = async e => {
      setLoading(true);
      await walletService.setCurrentSession(new Session(walletList[e.key]));
      const currentSession = await walletService.retrieveCurrentSession();
      const currentAsset = await walletService.retrieveDefaultWalletAsset(currentSession);
      setSession(currentSession);
      setUserAsset(currentAsset);
      setLoading(false);
    };

    return (
      <Menu>
        <Menu.Item>
          <Link to="/create">Create Wallet</Link>
        </Menu.Item>
        <Menu.Item>
          <Link to="/restore">Restore Wallet</Link>
        </Menu.Item>
        <SubMenu title="Wallet List">
          {walletList.map((item, index) => {
            return (
              <Menu.Item key={index} onClick={walletClick}>
                {item.name}
              </Menu.Item>
            );
          })}
        </SubMenu>
      </Menu>
    );
  };

  return (
    <main className="home-layout">
      <Layout>
        <Sider>
          <div className="logo" />
          <div className="version">SAMPLE WALLET v0.0.1</div>
          <HomeMenu />
          <Dropdown
            overlay={<WalletMenu />}
            placement="topCenter"
            className="wallet-selection"
            arrow
            trigger={['click']}
          >
            <div>
              <img src={WalletIcon} alt="walletIcon" />
              {session?.wallet.name}
              <CaretDownOutlined />
            </div>
          </Dropdown>
        </Sider>
        {loading ? (
          <Spin indicator={<LoadingOutlined style={{ fontSize: 96 }} spin />} />
        ) : (
          props.children
        )}
      </Layout>
    </main>
  );
}

export default HomeLayout;
