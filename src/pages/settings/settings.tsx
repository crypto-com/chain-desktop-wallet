import React from 'react';
import './settings.less';
import 'antd/dist/antd.css';
import { Layout } from 'antd';
import { useTranslation } from 'react-i18next';
import { FormSettings } from './components/FormSettings';

const { Header, Content, Footer } = Layout;

const SettingsPage = () => {
  const [t] = useTranslation();
  return (
    <Layout className="site-layout">
      <Header className="site-layout-background">{t('settings.title')}</Header>
      <div className="header-description">{t('settings.description')}</div>
      <Content>
        <FormSettings />
      </Content>
      <Footer />
    </Layout>
  );
};

export default SettingsPage;
