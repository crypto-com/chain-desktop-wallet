// import { Divider } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';

const About = () => {
  const [t] = useTranslation();

  return (
    <>
      <div className="site-layout-background settings-content">
        <div className="container">
          <div className="title">{t('settings.about.termsAndConditions.title')}</div>
          {/* <div className="description">{t('settings.support.helpCenter.description')}</div> */}
          <a
            href="https://help.crypto.com/en/collections/2221157-crypto-com-defi-wallet"
            target="_blank"
            rel="noreferrer"
          >
            {t('general.learnMore')}
          </a>
          {/* <Divider />
                <div className="title">{t('settings.support.feedbackForm.title')}</div>
                <div className="description">{t('settings.support.feedbackForm.description')}</div>
                <a href="https://help.crypto.com/en/collections/2221157-crypto-com-defi-wallet" target="_blank" rel="noreferrer">{t('settings.support.feedbackForm.title')}</a>
                <Divider /> */}
        </div>
      </div>
    </>
  );
};

export default About;
