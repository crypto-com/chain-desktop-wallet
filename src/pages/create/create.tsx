import React from 'react';
import { useHistory } from 'react-router-dom';
import './create.less';
import 'antd/dist/antd.css';
import { Button, Form, Input, Select } from 'antd';
import logo from '../../assets/logo-products-chain.svg';
import { walletService } from '../../service/WalletService';
import { WalletCreateOptions } from '../../service/WalletCreator';
import { DefaultWalletConfigs } from '../../config/StaticConfig';

const layout = {
  // labelCol: { span: 8 },
  // wrapperCol: { span: 16 },
};
const tailLayout = {
  // wrapperCol: { offset: 8, span: 16 },
};

const FormCreate = () => {
  const [form] = Form.useForm();
  const history = useHistory();

  const onNetworkChange = (value: any) => {
    switch (value) {
      case 'mainnet':
        form.setFieldsValue({ note: 'Hi, mainnet!' });
        return;
      case 'testnet':
        form.setFieldsValue({ note: 'Hi, testnet!' });
        return;
      case 'custom':
        form.setFieldsValue({ note: 'Hi custom!' });
        return;
      default:
        form.setFieldsValue({ note: 'Hi mainnet!' });
    }
  };

  const onWalletCreateFinish = async () => {
    const { name } = form.getFieldsValue();
    const createOptions: WalletCreateOptions = {
      walletName: name,
      config: DefaultWalletConfigs.TestNetConfig,
    };
    try {
      await walletService.createAndSaveWallet(createOptions);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('issue on wallet create', e);

      // TODO : Show pop up on failure to create wallet
      return;
    }

    form.resetFields();
    // TODO : Show popup success & Jump to home screen
    history.push('home');

  };

  return (
    <Form {...layout} layout="vertical" form={form} name="control-ref" onFinish={onWalletCreateFinish}>
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
        <Button type="primary" htmlType="submit">
          Create Wallet
        </Button>
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
