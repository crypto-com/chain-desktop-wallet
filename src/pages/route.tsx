import React from 'react';
// import React, { useState } from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';

import WelcomePage from './welcome';
import RestorePage from './restore';
import CreatePage from './create';

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
              <Route path={item.path} key={item.path}>
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
