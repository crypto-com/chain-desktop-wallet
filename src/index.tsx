import React from 'react';
import ReactDOM from 'react-dom';
import { RecoilRoot } from 'recoil';
import * as serviceWorker from './serviceWorker';
import RouteHub from './pages/route';
import './index.less';

ReactDOM.render(
  <RecoilRoot>
    <RouteHub />
  </RecoilRoot>,
  document.getElementById('root'),
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
