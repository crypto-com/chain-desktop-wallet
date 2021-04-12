import React, { useEffect, useState, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import './settings.less';
import 'antd/dist/antd.css';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Button, Form, Input, Layout, Tabs, Alert, Checkbox, InputNumber, message } from 'antd';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { sessionState, walletListState } from '../../recoil/atom';
import { walletService } from '../../service/WalletService';
import {
  DisableDefaultMemoSettings,
  EnableGeneralSettingsPropagation,
  SettingsDataUpdate,
} from '../../models/Wallet';
import { Session } from '../../models/Session';
import ModalPopup from '../../components/ModalPopup/ModalPopup';

import { FIXED_DEFAULT_FEE, FIXED_DEFAULT_GAS_LIMIT } from '../../config/StaticConfig';

const { Header, Content, Footer } = Layout;
const { TabPane } = Tabs;
const layout = {
  // labelCol: { span: 8 },
  // wrapperCol: { span: 16 },
};
const tailLayout = {
  // wrapperCol: { offset: 8, span: 16 },
};

const GeneralSettingsForm = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [session, setSession] = useRecoilState(sessionState);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [enabledGeneralSettings, setEnabledGeneralSettings] = useState<boolean>(false);
  const didMountRef = useRef(false);

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
        label="Node URL"
        hasFeedback
        rules={[
          {
            required: true,
          },
          {
            pattern: /(https?:\/\/)?[\w\-~]+(\.[\w\-~]+)+(\/[\w\-~]*)*(#[\w-]*)?(\?.*)?/,
            message: 'Please enter a valid node url',
          },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="indexingUrl"
        label="Chain Indexing URL"
        hasFeedback
        rules={[
          { required: true, message: 'Chain Indexing URL is required' },
          {
            pattern: /(https?:\/\/)?[\w\-~]+(\.[\w\-~]+)+(\/[\w\-~]*)*(#[\w-]*)?(\?.*)?/,
            message: 'Please enter a valid indexing url',
          },
        ]}
      >
        <Input placeholder="Chain Indexing URL" />
      </Form.Item>
      <Form.Item
        name="chainId"
        label="Chain ID"
        hasFeedback
        rules={[
          {
            required: true,
          },
        ]}
      >
        <Input />
      </Form.Item>
      <div className="row">
        <Form.Item
          name="networkFee"
          label="Network Fee"
          hasFeedback
          rules={[
            {
              required: true,
            },
          ]}
        >
          <InputNumber precision={0} min={1} />
        </Form.Item>
        <Form.Item
          name="gasLimit"
          label="Gas Limit"
          hasFeedback
          rules={[
            {
              required: true,
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
          Propagate the settings changes to all other wallets on {session.wallet.config.name}
        </Checkbox>
      </div>
    </>
  );
};

function MetaInfoComponent() {
  const [session, setSession] = useRecoilState(sessionState);
  const [updateLoading, setUpdateLoading] = useState(false);

  const [defaultMemoStateDisabled, setDefaultMemoStateDisabled] = useState<boolean>(false);
  const didMountRef = useRef(false);

  useEffect(() => {
    let unmounted = false;

    const SyncConfig = async () => {
      const defaultMemoDisabled = session.wallet.config.disableDefaultClientMemo;
      if (!unmounted) {
        setDefaultMemoStateDisabled(defaultMemoDisabled);
      }
    };

    if (!didMountRef.current) {
      SyncConfig();
      didMountRef.current = true;
    }

    return () => {
      unmounted = true;
    };
  }, [defaultMemoStateDisabled, setDefaultMemoStateDisabled]);

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

  return (
    <div>
      <div className="site-layout-background settings-content">
        <div className="container">
          <div className="item">
            <div className="description">
              A default memo message will be used for staking transactions if a custom memo is not
              provided.
            </div>
            <Checkbox
              checked={defaultMemoStateDisabled}
              onChange={onAllowDefaultMemoChange}
              disabled={updateLoading}
            >
              Disable default memo message
            </Checkbox>
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

  let networkFee = FIXED_DEFAULT_FEE;
  let gasLimit = FIXED_DEFAULT_GAS_LIMIT;

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;

      console.log('defaultSettings', defaultSettings);

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
    setIsConfirmationModalVisible(false);
    setIsConfirmClearVisible(false);
  };

  const onConfirmClear = () => {
    setIsConfirmationModalVisible(false);
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
        <TabPane tab="Node Configuration" key="1">
          <div className="site-layout-background settings-content">
            <div className="container">
              <GeneralSettingsForm />
              <Form.Item {...tailLayout} className="button">
                <Button type="primary" htmlType="submit" loading={isButtonLoading}>
                  Save
                </Button>
                <Button type="link" htmlType="button" onClick={onRestoreDefaults}>
                  Discard Changes
                </Button>
              </Form.Item>
            </div>
          </div>
        </TabPane>
        <TabPane tab="Metadata Configuration" key="2">
          <MetaInfoComponent />
        </TabPane>
        <TabPane tab="Clear Storage" key="3">
          <div className="site-layout-background settings-content">
            <div className="container">
              <div className="description">
                Once you clear the storage, you will lose access to all you wallets. The only way to
                regain wallet access is by restoring wallet mnemonic phrase. <br />
              </div>
              <Button
                type="primary"
                loading={isButtonLoading}
                onClick={() => setIsConfirmationModalVisible(true)}
                danger
              >
                Clear Storage
              </Button>
            </div>
          </div>
          <ModalPopup
            isModalVisible={isConfirmationModalVisible}
            handleCancel={handleCancelConfirmationModal}
            handleOk={onConfirmClear}
            confirmationLoading={isButtonLoading}
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
                Confirm
              </Button>,
              <Button
                type="primary"
                htmlType="submit"
                loading={isButtonLoading}
                hidden={!isConfirmClearVisible}
                onClick={confirmClearForm.submit}
                danger
              >
                Clear Storage
              </Button>,
              <Button
                key="back"
                type="link"
                onClick={handleCancelConfirmationModal}
                // hidden={isConfirmClearVisible}
              >
                Cancel
              </Button>,
            ]}
            okText="Confirm"
          >
            <>
              <div className="title">Confirm Clear Storage</div>

              {!isConfirmClearVisible ? (
                <>
                  <div className="description">
                    You may wish to verify your recovery mnemonic phrase before deletion to ensure
                    that you can restore this wallet in the future.
                  </div>
                  <div className="item">
                    <Alert
                      type="warning"
                      message="Are you sure you want to clear the storage? If you have not backed up your wallet mnemonic phrase, you will result in losing your funds forever."
                      showIcon
                    />
                  </div>
                  <div className="item">
                    <Checkbox
                      checked={!isButtonDisabled}
                      onChange={() => setIsButtonDisabled(!isButtonDisabled)}
                    >
                      I understand that the only way to regain access is by restoring wallet
                      mnemonic phrase.
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
                      label="Please enter CLEAR"
                      hasFeedback
                      rules={[
                        {
                          required: true,
                        },
                        {
                          pattern: /CLEAR/,
                          message: 'Please enter CLEAR',
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

function SettingsPage() {
  return (
    <Layout className="site-layout">
      <Header className="site-layout-background">Settings</Header>
      <div className="header-description">
        An invalid configuration might result in wallet malfunction.
      </div>
      <Content>
        <FormSettings />
      </Content>
      <Footer />
    </Layout>
  );
}

export default SettingsPage;
