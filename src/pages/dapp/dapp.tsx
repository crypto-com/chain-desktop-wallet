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

  return (
    <Layout className="site-layout">
      <AddressBar isBackButtonDisabled={false} />
      {selectedDapp ? (
        <DappBrowser
          dapp={selectedDapp}
          ref={browserRef}
          onStateChange={state => {
            // eslint-disable-next-line no-console
            console.log('DappBrowser state change', state);
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
