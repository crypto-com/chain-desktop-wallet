import React from 'react';
// import React, { useState } from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';

import WelcomePage from './welcome/welcome';
import RestorePage from './restore/restore';
import CreatePage from './create/create';
import BackupPage from './backup/backup';
import HomePage from './home/home';
import SendPage from './send/send';
import ReceivePage from './receive/receive';
import HomeLayout from '../layouts/home/home';

function RouteHub() {
  // const [page, setPage] = useState('welcome');
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
          {routeHomeLayoutItems.map(item => {
            return (
              <Route exact path={item.path} key={item.path}>
                {item.component}
              </Route>
            );
          })}
        </HomeLayout>
        <Redirect to="/" />
      </Switch>
    </Router>
  );
}

export default RouteHub;
