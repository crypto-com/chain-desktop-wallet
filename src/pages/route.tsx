import React, { useRef, useLayoutEffect, useState } from 'react';
import {
  BrowserRouter,
  HashRouter as ElectronRouter,
  Switch,
  Route,
  Redirect,
} from 'react-router-dom';
import axios from 'axios';
import { isElectron } from '../utils/utils';

import WelcomePage from './welcome/welcome';
import RestorePage from './restore/restore';
import CreatePage from './create/create';
import BackupPage from './backup/backup';
import HomePage from './home/home';
import WalletPage from './wallet/wallet';
import RefreshPage from './refresh/refresh';
import StakingPage from './staking/staking';
import GovernancePage from './governance/governance';
import NftPage from './nft/nft';
import SettingsPage from './settings/settings';
import BridgePage from './bridge/bridge';
import SignUpPage from './signup/signup';
import HomeLayout from '../layouts/home/home';
import AssetsPage from './assets/assets';
import BlockPage from './block/block';
import DappPage from './dapp/dapp';
import WalletConnectPage from './walletconnect';

import {
  CLOUDFLARE_TRACE_URI,
  NOT_KNOWN_YET_VALUE,
  COUNTRY_CODES_TO_BLOCK,
  GEO_BLOCK_TIMEOUT,
} from '../config/StaticConfig';

interface RouterProps {
  children: React.ReactNode;
}

// Electron build: <HashRouter>, Web build: <BrowserRouter>
const Router: React.FC<RouterProps> = props => {
  return isElectron() ? (
    <ElectronRouter>{props.children}</ElectronRouter>
  ) : (
    <BrowserRouter>{props.children}</BrowserRouter>
  );
};

const getCurrentGeoLocationCountryCode = async () => {
  const geoLocationPlainText = await axios.get(CLOUDFLARE_TRACE_URI);
  const geoLocationJSON = geoLocationPlainText.data
    .trim()
    .split('\n')
    .reduce((obj, pair) => {
      const [key, value] = pair.split('=');
      obj[key] = value;
      return obj;
    }, {});

  if (geoLocationJSON.hasOwnProperty('loc')) {
    return geoLocationJSON.loc;
  }
  return NOT_KNOWN_YET_VALUE;
};

function RouteHub() {
  const [isCountryBlocked, setIsCountryBlocked] = useState(true);
  const [isBlockSloganVisible, setIsBlockSloganVisible] = useState(false);
  const didMountRef = useRef(false);

  const routeIndex = {
    name: 'Welcome Page',
    key: 'welcome',
    path: '/',
    component: <WelcomePage />,
  };

  const blockPageRoute = {
    name: 'Block Page',
    key: 'block',
    path: '/block',
    component: <BlockPage />,
  };

  const routeItems = [
    {
      name: 'Welcome Page',
      key: 'welcome',
      path: '/welcome',
      component: <WelcomePage />,
    },
    {
      name: 'Restore Page',
      key: 'restore',
      path: '/restore',
      component: <RestorePage />,
    },
    {
      name: 'Create Page',
      key: 'create',
      path: '/create',
      component: <CreatePage />,
    },
    {
      name: 'Backup Page',
      key: 'backup',
      path: '/create/backup',
      component: <BackupPage />,
    },
    {
      name: 'SignUp Page',
      key: 'signUp',
      path: '/signUp',
      component: <SignUpPage />,
    },
  ];

  const routeHomeLayoutItems = [
    {
      name: 'Home Page',
      key: 'home',
      path: '/home',
      component: <HomePage />,
    },
    {
      name: 'Send Page',
      key: 'send',
      path: '/send',
      component: <AssetsPage />,
    },
    {
      name: 'Assets Page',
      key: 'assets',
      path: '/assets',
      component: <AssetsPage />,
    },
    {
      name: 'Staking Page',
      key: 'staking',
      path: '/staking',
      component: <StakingPage />,
    },
    {
      name: 'Governance Page',
      key: 'governance',
      path: '/governance',
      component: <GovernancePage />,
    },
    {
      name: 'Nft Page',
      key: 'nft',
      path: '/nft',
      component: <NftPage />,
    },
    {
      name: 'Bridge Page',
      key: 'bridge',
      path: '/bridge',
      component: <BridgePage />,
    },
    {
      name: 'Dapp Page',
      key: 'dapp',
      path: '/dapp',
      component: <DappPage />,
    },
    {
      name: 'Settings Page',
      key: 'settings',
      path: '/settings',
      component: <SettingsPage />,
    },
    {
      name: 'Wallet Page',
      key: 'wallet',
      path: '/wallet',
      component: <WalletPage />,
    },
    {
      name: 'Refresh Page',
      key: 'refresh',
      path: '/refresh',
      component: <RefreshPage />,
    },
    {
      name: 'WalletConnect',
      key: 'walletconnect',
      path: '/walletconnect',
      component: <WalletConnectPage />,
    },
  ];

  useLayoutEffect(() => {
    const checkIsCountryBlocked = async () => {
      const currentCountryCode = await getCurrentGeoLocationCountryCode();

      // Todo: Fetch country codes dynamically
      setTimeout(() => {
        if (!COUNTRY_CODES_TO_BLOCK.includes(currentCountryCode)) {
          setIsCountryBlocked(false);
        }
        setIsBlockSloganVisible(true);
      }, GEO_BLOCK_TIMEOUT);
    };

    if (!didMountRef.current) {
      checkIsCountryBlocked();
      didMountRef.current = true;
    }
  }, [isCountryBlocked, setIsCountryBlocked]);

  return isCountryBlocked ? (
    <Router>
      {React.cloneElement(blockPageRoute.component, {
        isCountryBlocked,
        isBlockSloganVisible,
      })}
    </Router>
  ) : (
    <Router>
      <Switch>
        <Route exact path={routeIndex.path} key={routeIndex.key}>
          {routeIndex.component}
        </Route>
        {routeItems.map(item => {
          return (
            <Route exact path={item.path} key={item.path}>
              {item.component}
            </Route>
          );
        })}
        <HomeLayout>
          <Switch>
            {routeHomeLayoutItems.map(item => {
              return (
                <Route path={item.path} key={item.key}>
                  {item.component}
                </Route>
              );
            })}
            <Route>
              <Redirect to="/home" />
            </Route>
          </Switch>
        </HomeLayout>
      </Switch>
    </Router>
  );
}

export default RouteHub;
