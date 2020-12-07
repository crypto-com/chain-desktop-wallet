import React from 'react';
// import ReactDOM from 'react-dom';
import './create.less';
import 'antd/dist/antd.css';
import { Button, Form, Input, Select } from 'antd';
// import { FormInstance } from 'antd/lib/form';
import logo from '../../assets/logo-products-chain.svg';
import { WalletService, walletService } from '../../service/WalletService';
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

  // const onFinish = values => {
  //     console.log(values);
  // };

  const onFinish = async () => {
    const { name } = form.getFieldsValue();
    const createOptions: WalletCreateOptions = {
      walletName: name,
      config: DefaultWalletConfigs.TestNetConfig,
    };
    const wallet = await walletService.createAndSaveWallet(createOptions);
    // eslint-disable-next-line
    console.log('wallet saved ...', wallet);

    form.resetFields();

    // Show popup success
    // Jump to home screen
  };

  // const onReset = () => {
  //     form.resetFields();
  // };

  // const onFill = () => {
  //     form.setFieldsValue({
  //         note: 'Hello world!',
  //         network: 'mainnet',
  //     });
  // };

  return (
    <Form {...layout} layout="vertical" form={form} name="control-ref" onFinish={onFinish}>
      <Form.Item name="name" label="Wallet Name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="network" label="Network" rules={[{ required: true }]}>
        <Select placeholder="Select wallet network" onChange={onNetworkChange}>
          {WalletService.supportedConfigs().map(config => (
            <Select.Option key={config.name} value={config.name}>
              {config.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item
        noStyle
        shouldUpdate={(prevValues, currentValues) => prevValues.network !== currentValues.network}
      >
        {({ getFieldValue }) => {
          return getFieldValue('network') === 'custom' ? (
            <Form.Item
              name="customizeNetwork"
              label="Customize Network"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
          ) : null;
        }}
      </Form.Item>
      <Form.Item {...tailLayout}>
        <Button type="primary" htmlType="submit" onClick={onFinish}>
          Create Wallet
        </Button>
        {/* <Button htmlType="button" onClick={onReset}>
                    Reset
                </Button>
                <Button type="link" htmlType="button" onClick={onFill}>
                    Fill form
                </Button> */}
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
