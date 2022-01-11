import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from 'antd';
import { useSetRecoilState } from 'recoil';
import './dapp.less';
import { pageLockState } from '../../recoil/atom';
import DappBrowser from './browser/DappBrowser';
import { Dapp } from './types';
import BorderlessCard from './components/BorderlessCard/BorderlessCard';
import logoVvs from './assets/vvs.svg';
import logoTectonic from './assets/tectonic.svg';

const { Header, Content } = Layout;

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

const DappPage = () => {
  const setPageLock = useSetRecoilState(pageLockState);
  const [selectedDapp, setSelectedDapp] = useState<Dapp>();
  const [t] = useTranslation();

  useEffect(() => {
    if (selectedDapp) {
      setPageLock('dapp');
    } else {
      setPageLock('');
    }
  }, [selectedDapp]);

  return selectedDapp ? (
    <DappBrowser dapp={selectedDapp} />
  ) : (
    <Layout className="site-layout">
      <Header className="site-layout-background">{t('dapp.title')}</Header>
      <div className="header-description">{t('dapp.description')}</div>
      <Content>
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
      </Content>
    </Layout>
  );
};

export default DappPage;
