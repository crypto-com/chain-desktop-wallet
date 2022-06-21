import React, { useEffect, useRef, useState } from 'react';
import '../settings.less';
import 'antd/dist/antd.css';
import { Alert, Button, Carousel, Divider, message, notification, Select, Switch } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { useTranslation } from 'react-i18next';
import { CarouselRef } from 'antd/lib/carousel';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import { allMarketState, sessionState } from '../../../recoil/atom';
import { setMomentLocale } from '../../../language/I18n';
import { walletService } from '../../../service/WalletService';
import { secretStoreService } from '../../../service/storage/SecretStoreService';
import { DisableDefaultMemoSettings, DisableGASettings } from '../../../models/Wallet';
import ModalPopup from '../../../components/ModalPopup/ModalPopup';
import PasswordFormModal from '../../../components/PasswordForm/PasswordFormModal';

import {
  DEFAULT_LANGUAGE_CODE,
  SUPPORTED_LANGUAGE,
  SUPPORTED_CURRENCY,
  SupportedCurrency,
  AUTO_UPDATE_DISABLE_DURATIONS,
} from '../../../config/StaticConfig';
import { LEDGER_WALLET_TYPE } from '../../../service/LedgerService';
import { generalConfigService } from '../../../service/storage/GeneralConfigService';

const { ipcRenderer } = window.require('electron');

const { Option } = Select;

export function MetaInfoComponent() {
  const [session, setSession] = useRecoilState(sessionState);
  // const setMarketData = useSetRecoilState(marketState);
  const setAllMarketData = useSetRecoilState(allMarketState);
  const [updateLoading, setUpdateLoading] = useState(false);
  const { walletType } = session.wallet;

  const [defaultLanguageState, setDefaultLanguageState] = useState<string>(DEFAULT_LANGUAGE_CODE);
  const [defaultCurrencyState, setDefaultCurrencyState] = useState<string>(session.currency);
  const [defaultMemoStateDisabled, setDefaultMemoStateDisabled] = useState<boolean>(false);
  const [defaultGAStateDisabled, setDefaultGAStateDisabled] = useState<boolean>(false);
  const [defaultAutoUpdateDisabled, setDefaultAutoUpdateDisabled] = useState<boolean>(false);
  const [defaultAutoUpdateExpireTime, setDefaultAutoUpdateExpireTime] = useState<
    number | undefined
  >();
  const [autoUpdateDisableDuration, setAutoUpdateDisableDuration] = useState<number>(14);
  const [supportedCurrencies, setSupportedCurrencies] = useState<SupportedCurrency[]>([]);
  const [t, i18n] = useTranslation();

  const [inputPasswordVisible, setInputPasswordVisible] = useState<boolean>(false);
  const [decryptedPhrase, setDecryptedPhrase] = useState<string>();
  const [isExportRecoveryPhraseModalVisible, setIsExportRecoveryPhraseModalVisible] = useState<
    boolean
  >(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const didMountRef = useRef(false);

  // Slider related
  let recoveryPhraseSlider: CarouselRef | null = null;
  const itemsPerPage = 3;

  const NextArrow = props => {
    const { className, style, onClick } = props;
    return (
      <div
        className={className}
        style={{
          ...style,
          color: 'black',
          fontSize: '15px',
          lineHeight: '1.5715',
        }}
        onClick={onClick}
      >
        <RightOutlined />
      </div>
    );
  };

  const PrevArrow = props => {
    const { className, style, onClick } = props;
    return (
      <div
        className={className}
        style={{
          ...style,
          color: 'black',
          fontSize: '15px',
          lineHeight: '1.5715',
        }}
        onClick={onClick}
      >
        <LeftOutlined />
      </div>
    );
  };

  const sliderSettings = {
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    infinite: false,
    initialSlide: 0,
    slidesPerRow: itemsPerPage,
    variableWidth: false,
    beforeChange: (oldIndex, newIndex) => {
      setCurrentSlide(newIndex);
    },
  };

  useEffect(() => {
    let unmounted = false;

    const SyncConfig = async () => {
      const defaultLanguage = i18n.language ? i18n.language : DEFAULT_LANGUAGE_CODE;
      const { currency } = session;
      const { disableDefaultClientMemo, analyticsDisabled } = session.wallet.config;

      const autoUpdateExpireTime = await ipcRenderer.invoke('get_auto_update_expire_time');

      if (!unmounted) {
        setDefaultLanguageState(defaultLanguage);
        setDefaultCurrencyState(currency);
        setDefaultMemoStateDisabled(disableDefaultClientMemo);
        setDefaultGAStateDisabled(analyticsDisabled);
        setDefaultAutoUpdateDisabled(autoUpdateExpireTime > 0);
        setDefaultAutoUpdateExpireTime(autoUpdateExpireTime);

        const currencies: SupportedCurrency[] = [];
        SUPPORTED_CURRENCY.forEach((item: SupportedCurrency) => {
          currencies.push(item);
        });
        setSupportedCurrencies(currencies);
      }
    };

    if (!didMountRef.current) {
      SyncConfig();
      didMountRef.current = true;
    }

    return () => {
      unmounted = true;
    };
  }, [
    defaultLanguageState,
    setDefaultLanguageState,
    defaultCurrencyState,
    setDefaultCurrencyState,
    defaultMemoStateDisabled,
    setDefaultMemoStateDisabled,
    defaultGAStateDisabled,
    setDefaultGAStateDisabled,
    defaultAutoUpdateDisabled,
    setDefaultAutoUpdateDisabled,
  ]);

  const onSwitchLanguage = value => {
    setDefaultLanguageState(value!.toString());
    i18n.changeLanguage(value!.toString());
    generalConfigService.setLanguage(value!.toString());
    setMomentLocale();
  };

  const onSwitchAutoUpdateDuration = value => {
    setAutoUpdateDisableDuration(value);
  };

  const onSwitchCurrency = async value => {
    if (session.currency === value.toString()) {
      return;
    }

    setUpdateLoading(true);

    const newSession = {
      ...session,
      currency: value.toString(),
    };
    await walletService.setCurrentSession(newSession);
    setSession(newSession);

    await walletService.loadAndSaveAssetPrices(newSession);

    // const currentMarketData = await walletService.retrieveAssetPrice(
    //   'CRO',
    //   newSession.currency,
    // );

    // eslint-disable-next-line
    const allMarketData = await walletService.retrieveAllAssetsPrices(newSession.currency);

    setAllMarketData(allMarketData);
    // setMarketData(currentMarketData);
    setDefaultCurrencyState(value.toString());

    setUpdateLoading(false);
  };

  const showPasswordInput = () => {
    setInputPasswordVisible(true);
  };

  const onWalletDecryptFinish = async (password: string) => {
    const phraseDecrypted = await secretStoreService.decryptPhrase(
      password,
      session.wallet.identifier,
    );
    setDecryptedPhrase(phraseDecrypted);

    setInputPasswordVisible(false);
    setIsExportRecoveryPhraseModalVisible(true);
  };

  async function onAllowDefaultMemoChange() {
    setUpdateLoading(true);

    const newState = !defaultMemoStateDisabled;
    setDefaultMemoStateDisabled(newState);

    const disableMemoSettingsUpdate: DisableDefaultMemoSettings = {
      walletId: session.wallet.identifier,
      disableDefaultMemoAppend: newState,
    };

    await walletService.updateDefaultMemoDisabledSettings(disableMemoSettingsUpdate);

    const updatedWallet = await walletService.findWalletByIdentifier(session.wallet.identifier);
    const newSession = {
      ...session,
      wallet: updatedWallet,
    };
    await walletService.setCurrentSession(newSession);
    setSession(newSession);

    setUpdateLoading(false);
    message.success(
      `${t('settings.message.defaultMemo1')} ${
        newState ? t('general.disabled') : t('general.enabled')
      }`,
    );
  }

  async function onAllowDefaultGAChange() {
    setUpdateLoading(true);

    const newState = !defaultGAStateDisabled;
    setDefaultGAStateDisabled(newState);

    const disableGASettingsUpdate: DisableGASettings = {
      walletId: session.wallet.identifier,
      analyticsDisabled: newState,
    };

    await walletService.updateGADisabledSettings(disableGASettingsUpdate);

    const updatedWallet = await walletService.findWalletByIdentifier(session.wallet.identifier);
    const newSession = {
      ...session,
      wallet: updatedWallet,
    };
    await walletService.setCurrentSession(newSession);
    setSession(newSession);

    setUpdateLoading(false);
    message.success(
      `${t('settings.message.analytics1')} ${
        newState ? t('general.disabled') : t('general.enabled')
      }`,
    );
  }

  async function onAllowAutoUpdateChange() {
    setUpdateLoading(true);

    const newState = !defaultAutoUpdateDisabled;
    setDefaultAutoUpdateDisabled(newState);

    const expireTime = newState
      ? new Date().setDate(new Date().getDate() + autoUpdateDisableDuration)
      : 0;
    setDefaultAutoUpdateExpireTime(expireTime);

    ipcRenderer.send('set_auto_update_expire_time', expireTime);

    setUpdateLoading(false);
    message.success(
      `${t('settings.message.autoUpdate1')} ${
        newState ? t('general.disabled') : t('general.enabled')
      }`,
    );
  }

  const onCopyClick = () => {
    setTimeout(() => {
      notification.success({
        message: t('settings.notification.recover.message'),
        description: t('settings.notification.recover.description'),
        placement: 'topRight',
        duration: 2,
        key: 'copy',
      });
    }, 100);
  };

  const onExportRecoveryPhraseCancel = () => {
    setIsExportRecoveryPhraseModalVisible(false);
    setDecryptedPhrase('');
    recoveryPhraseSlider?.goTo(0);
  };

  return (
    <div>
      <div className="site-layout-background settings-content">
        <div className="container">
          <div className="item">
            <div className="title">{t('settings.language.title')}</div>
            {/* <div className="description">
              </div> */}
            <Select style={{ width: 240 }} onChange={onSwitchLanguage} value={defaultLanguageState}>
              {SUPPORTED_LANGUAGE.map(item => {
                return (
                  <Option value={item.value} key={item.value}>
                    {item.label}
                  </Option>
                );
              })}
            </Select>
          </div>
          <Divider />
          <div className="item">
            <div className="title">{t('settings.currency.title')}</div>
            {/* <div className="description">
              </div> */}
            <Select style={{ width: 240 }} onChange={onSwitchCurrency} value={defaultCurrencyState}>
              {supportedCurrencies.map(item => {
                return (
                  <Option value={item.value} key={item.value}>
                    {item.label}
                  </Option>
                );
              })}
            </Select>
          </div>
          <Divider />
          <div className="item">
            <div className="title">{t('settings.memo.title')}</div>
            <div className="description">{t('settings.memo.description')}</div>
            <Switch
              checked={!defaultMemoStateDisabled}
              onChange={onAllowDefaultMemoChange}
              disabled={updateLoading}
            />{' '}
            {defaultMemoStateDisabled ? t('general.disabled') : t('general.enabled')}
          </div>
          <Divider />
          <div className="item">
            <div className="title">{t('settings.dataAnalytics.title')}</div>
            <div className="description">{t('settings.dataAnalytics.description')}</div>
            <Switch
              checked={!defaultGAStateDisabled}
              onChange={onAllowDefaultGAChange}
              disabled={updateLoading}
            />{' '}
            {defaultGAStateDisabled ? t('general.disabled') : t('general.enabled')}
          </div>
          <div className="item">
            <div className="title">{t('settings.autoUpdate.title')}</div>
            <div className="description">{t('settings.autoUpdate.description')}</div>
            {defaultAutoUpdateDisabled && defaultAutoUpdateExpireTime ? (
              <div className="description">
                {t('settings.autoUpdate.expire')}:{' '}
                {new Date(defaultAutoUpdateExpireTime).toLocaleString()}
              </div>
            ) : (
              <></>
            )}
            <Switch
              checked={!defaultAutoUpdateDisabled}
              onChange={onAllowAutoUpdateChange}
              disabled={updateLoading}
            />{' '}
            {defaultAutoUpdateDisabled ? t('general.disabled') : t('general.enabled')}{' '}
            {!defaultAutoUpdateDisabled || !defaultAutoUpdateExpireTime ? (
              <Select
                className="auto-update-duration"
                onChange={onSwitchAutoUpdateDuration}
                value={autoUpdateDisableDuration}
              >
                {AUTO_UPDATE_DISABLE_DURATIONS.map(duration => {
                  return (
                    <Option value={duration} key={duration}>
                      {t('settings.autoUpdate.duration', { duration })}
                    </Option>
                  );
                })}
              </Select>
            ) : (
              <></>
            )}
          </div>
          {walletType !== LEDGER_WALLET_TYPE ? (
            <>
              <Divider />
              <div className="item">
                <div className="title">{t('settings.exportRecoveryPhrase.title')}</div>
                <div className="description">{t('settings.exportRecoveryPhrase.description')}</div>
                <Button
                  type="primary"
                  onClick={() => {
                    showPasswordInput();
                  }}
                >
                  {t('settings.exportRecoveryPhrase.button')}
                </Button>
              </div>
            </>
          ) : (
            <></>
          )}
        </div>
      </div>
      <PasswordFormModal
        description={t('general.passwordFormModal.description')}
        okButtonText={t('general.passwordFormModal.okButton')}
        onCancel={() => {
          setInputPasswordVisible(false);
        }}
        onSuccess={onWalletDecryptFinish}
        onValidatePassword={async (password: string) => {
          const isValid = await secretStoreService.checkIfPasswordIsValid(password);
          return {
            valid: isValid,
            errMsg: !isValid ? t('general.passwordFormModal.error') : '',
          };
        }}
        successText={t('general.passwordFormModal.success')}
        title={t('general.passwordFormModal.title')}
        visible={inputPasswordVisible}
        successButtonText={t('general.continue')}
        confirmPassword={false}
        // repeatValidation
      />
      <ModalPopup
        className="export-recovery-phrase-modal"
        isModalVisible={isExportRecoveryPhraseModalVisible}
        handleCancel={onExportRecoveryPhraseCancel}
        handleOk={() => setIsExportRecoveryPhraseModalVisible(false)}
        footer={[
          <CopyToClipboard key="copy" text={decryptedPhrase}>
            <Button type="primary" onClick={onCopyClick}>
              {t('general.copy')}
            </Button>
          </CopyToClipboard>,
          <Button key="back" type="link" onClick={onExportRecoveryPhraseCancel}>
            {t('general.close')}
          </Button>,
        ]}
        okText={t('general.confirm')}
        title={t('settings.exportRecoveryPhrase.modal1.title')}
      >
        <>
          <div className="description">{t('settings.exportRecoveryPhrase.modal1.description')}</div>
          <div className="item">
            <Carousel
              className="recovery-phrase-slider"
              arrows
              {...sliderSettings}
              ref={slider => {
                recoveryPhraseSlider = slider;
              }}
            >
              {decryptedPhrase?.split(' ').map((item, index) => {
                return (
                  <div className="page" key={index}>
                    <div>
                      <div className="phrase">
                        <span>{index + 1}. </span>
                        {item}
                      </div>
                    </div>
                  </div>
                );
              })}
            </Carousel>
          </div>
          <div className="item phrase-block-container">
            {decryptedPhrase?.split(' ').map((item, index) => {
              const isCurrent =
                index >= currentSlide * itemsPerPage && index < (currentSlide + 1) * itemsPerPage;
              return (
                <div
                  className={`phrase-block ${isCurrent ? 'current' : ''}`}
                  onClick={() => {
                    recoveryPhraseSlider?.goTo(Math.floor(index / Math.max(1, itemsPerPage)));
                  }}
                  key={index + 1}
                >
                  {index + 1}
                </div>
              );
            })}
          </div>
          <div className="item">
            <Alert
              type="warning"
              message={t('settings.exportRecoveryPhrase.modal1.warning')}
              showIcon
            />
          </div>
        </>
      </ModalPopup>
    </div>
  );
}
