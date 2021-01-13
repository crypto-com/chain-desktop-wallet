import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import './restore.less';
import { Button, Form, Input, Select } from 'antd';
import { HDKey } from '../../service/types/ChainJsLib';
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
}

interface FormRestoreProps {
  isModalVisible: boolean;
  isRestoreDisable: boolean;
  isSelectFieldDisable: boolean;
  onNetworkChange: (network: string) => void;
}

const FormCustomConfig: React.FC<FormCustomConfigProps> = props => {
  const [form] = Form.useForm();
  const isNodeValid = true;
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

  const checkNodeConnectivity = () => {
    // TO-DO Node Connectivity check
    form.validateFields().then(values => {
      // eslint-disable-next-line no-console
      console.log(values);
      if (isNodeValid) {
        showModal();
      } else {
        showErrorModal();
      }
    });
  };

  return (
    <Form layout="vertical" form={form} name="control-ref">
      <div className="row">
        <Form.Item
          name="networkName"
          label="Network Name"
          hasFeedback
          rules={[{ required: true, message: 'Network Name is required' }]}
        >
          <Input maxLength={36} placeholder="Network Name" />
        </Form.Item>
        <Form.Item
          name="derivationPath"
          label="Derivation Path"
          hasFeedback
          rules={[{ required: true, message: 'Derivation Path is required' }]}
        >
          <Input maxLength={36} placeholder="Derivation Path" />
        </Form.Item>
      </div>

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
          <Button type="primary" htmlType="submit" onClick={checkNodeConnectivity}>
            Connect
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
            Your Network Configuration is invalid. Please check again.
          </div>
        </>
      </ErrorModalPopup>
    </Form>
  );
};

const FormRestore: React.FC<FormRestoreProps> = props => {
  return (
    <>
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
          onChange={props.onNetworkChange}
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
          Restore Wallet
        </Button>
      </Form.Item>
    </>
  );
};

function RestorePage() {
  const [form] = Form.useForm();
  const history = useHistory();
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [inputPasswordVisible, setInputPasswordVisible] = useState(false);
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [isCustomConfig, setIsCustomConfig] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isRestoreDisable, setIsRestoreDisable] = useState(false);
  const [isSelectFieldDisable, setIsSelectFieldDisable] = useState(true);

  // const showSuccessModal = () => {
  //   setIsSuccessModalVisible(true);
  // };

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

  const onNetworkChange = (network: string) => {
    form.setFieldsValue({ network });
    if (network === DefaultWalletConfigs.CustomDevNet.name) {
      setIsCustomConfig(true);
      setIsConnected(false);
      setIsRestoreDisable(true);
    }
  };

  const onWalletImportFinish = async (password: string) => {
    setIsButtonLoading(true);
    const { name, mnemonic, network } = form.getFieldsValue();
    if (!name || !mnemonic || !network) {
      return;
    }
    const selectedNetwork = walletService
      .supportedConfigs()
      .find(config => config.name === network);

    if (!selectedNetwork) {
      return;
    }

    const importOptions: WalletImportOptions = {
      walletName: name,
      phrase: mnemonic.toString().trim(),
      config: selectedNetwork,
    };
    try {
      const wallet = await walletService.restoreWallet(importOptions);
      await walletService.encryptWalletAndSetSession(password, wallet);
      await walletService.syncAll(new Session(wallet));
      goToHome();
      form.resetFields();
      return;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('issue on wallet import', e);
      showErrorModal();
    }
  };

  const onChange = () => {
    const { name, mnemonic } = form.getFieldsValue();
    if (name !== '' && mnemonic !== '') {
      setIsSelectFieldDisable(false);
    } else {
      setIsSelectFieldDisable(true);
    }
  };

  return (
    <main className="restore-page">
      <div className="header">
        <img src={logo} className="logo" alt="logo" />
      </div>
      <div className="container">
        <BackButton />
        <div>
          <div className="title">Restore wallet</div>
          <div className="slogan">Create a name and select the network for your wallet.</div>
          <Form
            {...layout}
            layout="vertical"
            form={form}
            name="control-ref"
            onFinish={() => {
              setInputPasswordVisible(true);
            }}
            onChange={onChange}
          >
            {!isCustomConfig || isConnected ? (
              <FormRestore
                isRestoreDisable={isRestoreDisable}
                isModalVisible={inputPasswordVisible}
                onNetworkChange={onNetworkChange}
                isSelectFieldDisable={isSelectFieldDisable}
              />
            ) : (
              <FormCustomConfig
                setIsConnected={setIsConnected}
                setIsRestoreDisable={setIsRestoreDisable}
              />
            )}
          </Form>
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
              <div className="description">
                Your Mnemonic Phrase is invalid. Please check again.
              </div>
            </>
          </ErrorModalPopup>
        </div>
      </div>
    </main>
  );
}

export default RestorePage;
