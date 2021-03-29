import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import './restore.less';
import { Button, Form, Input, Select } from 'antd';
import { FormInstance } from 'antd/lib/form';
import { HDKey } from '../../utils/ChainJsLib';
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
        label="Node URL"
        hasFeedback
        rules={[
          { required: true, message: 'Node URL is required' },
          {
            pattern: /(https?:\/\/)?[\w\-~]+(\.[\w\-~]+)+(\/[\w\-~]*)*(#[\w-]*)?(\?.*)?/,
            message: 'Please enter a valid node url',
          },
        ]}
      >
        <Input placeholder="Node URL" />
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

      <div className="row">
        <Form.Item
          name="derivationPath"
          label="Derivation Path"
          hasFeedback
          rules={[
            { required: true, message: 'Derivation Path is required' },
            {
              pattern: /^m\/\d+'?\/\d+'?\/\d+'?\/\d+'?\/\d+'?$/,
              message: 'Please enter a valid derivation path',
            },
          ]}
        >
          <Input maxLength={64} placeholder="Derivation Path" />
        </Form.Item>
        <Form.Item
          name="validatorPrefix"
          label="Validator Prefix"
          hasFeedback
          rules={[{ required: true, message: 'Validator Prefix is required' }]}
        >
          <Input placeholder="Validator Prefix" />
        </Form.Item>
      </div>

      <div className="row">
        <Form.Item
          name="addressPrefix"
          label="Address Prefix"
          hasFeedback
          rules={[{ required: true, message: 'Address Prefix is required' }]}
        >
          <Input placeholder="Address Prefix" />
        </Form.Item>
        <Form.Item
          name="chainId"
          label="Chain ID"
          hasFeedback
          rules={[{ required: true, message: 'Chain ID is required' }]}
        >
          <Input placeholder="Chain ID" />
        </Form.Item>
      </div>
      <div className="row">
        <Form.Item
          name="baseDenom"
          label="Base Denom"
          hasFeedback
          rules={[{ required: true, message: 'Base Denom is required' }]}
        >
          <Input placeholder="Base Denom" />
        </Form.Item>
        <Form.Item
          name="croDenom"
          label="CRO Denom"
          hasFeedback
          rules={[{ required: true, message: 'CRO Denom is required' }]}
        >
          <Input placeholder="CRO Denom" />
        </Form.Item>
      </div>

      <SuccessModalPopup
        isModalVisible={isModalVisible}
        handleCancel={handleCancel}
        handleOk={handleOk}
        title="Success!"
        button={
          <Button
            type="primary"
            htmlType="submit"
            onClick={checkNodeConnectivity}
            loading={checkingNodeConnection}
          >
            Connect Node
          </Button>
        }
        footer={[
          <Button key="submit" type="primary" onClick={handleOk}>
            Next
          </Button>,
        ]}
      >
        <>
          <div className="description">Your node is connected!</div>
        </>
      </SuccessModalPopup>
      <ErrorModalPopup
        isModalVisible={isErrorModalVisible}
        handleCancel={handleErrorCancel}
        handleOk={handleErrorOk}
        title="An error happened!"
        footer={[]}
      >
        <>
          <div className="description">
            Could not connect to the specified node URL. Please check again.
          </div>
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
      const wallet = await walletService.restoreWallet(importOptions);
      await walletService.encryptWalletAndSetSession(password, wallet);
      await walletService.syncAll(new Session(wallet));
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
    >
      <Form.Item
        name="name"
        label="Wallet Name"
        hasFeedback
        rules={[{ required: true, message: 'Wallet name is required' }]}
      >
        <Input placeholder="Wallet name" />
      </Form.Item>
      <Form.Item
        name="mnemonic"
        label="Mnemonic Phrase"
        hasFeedback
        validateFirst
        rules={[
          { required: true, message: 'The mnemonic phrase is required' },
          () => ({
            validator(_, value) {
              try {
                const trimmedMnemonic = value.toString().trim();
                HDKey.fromMnemonic(trimmedMnemonic);
              } catch (e) {
                return Promise.reject(new Error('Please enter a valid mnemonic phrase'));
              }
              return Promise.resolve();
            },
          }),
        ]}
      >
        <Input.TextArea autoSize={{ minRows: 3, maxRows: 3 }} placeholder="Mnemonic phrase" />
      </Form.Item>
      <Form.Item name="network" label="Network" rules={[{ required: true }]}>
        <Select
          placeholder="Select wallet network"
          // placeholder="Select a option and change input text above"
          onChange={onNetworkChange}
          // allowClear
          disabled={props.isSelectFieldDisable}
          defaultValue="MAINNET"
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
          Restore Wallet
        </Button>
      </Form.Item>
      <PasswordFormModal
        description="Input the app password to encrypt the wallet to be restored"
        okButtonText="Encrypt wallet"
        isButtonLoading={isButtonLoading}
        onCancel={() => {
          setInputPasswordVisible(false);
        }}
        onSuccess={onWalletImportFinish}
        onValidatePassword={async (password: string) => {
          const isValid = await secretStoreService.checkIfPasswordIsValid(password);
          return {
            valid: isValid,
            errMsg: !isValid ? 'The password provided is incorrect, Please try again' : '',
          };
        }}
        successText="Wallet restored and encrypted successfully !"
        title="Provide app password"
        visible={inputPasswordVisible}
        successButtonText="Go to Home"
        confirmPassword={false}
      />
      <ErrorModalPopup
        isModalVisible={isErrorModalVisible}
        handleCancel={handleErrorCancel}
        handleOk={handleErrorOk}
        title="An error happened!"
        footer={[]}
      >
        <>
          <div className="description">Your Mnemonic Phrase is invalid. Please check again.</div>
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

  // const showSuccessModal = () => {
  //   setIsSuccessModalVisible(true);
  // };

  return (
    <main className="restore-page">
      <div className="header">
        <img src={logo} className="logo" alt="logo" />
      </div>
      <div className="container">
        <BackButton />
        <div>
          <div className="title">
            {!isCustomConfig || isConnected ? 'Restore Wallet' : 'Custom Configuration'}
          </div>
          <div className="slogan">
            {!isCustomConfig || isConnected
              ? 'Create a name and select the network for your wallet.'
              : 'Fill in the below to connect to this custom network.'}
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
