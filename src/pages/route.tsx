import React from 'react';
import {
  BrowserRouter,
  HashRouter as ElectronRouter,
  Switch,
  Route,
  Redirect,
} from 'react-router-dom';
import { isElectron } from '../utils/utils';

import WelcomePage from './welcome/welcome';
import RestorePage from './restore/restore';
import CreatePage from './create/create';
import BackupPage from './backup/backup';
import HomePage from './home/home';
import SendPage from './send/send';
import ReceivePage from './receive/receive';
import StakingPage from './staking/staking';
import SignUpPage from './signup/signup';
import HomeLayout from '../layouts/home/home';

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

function RouteHub() {
  const routeIndex = {
    name: 'Welcome Page',
    key: 'welcome',
    path: '/',
    component: <WelcomePage />,
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
      component: <SendPage />,
    },
    {
      name: 'Receive Page',
      key: 'receive',
      path: '/receive',
      component: <ReceivePage />,
    },
    {
      name: 'Staking Page',
      key: 'staking',
      path: '/staking',
      component: <StakingPage />,
    },
  ];

  return (
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
                <Route exact path={item.path} key={item.path}>
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
