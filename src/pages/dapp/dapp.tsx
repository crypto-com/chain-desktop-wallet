import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout, Tabs } from 'antd';
import { useSetRecoilState } from 'recoil';
import './dapp.less';
import { pageLockState } from '../../recoil/atom';
import DappBrowser, { DappBrowserRef } from './browser/DappBrowser';
import { Dapp } from './types';
import BorderlessCard from './components/BorderlessCard/BorderlessCard';
import logoVvs from './assets/vvs.svg';
import logoTectonic from './assets/tectonic.svg';
import AddressBar from './components/AddressBar/AddressBar';
import SavedTab from './components/Tabs/SavedTab';
import { isValidURL } from '../../utils/utils';
import { IWebviewNavigationState, WebviewState } from './browser/useWebviewStatusInfo';

const { Header, Content } = Layout;
const { TabPane } = Tabs;

const DappList: Dapp[] = [
  {
    name: 'VVS Finance',
    logo: logoVvs,
    alt: '',
    description:
      'Your gateway to the decentralized finance movement. Take control of your finances and earn sparkly VVS rewards.',
    url: 'https://vvs.finance',
  },
  {
    name: 'Tectonic',
    logo: logoTectonic,
    alt: 'tectonic-logo',
    description:
      'Tectonic is a cross-chain money market for earning passive yield and accessing instant backed loans.',
    url: 'https://app.tectonic.finance/',
  },
  // {
  //   name: 'Cronos Chimp Club',
  //   logo: logoVvs,
  //   alt: '',
  //   description: '',
  //   url: 'https://cronoschimp.club/',
  // },
  // {
  //   name: 'Beefy Finance',
  //   logo: logoVvs,
  //   alt: '',
  //   description: '',
  //   url: 'https://app.beefy.finance/#/cronos',
  // },
  // {
  //   name: 'Debank',
  //   logo: logoVvs,
  //   alt: '',
  //   description: '',
  //   url: 'https://debank.com',
  // },
];

const TabKey = { popular: 'popular', saved: 'saved' };

const DappPage = () => {
  const setPageLock = useSetRecoilState(pageLockState);
  const [selectedDapp, setSelectedDapp] = useState<Dapp>();
  const [selectedURL, setSelectedURL] = useState('');
  const [t] = useTranslation();
  const browserRef = useRef<DappBrowserRef>(null);

  const [selectedTabKey, setSelectedTabKey] = useState<string>(TabKey.popular);

  useEffect(() => {
    if (selectedDapp) {
      setPageLock('dapp');
    } else {
      setPageLock('');
    }
  }, [selectedDapp]);

  const shouldShowBrowser = selectedDapp || selectedURL?.length > 0;
  const [addressBarValue, setAddressBarValue] = useState('');

  const [webviewState, setWebviewState] = useState<WebviewState>();
  const [webviewNavigationState, setWebviewNavigationState] = useState<IWebviewNavigationState>();

  useEffect(() => {
    console.log('webviewState', webviewState);
  }, [webviewState]);

  return (
    <Layout className="site-layout">
      <AddressBar
        value={addressBarValue}
        onInputChange={value => setAddressBarValue(value)}
        buttonStates={{
          isBackButtonDisabled: webviewNavigationState?.canGoBack === false,
          isForwardButtonDisabled: webviewNavigationState?.canGoForward === false,
          isRefreshButtonDisabled: webviewNavigationState?.canRefresh === false,
          isBookmarkButtonDisabled: false,
          isBookmarkButtonHighlighted: false,
        }}
        buttonCallbacks={{
          onBackButtonClick: () => {
            browserRef.current?.goBack();
          },
          onForwardButtonClick: () => {
            browserRef.current?.goForward();
          },
          onRefreshButtonClick: () => {
            browserRef.current?.reload();
          },
          onBookmarkButtonClick: () => {},
        }}
        onSearch={value => {
          setSelectedDapp(undefined);
          // detect whether it's a domain
          if (isValidURL(value)) {
            // jump to website
            setSelectedURL(value);
          } else {
            // google search
            setSelectedURL(`http://www.google.com/search?q=${value}`);
          }
        }}
      />
      {shouldShowBrowser ? (
        <DappBrowser
          dapp={selectedDapp}
          dappURL={selectedURL}
          ref={browserRef}
          onStateChange={(state, navState) => {
            setWebviewState(state);
            setWebviewNavigationState(navState);
          }}
          onURLChanged={url => {
            setAddressBarValue(url);
          }}
        />
      ) : (
        <>
          <Header className="site-layout-background">{t('dapp.title')}</Header>
          <div className="header-description">{t('dapp.description')}</div>
          <Content>
            <Tabs
              defaultActiveKey={selectedTabKey}
              onChange={value => {
                setSelectedTabKey(value);
              }}
            >
              <TabPane tab="Popular" key={TabKey.popular}>
                <div className="dapps">
                  <div className="cards">
                    {DappList.map((dapp, idx) => {
                      return (
                        <BorderlessCard
                          key={`partner-${idx}`}
                          onClick={() => {
                            setSelectedDapp(dapp);
                          }}
                        >
                          <div className="logo">
                            <img src={dapp.logo} alt={dapp.alt} />
                          </div>
                          <div className="text">
                            <h3>{dapp.name}</h3>
                            <p>{dapp.description}</p>
                          </div>
                        </BorderlessCard>
                      );
                    })}
                  </div>
                </div>
              </TabPane>
              <TabPane tab="Saved" key={TabKey.saved}>
                <SavedTab onClick={() => {}} />
              </TabPane>
            </Tabs>
          </Content>
        </>
      )}
    </Layout>
  );
};

export default DappPage;
