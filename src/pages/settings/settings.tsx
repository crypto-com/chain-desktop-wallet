import React, { useEffect, useState, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import './settings.less';
import 'antd/dist/antd.css';
import {
  Button,
  Form,
  Input,
  Layout,
  Tabs,
  Alert,
  Checkbox,
  InputNumber,
  message,
  Switch,
  Divider,
  Select,
  Carousel,
  Avatar,
  notification,
} from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useRecoilState, useSetRecoilState, useRecoilValue } from 'recoil';
import { useTranslation } from 'react-i18next';
import { CarouselRef } from 'antd/lib/carousel';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import { sessionState, walletListState, walletAllAssetsState } from '../../recoil/atom';
import { walletService } from '../../service/WalletService';
import { secretStoreService } from '../../storage/SecretStoreService';
import {
  DisableDefaultMemoSettings,
  DisableGASettings,
  EnableGeneralSettingsPropagation,
  SettingsDataUpdate,
} from '../../models/Wallet';
import { Session } from '../../models/Session';
// import { UserAsset } from '../../models/UserAsset';
import ModalPopup from '../../components/ModalPopup/ModalPopup';
import PasswordFormModal from '../../components/PasswordForm/PasswordFormModal';

import {
  DEFAULT_LANGUAGE_CODE,
  SUPPORTED_LANGUAGE,
  FIXED_DEFAULT_FEE,
  FIXED_DEFAULT_GAS_LIMIT,
} from '../../config/StaticConfig';
import { LEDGER_WALLET_TYPE } from '../../service/LedgerService';
import { AnalyticsService } from '../../service/analytics/AnalyticsService';
import { generalConfigService } from '../../storage/GeneralConfigService';

const { Header, Content, Footer } = Layout;
const { TabPane } = Tabs;
const { Option } = Select;
const layout = {
  // labelCol: { span: 8 },
  // wrapperCol: { span: 16 },
};
const tailLayout = {
  // wrapperCol: { offset: 8, span: 16 },
};

const GeneralSettingsForm = () => {
  const [session, setSession] = useRecoilState(sessionState);
  const walletAllAssets = useRecoilValue(walletAllAssetsState);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [enabledGeneralSettings, setEnabledGeneralSettings] = useState<boolean>(false);
  const didMountRef = useRef(false);
  const analyticsService = new AnalyticsService(session);
  const locationState: any = useLocation().state;
  const [currentAssetIdentifier, setCurrentAssetIdentifier] = useState<string>(
    locationState ? locationState.currentAsset.identifier : walletAllAssets[0].identifier,
  );

  const [t] = useTranslation();

  useEffect(() => {
    let unmounted = false;

    setCurrentAssetIdentifier(
      locationState ? locationState.currentAsset.identifier : walletAllAssets[0].identifier,
    );

    const SyncConfig = async () => {
      const enabledGeneralWalletsSettings: boolean = session.wallet.config.enableGeneralSettings;
      if (!unmounted) {
        setEnabledGeneralSettings(enabledGeneralWalletsSettings);
      }
    };

    if (!didMountRef.current) {
      SyncConfig();
      didMountRef.current = true;
      analyticsService.logPage('Settings');
    }

    return () => {
      unmounted = true;
    };
  }, [
    walletAllAssets,
    currentAssetIdentifier,
    setCurrentAssetIdentifier,
    enabledGeneralSettings,
    setEnabledGeneralSettings,
  ]);

  async function onEnableGeneralWalletConfig() {
    setUpdateLoading(true);
    const newState = !enabledGeneralSettings;
    setEnabledGeneralSettings(newState);

    const enableGeneralSettingsPropagation: EnableGeneralSettingsPropagation = {
      networkName: session.wallet.config.name,
      enabledGeneralSettings: newState,
    };

    await walletService.updateGeneralSettingsPropagation(enableGeneralSettingsPropagation);

    const updatedWallet = await walletService.findWalletByIdentifier(session.wallet.identifier);
    const newSession = new Session(updatedWallet);
    await walletService.setCurrentSession(newSession);

    setSession(newSession);
    message.success(
      `${t('settings.message.generalSettings1')} ${
        newState ? t('general.enabled') : t('general.disabled')
      }`,
    );
    setUpdateLoading(false);
  }

  const assetIcon = asset => {
    const { icon_url, symbol } = asset;

    return icon_url ? (
      <img src={icon_url} alt="cronos" className="asset-icon" />
    ) : (
      <Avatar>{symbol[0].toUpperCase()}</Avatar>
    );
  };

  const onSwitchAsset = value => {
    setCurrentAssetIdentifier(value!.toString());
  };

  return (
    <>
      <Form.Item
        name="asset"
        label={t('settings.form1.asset.label')}
        rules={[
          {
            required: true,
            message: `${t('settings.form1.asset.label')} ${t('general.required')}`,
          },
        ]}
        initialValue={currentAssetIdentifier}
      >
        <Select style={{ width: 240 }} onChange={onSwitchAsset} value={currentAssetIdentifier}>
          {walletAllAssets.map(asset => {
            return (
              <Option value={asset.identifier.toString()} key={asset.identifier.toString()}>
                {assetIcon(asset)}
                {`${asset.name} (${asset.symbol})`}
              </Option>
            );
          })}
        </Select>
      </Form.Item>
      <Form.Item
        name="nodeUrl"
        label={t('settings.form1.nodeUrl.label')}
        hasFeedback
        rules={[
          {
            required: true,
            message: `${t('settings.form1.nodeUrl.label')} ${t('general.required')}`,
          },
          {
            pattern: /(https?:\/\/)?[\w\-~]+(\.[\w\-~]+)+(\/[\w\-~]*)*(#[\w-]*)?(\?.*)?/,
            message: t('settings.form1.nodeUrl.error1'),
          },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="indexingUrl"
        label={t('settings.form1.indexingUrl.label')}
        hasFeedback
        rules={[
          {
            required: true,
            message: `${t('settings.form1.indexingUrl.label')} ${t('general.required')}`,
          },
          {
            pattern: /(https?:\/\/)?[\w\-~]+(\.[\w\-~]+)+(\/[\w\-~]*)*(#[\w-]*)?(\?.*)?/,
            message: t('settings.form1.indexingUrl.error1'),
          },
        ]}
      >
        <Input placeholder={t('settings.form1.indexingUrl.label')} />
      </Form.Item>
      <Form.Item
        name="chainId"
        label={t('settings.form1.chainId.label')}
        hasFeedback
        rules={[
          {
            required: true,
            message: `${t('settings.form1.chainId.label')} ${t('general.required')}`,
          },
        ]}
      >
        <Input />
      </Form.Item>
      <div className="row">
        <Form.Item
          name="networkFee"
          label={t('settings.form1.networkFee.label')}
          hasFeedback
          rules={[
            {
              required: true,
              message: `${t('settings.form1.networkFee.label')} ${t('general.required')}`,
            },
          ]}
        >
          <InputNumber precision={0} min={1} />
        </Form.Item>
        <Form.Item
          name="gasLimit"
          label={t('settings.form1.gasLimit.label')}
          hasFeedback
          rules={[
            {
              required: true,
              message: `${t('settings.form1.gasLimit.label')} ${t('general.required')}`,
            },
          ]}
        >
          <InputNumber precision={0} min={1} />
        </Form.Item>
      </div>
      <div className="item">
        <Checkbox
          checked={enabledGeneralSettings}
          onChange={onEnableGeneralWalletConfig}
          disabled={updateLoading}
        >
          {t('settings.form1.checkbox1.description1')} {session.wallet.config.name}{' '}
          {t('settings.form1.checkbox1.description2')}
        </Checkbox>
      </div>
    </>
  );
};

function MetaInfoComponent() {
  const [session, setSession] = useRecoilState(sessionState);
  const [updateLoading, setUpdateLoading] = useState(false);
  const { walletType } = session.wallet;

  const [defaultLanguageState, setDefaultLanguageState] = useState<string>(DEFAULT_LANGUAGE_CODE);
  const [defaultMemoStateDisabled, setDefaultMemoStateDisabled] = useState<boolean>(false);
  const [defaultGAStateDisabled, setDefaultGAStateDisabled] = useState<boolean>(false);
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
      const defaultMemoDisabled = session.wallet.config.disableDefaultClientMemo;
      const defaultGADisabled = session.wallet.config.analyticsDisabled;
      if (!unmounted) {
        setDefaultLanguageState(defaultLanguage);
        setDefaultMemoStateDisabled(defaultMemoDisabled);
        setDefaultGAStateDisabled(defaultGADisabled);
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
    defaultMemoStateDisabled,
    setDefaultMemoStateDisabled,
    defaultGAStateDisabled,
    setDefaultGAStateDisabled,
  ]);

  const onSwitchLanguage = value => {
    setDefaultLanguageState(value!.toString());
    i18n.changeLanguage(value!.toString());
    generalConfigService.setLanguage(value!.toString());
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
    const newSession = new Session(updatedWallet);
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
    const newSession = new Session(updatedWallet);
    await walletService.setCurrentSession(newSession);

    setSession(newSession);
    setUpdateLoading(false);
    message.success(
      `${t('settings.message.analytics1')} ${
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
        repeatValidation
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

const FormSettings = () => {
  const [form] = Form.useForm();
  const [confirmClearForm] = Form.useForm();
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [isConfirmationModalVisible, setIsConfirmationModalVisible] = useState(false);
  const [isConfirmClearVisible, setIsConfirmClearVisible] = useState(false);
  const [session, setSession] = useRecoilState(sessionState);
  const defaultSettings = session.wallet.config;
  const didMountRef = useRef(false);
  const history = useHistory();

  const setWalletList = useSetRecoilState(walletListState);

  const [t] = useTranslation();

  let networkFee = FIXED_DEFAULT_FEE;
  let gasLimit = FIXED_DEFAULT_GAS_LIMIT;

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;

      if (defaultSettings.fee !== undefined) {
        networkFee = defaultSettings.fee.networkFee;
      }
      if (defaultSettings.fee !== undefined) {
        gasLimit = defaultSettings.fee.gasLimit;
      }

      form.setFieldsValue({
        nodeUrl: defaultSettings.nodeUrl,
        chainId: defaultSettings.network.chainId,
        indexingUrl: defaultSettings.indexingUrl,
        networkFee,
        gasLimit,
      });
    }
  }, [form, defaultSettings]);

  const onFinish = async values => {
    const defaultGasLimit =
      defaultSettings.fee !== undefined ? defaultSettings.fee.gasLimit : FIXED_DEFAULT_GAS_LIMIT;
    const defaultNetworkFee =
      defaultSettings.fee !== undefined ? defaultSettings.fee.networkFee : FIXED_DEFAULT_FEE;

    if (
      defaultSettings.nodeUrl === values.nodeUrl &&
      defaultSettings.indexingUrl === values.indexingUrl &&
      defaultSettings.network.chainId === values.chainId &&
      defaultGasLimit === values.gasLimit &&
      defaultNetworkFee === values.networkFee
    ) {
      // No value was updated, we stop here
      return;
    }
    setIsButtonLoading(true);
    const settingsDataUpdate: SettingsDataUpdate = {
      walletId: session.wallet.identifier,
      chainId: values.chainId,
      nodeUrl: values.nodeUrl,
      indexingUrl: values.indexingUrl,
      networkFee: String(values.networkFee),
      gasLimit: String(values.gasLimit),
    };

    await walletService.updateWalletNodeConfig(settingsDataUpdate);
    const updatedWallet = await walletService.findWalletByIdentifier(session.wallet.identifier);
    const newSession = new Session(updatedWallet);
    await walletService.setCurrentSession(newSession);
    setSession(newSession);

    const allNewUpdatedWallets = await walletService.retrieveAllWallets();
    setWalletList(allNewUpdatedWallets);

    setIsButtonLoading(false);
    message.success(
      `${t('settings.message.success1')} ${
        session.wallet.config.enableGeneralSettings
          ? `(${t('settings.message.success2')} ${session.wallet.config.name} ${t(
              'settings.message.success3',
            )})`
          : ''
      }`,
    );
  };

  const onRestoreDefaults = () => {
    form.setFieldsValue({
      nodeUrl: defaultSettings.nodeUrl,
      chainId: defaultSettings.network.chainId,
      indexingUrl: defaultSettings.indexingUrl,
      networkFee:
        defaultSettings.fee && defaultSettings.fee.networkFee ? defaultSettings.fee.networkFee : '',
      gasLimit:
        defaultSettings.fee && defaultSettings.fee.gasLimit ? defaultSettings.fee.gasLimit : '',
    });
  };

  const handleCancelConfirmationModal = () => {
    if (!isButtonLoading) {
      setIsConfirmationModalVisible(false);
      setIsConfirmClearVisible(false);
    }
  };

  const onConfirmClear = () => {
    setIsButtonLoading(true);
    indexedDB.deleteDatabase('NeDB');
    setTimeout(() => {
      history.replace('/');
      history.go(0);
    }, 2000);
  };

  return (
    <Form
      {...layout}
      layout="vertical"
      form={form}
      name="control-hooks"
      requiredMark="optional"
      onFinish={onFinish}
    >
      <Tabs defaultActiveKey="1">
        <TabPane tab={t('settings.tab1')} key="1">
          <div className="site-layout-background settings-content">
            <div className="container">
              <GeneralSettingsForm />
              <Form.Item {...tailLayout} className="button">
                <Button type="primary" htmlType="submit" loading={isButtonLoading}>
                  {t('general.save')}
                </Button>
                <Button type="link" htmlType="button" onClick={onRestoreDefaults}>
                  {t('general.discard')}
                </Button>
              </Form.Item>
            </div>
          </div>
        </TabPane>
        <TabPane tab={t('settings.tab2')} key="2">
          <MetaInfoComponent />
        </TabPane>
        <TabPane tab={t('settings.tab3')} key="3">
          <div className="site-layout-background settings-content">
            <div className="container">
              <div className="description">{t('settings.clearStorage.description')}</div>
              <Button
                type="primary"
                loading={isButtonLoading}
                onClick={() => setIsConfirmationModalVisible(true)}
                danger
              >
                {t('settings.clearStorage.button1')}
              </Button>
            </div>
          </div>
          <ModalPopup
            isModalVisible={isConfirmationModalVisible}
            handleCancel={handleCancelConfirmationModal}
            handleOk={onConfirmClear}
            confirmationLoading={isButtonLoading}
            closable={!isButtonLoading}
            footer={[
              <Button
                key="submit"
                type="primary"
                loading={isButtonLoading}
                onClick={() => setIsConfirmClearVisible(true)}
                hidden={isConfirmClearVisible}
                disabled={isButtonDisabled}
                danger
              >
                {t('general.confirm')}
              </Button>,
              <Button
                type="primary"
                htmlType="submit"
                loading={isButtonLoading}
                hidden={!isConfirmClearVisible}
                onClick={confirmClearForm.submit}
                danger
              >
                {t('settings.clearStorage.button1')}
              </Button>,

              <Button key="back" type="link" onClick={handleCancelConfirmationModal}>
                {t('general.cancel')}
              </Button>,
            ]}
            okText="Confirm"
          >
            <>
              <div className="title">{t('settings.clearStorage.modal.title')}</div>

              {!isConfirmClearVisible ? (
                <>
                  <div className="description">{t('settings.clearStorage.modal.description1')}</div>
                  <div className="item">
                    <Alert
                      type="warning"
                      message={t('settings.clearStorage.modal.warning')}
                      showIcon
                    />
                  </div>
                  <div className="item">
                    <Checkbox
                      checked={!isButtonDisabled}
                      onChange={() => setIsButtonDisabled(!isButtonDisabled)}
                    >
                      {t('settings.clearStorage.modal.disclaimer')}
                    </Checkbox>
                  </div>
                </>
              ) : (
                <div className="item">
                  <Form
                    {...layout}
                    layout="vertical"
                    form={confirmClearForm}
                    name="control-hooks"
                    requiredMark="optional"
                    onFinish={onConfirmClear}
                  >
                    <Form.Item
                      name="clear"
                      label={`${t('settings.clearStorage.modal.form1.clear.label')} CLEAR`}
                      hasFeedback
                      rules={[
                        {
                          required: true,
                          message: `${t('settings.clearStorage.modal.form1.clear.error1')} CLEAR`,
                        },
                        {
                          pattern: /^CLEAR$/,
                          message: `${t('settings.clearStorage.modal.form1.clear.error1')} CLEAR`,
                        },
                      ]}
                    >
                      <Input />
                    </Form.Item>
                  </Form>
                </div>
              )}
            </>
          </ModalPopup>
        </TabPane>
      </Tabs>
    </Form>
  );
};

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
