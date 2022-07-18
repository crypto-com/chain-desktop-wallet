import React from 'react';
import ReactDOM from 'react-dom';
import { RecoilRoot } from 'recoil';
import RecoilNexus from 'recoil-nexus';
import * as serviceWorker from './serviceWorker';
import RouteHub from './pages/route';
import './index.less';
import { task } from './service/tasks/BackgroundJob';
import './language/I18n';
import { IntercomProvider } from 'react-use-intercom';
import { INTERCOM_APP_ID } from './config/StaticConfig';
import { handleUnreadCountChange } from './pages/customer-service';

ReactDOM.render(
  <IntercomProvider appId={INTERCOM_APP_ID} onUnreadCountChange={handleUnreadCountChange}>
    <RecoilRoot>
      <RecoilNexus />
      <RouteHub />
    </RecoilRoot>
  </IntercomProvider>,
  document.getElementById('root'),
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
task.runJobs();
