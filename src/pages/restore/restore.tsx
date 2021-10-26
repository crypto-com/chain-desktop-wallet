import React, { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import './restore.less';
import { Button, Form, Input, Select } from 'antd';
import { FormInstance } from 'antd/lib/form';
import { useTranslation } from 'react-i18next';
import { HDKey } from '../../utils/ChainJsLib';
import { sessionState } from '../../recoil/atom';
import logo from '../../assets/logo-products-chain.svg';
import { walletService } from '../../service/WalletService';
import { WalletImportOptions } from '../../service/WalletImporter';
import { DefaultWalletConfigs } from '../../config/StaticConfig';
import SuccessModalPopup from '../../components/SuccessModalPopup/SuccessModalPopup';
import ErrorModalPopup from '../../components/ErrorModalPopup/ErrorModalPopup';
import BackButton from '../../components/BackButton/BackButton';
import PasswordFormModal from '../../components/PasswordForm/PasswordFormModal';
import { secretStoreService } from '../../storage/SecretStoreService';
import { Session } from '../../models/Session';
import { NORMAL_WALLET_TYPE } from '../../service/LedgerService';
import { AnalyticsService } from '../../service/analytics/AnalyticsService';

const layout = {
  // labelCol: { span: 8 },
  // wrapperCol: { span: 16 },
};
const tailLayout = {
  // wrapperCol: { offset: 8, span: 16 },
};

interface FormCustomConfigProps {
  setIsConnected: (arg: boolean) => void;
  setIsRestoreDisable: (arg: boolean) => void;
  setNetworkConfig: (arg: any) => void;
}

interface FormRestoreProps {
  form: FormInstance;
  isRestoreDisable: boolean;
  isSelectFieldDisable: boolean;
  setIsSelectFieldDisable: (arg: boolean) => void;
  setIsCustomConfig: (arg: boolean) => void;
  setIsConnected: (arg: boolean) => void;
  setIsRestoreDisable: (arg: boolean) => void;
  networkConfig: any;
}

const FormCustomConfig: React.FC<FormCustomConfigProps> = props => {
  const [form] = Form.useForm();
  const [checkingNodeConnection, setCheckingNodeConnection] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);

  const [t] = useTranslation();

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    props.setIsConnected(true);
    props.setIsRestoreDisable(false);
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const showErrorModal = () => {
    setIsErrorModalVisible(true);
  };

  const handleErrorOk = () => {
    setIsErrorModalVisible(false);
  };

  const handleErrorCancel = () => {
    setIsErrorModalVisible(false);
  };

  const checkNodeConnectivity = async () => {
    // TO-DO Node Connectivity check
    form.validateFields().then(async values => {
      setCheckingNodeConnection(true);
      const { nodeUrl } = values;
      const isNodeLive = await walletService.checkNodeIsLive(nodeUrl);
      setCheckingNodeConnection(false);

      if (isNodeLive) {
        showModal();
        props.setNetworkConfig(values);
      } else {
        showErrorModal();
      }
    });
  };

  return (
    <Form
      layout="vertical"
      form={form}
      name="control-ref"
      initialValues={{
        indexingUrl: DefaultWalletConfigs.TestNetConfig.indexingUrl,
      }}
    >
      <Form.Item
        name="nodeUrl"
        label={t('restore.formCustomConfig.nodeUrl.label')}
        hasFeedback
        rules={[
          {
            required: true,
            message: `${t('restore.formCustomConfig.nodeUrl.label')} ${t('general.required')}`,
          },
          {
            type: 'url',
            message: t('restore.formCustomConfig.nodeUrl.error1'),
          },
        ]}
      >
        <Input placeholder={t('restore.formCustomConfig.nodeUrl.label')} />
      </Form.Item>

      <Form.Item
        name="indexingUrl"
        label={t('restore.formCustomConfig.indexingUrl.label')}
        hasFeedback
        rules={[
          {
            required: true,
            message: `${t('restore.formCustomConfig.indexingUrl.label')} ${t('general.required')}`,
          },
          {
            type: 'url',
            message: t('restore.formCustomConfig.indexingUrl.error1'),
          },
        ]}
      >
        <Input placeholder={t('restore.formCustomConfig.indexingUrl.label')} />
      </Form.Item>

      <div className="row">
        <Form.Item
          name="derivationPath"
          label={t('restore.formCustomConfig.derivationPath.label')}
          hasFeedback
          rules={[
            {
              required: true,
              message: `${t('restore.formCustomConfig.derivationPath.label')} ${t(
                'general.required',
              )}`,
            },
            {
              pattern: /^m\/\d+'?\/\d+'?\/\d+'?\/\d+'?\/\d+'?$/,
              message: t('restore.formCustomConfig.derivationPath.error1'),
            },
          ]}
        >
          <Input maxLength={64} placeholder={t('restore.formCustomConfig.derivationPath.label')} />
        </Form.Item>
        <Form.Item
          name="validatorPrefix"
          label={t('restore.formCustomConfig.validatorPrefix.label')}
          hasFeedback
          rules={[
            {
              required: true,
              message: `${t('restore.formCustomConfig.validatorPrefix.label')} ${t(
                'general.required',
              )}`,
            },
          ]}
        >
          <Input placeholder={t('restore.formCustomConfig.validatorPrefix.label')} />
        </Form.Item>
      </div>

      <div className="row">
        <Form.Item
          name="addressPrefix"
          label={t('restore.formCustomConfig.addressPrefix.label')}
          hasFeedback
          rules={[
            {
              required: true,
              message: `${t('restore.formCustomConfig.addressPrefix.label')} ${t(
                'general.required',
              )}`,
            },
          ]}
        >
          <Input placeholder={t('restore.formCustomConfig.addressPrefix.label')} />
        </Form.Item>
        <Form.Item
          name="chainId"
          label={t('restore.formCustomConfig.chainId.label')}
          hasFeedback
          rules={[
            {
              required: true,
              message: `${t('restore.formCustomConfig.chainId.label')} ${t('general.required')}`,
            },
          ]}
        >
          <Input placeholder={t('restore.formCustomConfig.chainId.label')} />
        </Form.Item>
      </div>
      <div className="row">
        <Form.Item
          name="baseDenom"
          label={t('restore.formCustomConfig.baseDenom.label')}
          hasFeedback
          rules={[
            {
              required: true,
              message: `${t('restore.formCustomConfig.baseDenom.label')} ${t('general.required')}`,
            },
          ]}
        >
          <Input placeholder={t('restore.formCustomConfig.baseDenom.label')} />
        </Form.Item>
        <Form.Item
          name="croDenom"
          label={t('restore.formCustomConfig.croDenom.label')}
          hasFeedback
          rules={[
            {
              required: true,
              message: `${t('restore.formCustomConfig.croDenom.label')} ${t('general.required')}`,
            },
          ]}
        >
          <Input placeholder={t('restore.formCustomConfig.croDenom.label')} />
        </Form.Item>
      </div>

      <SuccessModalPopup
        isModalVisible={isModalVisible}
        handleCancel={handleCancel}
        handleOk={handleOk}
        title={t('general.successModalPopup.title')}
        button={
          <Button
            type="primary"
            htmlType="submit"
            onClick={checkNodeConnectivity}
            loading={checkingNodeConnection}
          >
            {t('general.connect')}
          </Button>
        }
        footer={[
          <Button key="submit" type="primary" onClick={handleOk}>
            {t('general.continue')}
          </Button>,
        ]}
      >
        <>
          <div className="description">
            {t('general.successModalPopup.nodeConnect.description')}
          </div>
        </>
      </SuccessModalPopup>
      <ErrorModalPopup
        isModalVisible={isErrorModalVisible}
        handleCancel={handleErrorCancel}
        handleOk={handleErrorOk}
        title={t('general.errorModalPopup.title')}
        footer={[]}
      >
        <>
          <div className="description">{t('general.errorModalPopup.nodeConnect.description')}</div>
        </>
      </ErrorModalPopup>
    </Form>
  );
};

const FormRestore: React.FC<FormRestoreProps> = props => {
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [inputPasswordVisible, setInputPasswordVisible] = useState(false);
  const history = useHistory();

  const [t] = useTranslation();

  const goToHome = () => {
    history.push('/home');
  };

  const showErrorModal = () => {
    setIsErrorModalVisible(true);
  };

  const handleErrorOk = () => {
    setIsErrorModalVisible(false);
  };

  const handleErrorCancel = () => {
    setIsErrorModalVisible(false);
  };

  const onChange = () => {
    const { name, mnemonic } = props.form.getFieldsValue();
    if (name !== '' && mnemonic !== '') {
      props.setIsSelectFieldDisable(false);
    } else {
      props.setIsSelectFieldDisable(true);
    }
  };

  const onNetworkChange = (network: string) => {
    props.form.setFieldsValue({ network });
    if (network === DefaultWalletConfigs.CustomDevNet.name) {
      props.setIsCustomConfig(true);
      props.setIsConnected(false);
      props.setIsRestoreDisable(true);
    }
  };

  const onWalletImportFinish = async (password: string) => {
    setIsButtonLoading(true);
    const { name, mnemonic, network } = props.form.getFieldsValue();
    if (!name || !mnemonic || !network) {
      return;
    }
    const selectedNetworkConfig = walletService.getSelectedNetwork(network, props);
    if (!selectedNetworkConfig) {
      return;
    }

    const importOptions: WalletImportOptions = {
      walletName: name,
      phrase: mnemonic.toString().trim(),
      config: selectedNetworkConfig,
      walletType: NORMAL_WALLET_TYPE,
      addressIndex: 0, // this is for ledger, dummy value
    };
    try {
      const restoreResult = await walletService.restoreWallet(importOptions);

      await walletService.saveAssets(restoreResult.assets);
      await walletService.encryptWalletAndSetSession(password, restoreResult.wallet);

      await walletService.syncAll(new Session(restoreResult.wallet));
      goToHome();
      props.form.resetFields();
      return;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('issue on wallet import', e);
      showErrorModal();
    }
  };

  return (
    <Form
      {...layout}
      layout="vertical"
      form={props.form}
      name="control-ref"
      onFinish={() => {
        setInputPasswordVisible(true);
      }}
      onChange={onChange}
      initialValues={{
        network: 'MAINNET',
      }}
    >
      <Form.Item
        name="name"
        label={t('restore.formRestore.name.label')}
        hasFeedback
        rules={[
          {
            required: true,
            message: `${t('restore.formRestore.name.label')} ${t('general.required')}`,
          },
        ]}
      >
        <Input placeholder={t('restore.formRestore.name.label')} />
      </Form.Item>
      <Form.Item
        name="mnemonic"
        label={t('restore.formRestore.mnemonic.label')}
        hasFeedback
        validateFirst
        rules={[
          {
            required: true,
            message: `${t('restore.formRestore.mnemonic.label')} ${t('general.required')}`,
          },
          () => ({
            validator(_, value) {
              try {
                const trimmedMnemonic = value.toString().trim();
                HDKey.fromMnemonic(trimmedMnemonic);
              } catch (e) {
                return Promise.reject(new Error(t('restore.formRestore.mnemonic.validatorError')));
              }
              return Promise.resolve();
            },
          }),
        ]}
      >
        <Input.TextArea
          autoSize={{ minRows: 3, maxRows: 3 }}
          placeholder={t('restore.formRestore.mnemonic.label')}
        />
      </Form.Item>
      <Form.Item
        name="network"
        label={t('restore.formRestore.network.label')}
        rules={[{ required: true }]}
      >
        <Select
          placeholder={`${t('general.select')} ${t('restore.formRestore.network.label')}`}
          // placeholder="Select a option and change input text above"
          onChange={onNetworkChange}
          // allowClear
          disabled={props.isSelectFieldDisable}
        >
          {walletService.supportedConfigs().map(config => (
            <Select.Option key={config.name} value={config.name} disabled={!config.enabled}>
              {config.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item {...tailLayout}>
        <Button type="primary" htmlType="submit">
          {t('restore.formRestore.button')}
        </Button>
      </Form.Item>
      <PasswordFormModal
        description={t('general.passwordFormModal.restoreWallet.description')}
        okButtonText={t('general.passwordFormModal.restoreWallet.okButton')}
        isButtonLoading={isButtonLoading}
        onCancel={() => {
          setInputPasswordVisible(false);
        }}
        onSuccess={onWalletImportFinish}
        onValidatePassword={async (password: string) => {
          const isValid = await secretStoreService.checkIfPasswordIsValid(password);
          return {
            valid: isValid,
            errMsg: !isValid ? t('general.passwordFormModal.error') : '',
          };
        }}
        successText={t('general.passwordFormModal.restoreWallet.success')}
        title={t('general.passwordFormModal.title')}
        visible={inputPasswordVisible}
        successButtonText={t('general.passwordFormModal.restoreWallet.successButton')}
        confirmPassword={false}
      />
      <ErrorModalPopup
        isModalVisible={isErrorModalVisible}
        handleCancel={handleErrorCancel}
        handleOk={handleErrorOk}
        title={t('general.errorModalPopup.title')}
        footer={[]}
      >
        <>
          <div className="description">
            {t('general.errorModalPopup.restoreWallet.description')}
          </div>
        </>
      </ErrorModalPopup>
    </Form>
  );
};

function RestorePage() {
  const [form] = Form.useForm();
  const [isRestoreDisable, setIsRestoreDisable] = useState(false);
  const [isCustomConfig, setIsCustomConfig] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSelectFieldDisable, setIsSelectFieldDisable] = useState(true);
  const [networkConfig, setNetworkConfig] = useState();
  const currentSession = useRecoilValue(sessionState);
  const didMountRef = useRef(false);

  const analyticsService = new AnalyticsService(currentSession);

  const [t] = useTranslation();

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      analyticsService.logPage('Restore');
    }
  }, []);

  return (
    <main className="restore-page">
      <div className="header">
        <img src={logo} className="logo" alt="logo" />
      </div>
      <div className="container">
        <BackButton />
        <div>
          <div className="title">
            {!isCustomConfig || isConnected ? t('restore.title1') : t('restore.title2')}
          </div>
          <div className="slogan">
            {!isCustomConfig || isConnected ? t('restore.slogan1') : t('restore.slogan2')}
          </div>

          {!isCustomConfig || isConnected ? (
            <FormRestore
              form={form}
              isRestoreDisable={isRestoreDisable}
              isSelectFieldDisable={isSelectFieldDisable}
              setIsSelectFieldDisable={setIsSelectFieldDisable}
              setIsCustomConfig={setIsCustomConfig}
              setIsConnected={setIsConnected}
              setIsRestoreDisable={setIsRestoreDisable}
              networkConfig={networkConfig}
            />
          ) : (
            <FormCustomConfig
              setIsConnected={setIsConnected}
              setIsRestoreDisable={setIsRestoreDisable}
              setNetworkConfig={setNetworkConfig}
            />
          )}
        </div>
      </div>
    </main>
  );
}

export default RestorePage;
