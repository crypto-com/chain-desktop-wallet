import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import './restore.less';
import { Button, Form, Input, Select } from 'antd';
import logo from '../../assets/logo-products-chain.svg';
import { walletService } from '../../service/WalletService';
import { WalletImportOptions } from '../../service/WalletImporter';
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

const FormRestore = () => {
  const [form] = Form.useForm();
  const history = useHistory();
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [inputPasswordVisible, setInputPasswordVisible] = useState(false);
  const [isButtonLoading, setIsButtonLoading] = useState(false);

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

  return (
    <Form
      {...layout}
      layout="vertical"
      form={form}
      name="control-ref"
      onFinish={() => {
        setInputPasswordVisible(true);
      }}
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
        rules={[{ required: true, message: 'The mnemonic phrase is required' }]}
      >
        <Input.TextArea autoSize={{ minRows: 3, maxRows: 3 }} placeholder="Mnemonic phrase" />
      </Form.Item>
      <Form.Item name="network" label="Network" rules={[{ required: true }]}>
        <Select
          placeholder="Select wallet network"
          // placeholder="Select a option and change input text above"
          onChange={onNetworkChange}
          // allowClear
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
      </Form.Item>
    </Form>
  );
};

function RestorePage() {
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
          <FormRestore />
        </div>
      </div>
    </main>
  );
}

export default RestorePage;
