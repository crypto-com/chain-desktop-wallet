import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout, Tabs } from 'antd';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import './dapp.less';
import { sessionState, pageLockState } from '../../recoil/atom';
import DappBrowser, { DappBrowserRef } from './browser/DappBrowser';
import { Dapp } from './types';
import BorderlessCard from './components/BorderlessCard/BorderlessCard';
import logoVvs from './assets/vvs.svg';
import logoTectonic from './assets/tectonic.svg';
import logoFerroProtocol from './assets/ferro.png';

import AddressBar from './components/AddressBar/AddressBar';
import SavedTab from './components/Tabs/SavedTab';
import { isLocalhostURL, isValidURL } from '../../utils/utils';
import { IWebviewNavigationState, WebviewState } from './browser/useWebviewStatusInfo';
import { useBookmark } from './hooks/useBookmark';
import { useShowDisclaimer } from './hooks/useShowDisclaimer';
import { DisclaimerModal } from './components/DisclaimerModal/DisclaimerModal';
import { AnalyticsService } from '../../service/analytics/AnalyticsService';
import CronosDAppsTab from './components/Tabs/CronosDAppsTab';
import ChainConfigTab from './components/Tabs/ChainConfigTab';

const { Header, Content } = Layout;
const { TabPane } = Tabs;

const DappList: Dapp[] = [
  {
    name: 'Minted',
    logo: '/dapp_logos/minted.png',
    alt: '',
    description:
      'Get rewarded for trading NFTs.',
    url: 'https://minted.network/',
  },
  {
    name: 'Ferro Protocol',
    logo: logoFerroProtocol,
    alt: '',
    description:
      'Optimized to bring you the best rates to trade your stablecoins and pegged assets.',
    url: 'https://ferroprotocol.com/#/',
  },
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
    url: 'https://tectonic.finance/',
  },
];

const TabKey = {
  popular: 'popular',
  cronosDapps: 'Cronos DApps',
  saved: 'saved',
  chainConfig: 'Chain Config',
};

const DappPage = () => {
  const setPageLock = useSetRecoilState(pageLockState);
  const currentSession = useRecoilValue(sessionState);
  const [selectedDapp, setSelectedDapp] = useState<Dapp>();
  const [selectedURL, setSelectedURL] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [t] = useTranslation();
  const browserRef = useRef<DappBrowserRef>(null);

  const [selectedTabKey, setSelectedTabKey] = useState<string>(TabKey.popular);

  useEffect(() => {
    if (selectedDapp || selectedURL) {
      setPageLock('dapp');
    } else {
      setPageLock('');
    }
  }, [selectedDapp, selectedURL]);

  const shouldShowBrowser = selectedDapp || selectedURL?.length > 0;
  const [addressBarValue, setAddressBarValue] = useState('');

  const [webviewNavigationState, setWebviewNavigationState] = useState<IWebviewNavigationState>();
  const [webviewState, setWebviewState] = useState<WebviewState>();

  const { shouldShowDisclaimer, setDisableDisclaimer } = useShowDisclaimer();
  const [selectedShowDisclaimerURL, setSelectedShowDisclaimerURL] = useState('');

  const {
    list: bookmarkList,
    add: addBookmark,
    validate: validateBookmark,
    remove: removeBookmark,
  } = useBookmark();
  const [bookmarkButtonHighlighted, setBookmarkButtonHighlighted] = useState(false);

  const didMountRef = useRef(false);
  const analyticsService = new AnalyticsService(currentSession);

  const updateBookmarkButtonBeHighlighted = useCallback(() => {
    const url = browserRef.current?.getCurrentWebStatus()?.webviewURL;
    if (!url) {
      setBookmarkButtonHighlighted(false);
      return;
    }
    const should = bookmarkList.some(
      bookmark => new URL(bookmark.url).origin === new URL(url).origin,
    );
    setBookmarkButtonHighlighted(should);
  }, [bookmarkList, browserRef.current]);

  useEffect(() => {
    updateBookmarkButtonBeHighlighted();

    if (!didMountRef.current) {
      didMountRef.current = true;

      analyticsService.logPage('DApps');
    }
  }, [updateBookmarkButtonBeHighlighted]);

  return (
    <Layout className="site-layout">
      {selectedShowDisclaimerURL && (
        <DisclaimerModal
          url={selectedShowDisclaimerURL}
          onCancel={() => {
            setSelectedShowDisclaimerURL('');
          }}
          onConfirm={(checked, url) => {
            if (checked) {
              setDisableDisclaimer(url);
            }
            setSelectedURL(url);
            setSelectedShowDisclaimerURL('');
          }}
        />
      )}
      <AddressBar
        value={addressBarValue}
        onInputChange={value => setAddressBarValue(value)}
        buttonStates={{
          isLoading: webviewState === 'loading',
          isBackButtonDisabled: webviewNavigationState?.canGoBack === false,
          isForwardButtonDisabled: webviewNavigationState?.canGoForward === false,
          isRefreshButtonDisabled: webviewNavigationState?.canRefresh === false,
          isBookmarkButtonDisabled: false,
          isBookmarkButtonHighlighted: bookmarkButtonHighlighted,
          isExitButtonDisabled: shouldShowBrowser === false,
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
          onBookmarkButtonClick: () => {
            const bookMarkInfo = browserRef.current?.getCurrentWebStatus();
            if (!bookMarkInfo?.title || !bookMarkInfo.webviewURL) {
              return;
            }

            const url = new URL(bookMarkInfo.webviewURL).origin;

            if (!validateBookmark(url)) {
              removeBookmark(url);
              return;
            }

            addBookmark({
              url,
              title: bookMarkInfo?.title,
              faviconURL: bookMarkInfo.faviconURL,
            });
          },
          onExitButtonClick: () => {
            setSelectedDapp(undefined);
            setSelectedURL('');
            setAddressBarValue('');
            setWebviewState('idle');
            setWebviewNavigationState({
              canGoBack: false,
              canGoForward: false,
              canRefresh: false,
            });
          },
        }}
        onSearch={value => {
          setSelectedDapp(undefined);
          // detect whether it's a domain
          if (isValidURL(value) || isLocalhostURL(value)) {
            // jump to website
            setSelectedURL(value);
          } else {
            // google search
            setSelectedURL(`https://www.google.com/search?q=${value}`);
          }
        }}
      />
      {shouldShowBrowser && (
        <DappBrowser
          dapp={selectedDapp}
          dappURL={selectedURL}
          ref={browserRef}
          onStateChange={(state, navState) => {
            setWebviewState(state);
            setWebviewNavigationState(navState);
          }}
          onURLChanged={url => {
            if (!url || url.length < 1) {
              return;
            }

            const domain = new URL(url).hostname;
            if (selectedDomain !== domain) {
              analyticsService.logBrowserDomain(domain);
              setSelectedDomain(domain ?? '');
            }

            setAddressBarValue(url);
            updateBookmarkButtonBeHighlighted();
          }}
        />
      )}
      <div
        style={{
          display: shouldShowBrowser ? 'none' : 'block',
        }}
      >
        <Header className="site-layout-background">{t('dapp.title')}</Header>
        <div className="header-description">{t('dapp.description')}</div>
        <Content>
          <Tabs
            defaultActiveKey={selectedTabKey}
            onChange={value => {
              setSelectedTabKey(value);
            }}
          >
            <TabPane tab={t('dapp.tab.popular.title')} key={TabKey.popular}>
              <div className="dapps">
                <div className="cards">
                  {DappList.map((dapp, idx) => {
                    return (
                      <BorderlessCard
                        key={`partner-${idx}`}
                        onClick={() => {
                          if (shouldShowDisclaimer(dapp.url)) {
                            setSelectedShowDisclaimerURL(dapp.url);
                            return;
                          }

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
            <TabPane tab="Cronos DApps" key={TabKey.cronosDapps}>
              <CronosDAppsTab
                onClickDapp={dapp => {
                  setSelectedURL(dapp.link);
                }}
              />
            </TabPane>
            <TabPane tab={t('dapp.tab.saved.title')} key={TabKey.saved}>
              <SavedTab
                onClick={bookmark => {
                  if (shouldShowDisclaimer(bookmark.url)) {
                    setSelectedShowDisclaimerURL(bookmark.url);
                    return;
                  }

                  setSelectedDapp(undefined);
                  setSelectedURL(bookmark.url);
                }}
              />
            </TabPane>
            <TabPane tab={t('dapp.chainConfig')} key={TabKey.chainConfig}>
              <ChainConfigTab />
            </TabPane>
          </Tabs>
        </Content>
      </div>
    </Layout>
  );
};

export default DappPage;
