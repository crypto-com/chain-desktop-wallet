import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { useBookmark } from './hooks/useBookmark';
import { useShowDisclaimer } from './hooks/useShowDisclaimer';
import { DisclaimerModal } from './components/DisclaimerModal/DisclaimerModal';

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
            if (!url || url.length < 1) {
              return;
            }
            setAddressBarValue(url);
            updateBookmarkButtonBeHighlighted();
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
              <TabPane tab="Saved" key={TabKey.saved}>
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
            </Tabs>
          </Content>
        </>
      )}
    </Layout>
  );
};

export default DappPage;
