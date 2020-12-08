import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { atom, useRecoilState } from 'recoil';
import './create.less';
import { Button, Form, Input, Select } from 'antd';
import logo from '../../assets/logo-products-chain.svg';
import { Wallet } from '../../models/Wallet';
import { walletService } from '../../service/WalletService';
import { WalletCreateOptions } from '../../service/WalletCreator';
import SuccessModalPopup from '../../components/SuccessModalPopup/SuccessModalPopup';

const layout = {
  // labelCol: { span: 8 },
  // wrapperCol: { span: 16 },
};
const tailLayout = {
  // wrapperCol: { offset: 8, span: 16 },
};

const encryptedPhraseState = atom({
  key: 'encryptedPhrase',
  default: '',
});

const FormCreate = () => {
  const [form] = Form.useForm();
  const history = useHistory();
  const [wallet, setWallet] = useState<Wallet>();
  const [encryptedPhrase, setEncryptedPhrase] = useRecoilState(encryptedPhraseState);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
    setEncryptedPhrase(wallet?.encryptedPhrase ?? '');
    history.push({
      pathname: '/create/backup',
      state: { encryptedPhrase },
    });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const onNetworkChange = (network: string) => {
    form.setFieldsValue({ network });
  };

  const onWalletCreateFinish = async () => {
    const { name, network } = form.getFieldsValue();
    if (!name || !network) {
      return;
    }
    const selectedNetwork = walletService
      .supportedConfigs()
      .find(config => config.name === network);

    if (!selectedNetwork) {
      return;
    }

    const createOptions: WalletCreateOptions = {
      walletName: name,
      config: selectedNetwork,
    };
    try {
      const createdWallet = await walletService.createAndSaveWallet(createOptions);
      setWallet(createdWallet);
      showModal();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('issue on wallet create', e);

      // TODO : Show pop up on failure to create wallet
      return;
    }

    form.resetFields();
    // TODO : Show popup success & Jump to home screen
  };

  return (
    <Form
      {...layout}
      layout="vertical"
      form={form}
      name="control-ref"
      onFinish={onWalletCreateFinish}
    >
      <Form.Item name="name" label="Wallet Name" rules={[{ required: true }]}>
        <Input placeholder="Wallet name" />
      </Form.Item>
      <Form.Item name="network" label="Network" rules={[{ required: true }]}>
        <Select placeholder="Select wallet network" onChange={onNetworkChange}>
          {walletService.supportedConfigs().map(config => (
            <Select.Option key={config.name} value={config.name}>
              {config.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item {...tailLayout}>
        <SuccessModalPopup
          isModalVisible={isModalVisible}
          handleCancel={handleCancel}
          handleOk={handleOk}
          title="Success!"
          button={
            <Button type="primary" htmlType="submit">
              Create Wallet
            </Button>
          }
          footer={[
            <Button key="submit" type="primary" onClick={handleOk}>
              Next
            </Button>,
          ]}
        >
          <>
            <div>Your wallet has been created!</div>
          </>
        </SuccessModalPopup>
      </Form.Item>
    </Form>
  );
};

function CreatePage() {
  return (
    <main className="create-page">
      <div className="header">
        <img src={logo} className="logo" alt="logo" />
      </div>
      <div className="container">
        <div>
          <div className="title">Create wallet</div>
          <div className="slogan">Create a name and select the network for your wallet.</div>
          <FormCreate />
        </div>
      </div>
    </main>
  );
}

export default CreatePage;
