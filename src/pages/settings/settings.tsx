import React, { useEffect, useState, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import './settings.less';
import 'antd/dist/antd.css';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
} from 'antd';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { useTranslation } from 'react-i18next';
import { sessionState, walletListState } from '../../recoil/atom';
import { walletService } from '../../service/WalletService';
import {
  DisableDefaultMemoSettings,
  DisableGASettings,
  EnableGeneralSettingsPropagation,
  SettingsDataUpdate,
} from '../../models/Wallet';
import { Session } from '../../models/Session';
import ModalPopup from '../../components/ModalPopup/ModalPopup';

import {
  DEFAULT_LANGUAGE_CODE,
  FIXED_DEFAULT_FEE,
  FIXED_DEFAULT_GAS_LIMIT,
} from '../../config/StaticConfig';
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
  const [updateLoading, setUpdateLoading] = useState(false);
  const [enabledGeneralSettings, setEnabledGeneralSettings] = useState<boolean>(false);
  const didMountRef = useRef(false);
  const analyticsService = new AnalyticsService(session);

  const [t] = useTranslation();

  useEffect(() => {
    let unmounted = false;

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
  }, [enabledGeneralSettings, setEnabledGeneralSettings]);

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
      `General settings propagation has been ${newState ? 'enabled' : 'disabled'} successfully`,
    );
    setUpdateLoading(false);
  }

  return (
    <>
      <Form.Item
        name="nodeUrl"
        label={t('settings.form1.nodeUrl.label')}
        hasFeedback
        rules={[
          {
            required: true,
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
          { required: true, message: t('settings.form1.indexingUrl.error1') },
          {
            pattern: /(https?:\/\/)?[\w\-~]+(\.[\w\-~]+)+(\/[\w\-~]*)*(#[\w-]*)?(\?.*)?/,
            message: t('settings.form1.indexingUrl.error2'),
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
            message: t('settings.form1.chainId.error1'),
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
              message: t('settings.form1.networkFee.error1'),
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
              message: t('settings.form1.gasLimit.error1'),
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
          Propagate the settings changes to all your other wallets on {session.wallet.config.name}
        </Checkbox>
      </div>
    </>
  );
};

function MetaInfoComponent() {
  const [session, setSession] = useRecoilState(sessionState);
  const [updateLoading, setUpdateLoading] = useState(false);

  const [defaultLanguageState, setDefaultLanguageState] = useState<string>(DEFAULT_LANGUAGE_CODE);
  const [defaultMemoStateDisabled, setDefaultMemoStateDisabled] = useState<boolean>(false);
  const [defaultGAStateDisabled, setDefaultGAStateDisabled] = useState<boolean>(false);
  const [t, i18n] = useTranslation();

  const didMountRef = useRef(false);

  useEffect(() => {
    let unmounted = false;

    const SyncConfig = async () => {
      const defaultLanguage = await generalConfigService.getLanguage();
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
      `Default client memo settings has been ${newState ? 'disabled' : 'enabled'} successfully`,
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
      `Analytics settings has been ${newState ? 'disabled' : 'enabled'} successfully`,
    );
  }

  return (
    <div>
      <div className="site-layout-background settings-content">
        <div className="container">
          <div className="item">
            <div className="title">{t('settings.language.title')}</div>
            {/* <div className="description">
            </div> */}
            <Select style={{ width: 240 }} onChange={onSwitchLanguage} value={defaultLanguageState}>
              <Option value="enUs">English</Option>
              <Option value="zhHk">中文</Option>
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
        </div>
      </div>
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
      `Wallet settings updated successfully ${
        session.wallet.config.enableGeneralSettings
          ? `on all ${session.wallet.config.name} wallets`
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
    // setIsConfirmationModalVisible(false);
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
              <Button
                key="back"
                type="link"
                onClick={handleCancelConfirmationModal}
                // hidden={isConfirmClearVisible}
              >
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
                      label={t('settings.clearStorage.modal.form1.clear.label')}
                      hasFeedback
                      rules={[
                        {
                          required: true,
                        },
                        {
                          pattern: /^CLEAR$/,
                          message: t('settings.clearStorage.modal.form1.clear.error1'),
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
