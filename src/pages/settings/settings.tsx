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
  Carousel,
  notification,
} from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { CarouselRef } from 'antd/lib/carousel';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import { sessionState, walletListState } from '../../recoil/atom';
import { walletService } from '../../service/WalletService';
import { secretStoreService } from '../../storage/SecretStoreService';
import {
  DisableDefaultMemoSettings,
  DisableGASettings,
  EnableGeneralSettingsPropagation,
  SettingsDataUpdate,
} from '../../models/Wallet';
import { Session } from '../../models/Session';
import ModalPopup from '../../components/ModalPopup/ModalPopup';
import PasswordFormModal from '../../components/PasswordForm/PasswordFormModal';

import { FIXED_DEFAULT_FEE, FIXED_DEFAULT_GAS_LIMIT } from '../../config/StaticConfig';
import { AnalyticsService } from '../../service/analytics/AnalyticsService';
// import { splitToChunks } from '../../utils/utils';

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
  const [session, setSession] = useRecoilState(sessionState);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [enabledGeneralSettings, setEnabledGeneralSettings] = useState<boolean>(false);
  const didMountRef = useRef(false);
  const analyticsService = new AnalyticsService(session);

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
          Propagate the settings changes to all your other wallets on {session.wallet.config.name}
        </Checkbox>
      </div>
    </>
  );
};

function MetaInfoComponent() {
  const [session, setSession] = useRecoilState(sessionState);
  const [updateLoading, setUpdateLoading] = useState(false);

  const [defaultMemoStateDisabled, setDefaultMemoStateDisabled] = useState<boolean>(false);
  const [defaultGAStateDisabled, setDefaultGAStateDisabled] = useState<boolean>(false);

  const [inputPasswordVisible, setInputPasswordVisible] = useState<boolean>(false);
  const [decryptedPhrase, setDecryptedPhrase] = useState<string>();
  // const [decryptedPhraseArray, setDecryptedPhraseArray] = useState<string[][]>([[]]);
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

  // const perPage = 1;

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

  const onCopyClick = () => {
    setTimeout(() => {
      notification.success({
        message: `Recovery Phrase Copied!`,
        description: `Recovery Phrase is successfully copied to your clipboard`,
        placement: 'topRight',
        duration: 2,
        key: 'copy',
      });
    }, 100);
  };

  useEffect(() => {
    let unmounted = false;

    const SyncConfig = async () => {
      const defaultMemoDisabled = session.wallet.config.disableDefaultClientMemo;
      const defaultGADisabled = session.wallet.config.analyticsDisabled;
      if (!unmounted) {
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

  const showPasswordInput = () => {
    setInputPasswordVisible(true);
  };

  const onWalletDecryptFinish = async (password: string) => {
    const phraseDecrypted = await secretStoreService.decryptPhrase(
      password,
      session.wallet.identifier,
    );
    setDecryptedPhrase(phraseDecrypted);
    // setDecryptedPhraseArray(splitToChunks(phraseDecrypted.split(' '), perPage));

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
            <div className="title">Default Memo</div>
            <div className="description">
              A default memo message will be used for staking transactions if a custom memo is not
              provided.
            </div>
            <Switch
              checked={!defaultMemoStateDisabled}
              onChange={onAllowDefaultMemoChange}
              disabled={updateLoading}
            />{' '}
            {defaultMemoStateDisabled ? 'Disabled' : 'Enabled'}
          </div>
          <Divider />
          <div className="item">
            <div className="title">Data Analytics</div>
            <div className="description">
              The data collected for analytics is used to prioritize development for new features
              and functionalities and also to improve implemented features.
            </div>
            <Switch
              checked={!defaultGAStateDisabled}
              onChange={onAllowDefaultGAChange}
              disabled={updateLoading}
            />{' '}
            {defaultGAStateDisabled ? 'Disabled' : 'Enabled'}
          </div>
          <Divider />
          <div className="item">
            <div className="title">Export your Recovery Phrase</div>
            <div className="description">
              You are required to enter your App Password for this action.
            </div>
            <Button
              type="primary"
              onClick={() => {
                showPasswordInput();
              }}
            >
              Export
            </Button>
          </div>
        </div>
      </div>
      <PasswordFormModal
        description="Input the app password decrypt wallet"
        okButtonText="Decrypt wallet"
        onCancel={() => {
          setInputPasswordVisible(false);
        }}
        onSuccess={onWalletDecryptFinish}
        onValidatePassword={async (password: string) => {
          const isValid = await secretStoreService.checkIfPasswordIsValid(password);
          return {
            valid: isValid,
            errMsg: !isValid ? 'The password provided is incorrect, Please try again' : '',
          };
        }}
        successText="Wallet decrypted successfully !"
        title="Provide app password"
        visible={inputPasswordVisible}
        successButtonText="Continue"
        confirmPassword={false}
        repeatValidation
      />
      <ModalPopup
        className="export-recovery-phrase-modal"
        isModalVisible={isExportRecoveryPhraseModalVisible}
        handleCancel={() => {
          setIsExportRecoveryPhraseModalVisible(false);
          recoveryPhraseSlider?.goTo(0);
        }}
        handleOk={() => setIsExportRecoveryPhraseModalVisible(false)}
        // confirmationLoading={isButtonLoading}
        // closable={!isButtonLoading}
        footer={[
          <CopyToClipboard key="copy" text={decryptedPhrase}>
            <Button
              type="primary"
              onClick={() => {
                onCopyClick();
              }}
            >
              Copy
            </Button>
          </CopyToClipboard>,
          <Button
            key="back"
            type="link"
            onClick={() => {
              setIsExportRecoveryPhraseModalVisible(false);
              recoveryPhraseSlider?.goTo(0);
            }}
            // hidden={isConfirmClearVisible}
            // disabled={isButtonDisabled}
          >
            Close
          </Button>,
        ]}
        okText="Confirm"
        title="Your Recovery Phrases"
      >
        <>
          {/* <div className="title"></div> */}
          <div className="description">
            Swipe to reveal all words. Write them down in the right order.
          </div>
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
                >
                  {index + 1}
                </div>
              );
            })}
          </div>
          <div className="item">
            <Alert
              type="warning"
              message="Protect your funds and do not share your recovery phrase with anyone."
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
        <TabPane tab="General Configuration" key="2">
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
                          pattern: /^CLEAR$/,
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
