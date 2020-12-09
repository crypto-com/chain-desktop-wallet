import React from 'react';
// import React, { useState } from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';

import WelcomePage from './welcome/welcome';
import RestorePage from './restore/restore';
import CreatePage from './create/create';
import BackupPage from './backup/backup';
import HomePage from './home/home';

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
    {
      name: 'Home Page',
      key: 'home',
      path: '/home',
      component: <HomePage />,
    },
  ];

  return (
    <Router>
      <div>
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
          <Redirect to="/" />
        </Switch>
      </div>
    </Router>
  );
}

export default RouteHub;
