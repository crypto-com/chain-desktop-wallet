import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from 'antd';
import './dapp.less';
import DappBrowser from './browser/DappBrowser';
import { Dapp } from './types';
import BorderlessCard from './components/BorderlessCard/BorderlessCard';
import logoVvs from './assets/vvs.svg';

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
  const [selectedDapp, setSelectedDapp] = useState<Dapp>();
  const [t] = useTranslation();

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
