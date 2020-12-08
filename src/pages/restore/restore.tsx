import React from 'react';
import './restore.less';
import 'antd/dist/antd.css';
import { Button, Form, Input, Select } from 'antd';
import logo from '../../assets/logo-products-chain.svg';
import { walletService } from '../../service/WalletService';
import { WalletImportOptions } from '../../service/WalletImporter';

const layout = {
  // labelCol: { span: 8 },
  // wrapperCol: { span: 16 },
};
const tailLayout = {
  // wrapperCol: { offset: 8, span: 16 },
};

const FormRestore = () => {
  const [form] = Form.useForm();

  const onNetworkChange = (network: string) => {
    form.setFieldsValue({ network });
  };

  const onWalletImportFinish = async () => {
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
      await walletService.restoreAndSaveWallet(importOptions);
      form.resetFields();
      // Jump to home screen

      return;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('issue on wallet import', e);
      // TODO : Show pop up displaying the issue on wallet import
    }
  };

  return (
    <Form {...layout} layout="vertical" form={form} name="control-ref">
      <Form.Item name="name" label="Wallet Name" rules={[{ required: true }]}>
        <Input placeholder="Wallet name" />
      </Form.Item>
      <Form.Item name="mnemonic" label="Mnemonic Phrase" rules={[{ required: true }]}>
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
            <Select.Option key={config.name} value={config.name}>
              {config.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item {...tailLayout}>
        <Button type="primary" htmlType="submit" onClick={onWalletImportFinish}>
          Restore Wallet
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

function RestorePage() {
  return (
    <main className="restore-page">
      <div className="header">
        <img src={logo} className="logo" alt="logo" />
      </div>
      <div className="container">
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
