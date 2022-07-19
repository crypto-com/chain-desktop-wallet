import * as React from 'react';
import { Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import { useIntercom } from 'react-use-intercom';

const Support = () => {
  const [t] = useTranslation();
  const { show } = useIntercom();

  return (
    <>
      <div className="site-layout-background settings-content">
        <div className="container">
          <div className="title">{t('settings.support.helpCenter.title')}</div>
          <div className="description">{t('settings.support.helpCenter.description')}</div>
          <a
            href="https://help.crypto.com/en/collections/2221157-crypto-com-defi-wallet#crypto-com-defi-desktop-wallet"
            target="_blank"
            rel="noreferrer"
          >
            FAQ
          </a>
          <a
            style={{
              display: 'block',
              marginTop: '10px',
            }}
            onClick={() => {
              show();
            }}
          >
            {t('general.customerService.liveChat')}
          </a>
          <Divider />
          <div className="title">{t('settings.support.feedbackForm.title')}</div>
          <div className="description">{t('settings.support.feedbackForm.description')}</div>
          <a href="https://crypto-com.typeform.com/to/Eb5daoBF" target="_blank" rel="noreferrer">
            {t('settings.support.feedbackForm.title')}
          </a>
          <Divider />
          <div className="title">{t('settings.about.termsAndConditions.title')}</div>
          <a href="https://crypto.com/document/desktop_wallet" target="_blank" rel="noreferrer">
            {t('settings.about.termsAndConditions.title')}
          </a>
        </div>
      </div>
    </>
  );
};

export default Support;
