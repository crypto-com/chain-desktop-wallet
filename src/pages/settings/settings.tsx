import React from 'react';
import './settings.less';
import 'antd/dist/antd.css';
import { Button, Form, Input, Layout, Tabs } from 'antd';
// import {ReactComponent as HomeIcon} from '../../assets/icon-home-white.svg';

const { Header, Content, Footer } = Layout;
const { TabPane } = Tabs;
const layout = {
  // labelCol: { span: 8 },
  // wrapperCol: { span: 16 },
};
const tailLayout = {
  // wrapperCol: { offset: 8, span: 16 },
};

const FormGeneral = () => {
  return (
    <>
      <Form.Item
        name="name"
        label="Name"
        rules={[
          {
            required: true,
          },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="derivationPath"
        label="Derivation Path"
        rules={[
          {
            required: true,
          },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="nodeUrl"
        label="Node Url"
        rules={[
          {
            required: true,
          },
        ]}
      >
        <Input />
      </Form.Item>
    </>
  );
};

const FormNetwork = () => {
  return (
    <>
      <Form.Item
        name="address"
        label="Address Prefix"
        rules={[
          {
            required: true,
          },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="chainId"
        label="Chain ID"
        rules={[
          {
            required: true,
          },
        ]}
      >
        <Input />
      </Form.Item>
    </>
  );
};
const FormCoin = () => {
  return (
    <>
      <Form.Item
        name="baseDenom"
        label="Base Denom"
        rules={[
          {
            required: true,
          },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="croDenom"
        label="CRO Denom"
        rules={[
          {
            required: true,
          },
        ]}
      >
        <Input />
      </Form.Item>
    </>
  );
};
const FormSettings = () => {
  const [form] = Form.useForm();

  const onFinish = values => {
    console.log(values);
  };

  const onFill = () => {
    form.setFieldsValue({
      name: 'Hello world!',
      nodeUrl: 'https://testnet-croeseid.crypto.com',
      derivationPath: "m/44'/1'/0/0/0",
      address: 'tcro',
      chainId: 'testnet-croeseid-2',
      baseDenom: 'TCRO',
      croDenom: 'TCRO',
    });
  };

  return (
    <Form {...layout} form={form} name="control-hooks" onFinish={onFinish}>
      <Tabs defaultActiveKey="1">
        <TabPane tab="General" key="1">
          <div className="site-layout-background stake-content">
            <div className="container">
              <div className="description">General settings</div>
              <FormGeneral />
            </div>
          </div>
        </TabPane>
        <TabPane tab="Network" key="2">
          <div className="site-layout-background stake-content">
            <div className="container">
              <div className="description">Network settings</div>
              <FormNetwork />
            </div>
          </div>
        </TabPane>
        <TabPane tab="Coin" key="3">
          <div className="site-layout-background stake-content">
            <div className="container">
              <div className="description">Coin settings</div>
              <FormCoin />
            </div>
          </div>
        </TabPane>
      </Tabs>

      <Form.Item
        noStyle
        shouldUpdate={(prevValues, currentValues) => prevValues.gender !== currentValues.gender}
      >
        {({ getFieldValue }) => {
          return getFieldValue('gender') === 'other' ? (
            <Form.Item
              name="customizeGender"
              label="Customize Gender"
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <Input />
            </Form.Item>
          ) : null;
        }}
      </Form.Item>
      <Form.Item {...tailLayout}>
        <Button type="primary" htmlType="submit">
          Save
        </Button>
        <Button type="link" htmlType="button" onClick={onFill}>
          Default Settings
        </Button>
      </Form.Item>
    </Form>
  );
};

function SettingsPage() {
  return (
    <Layout className="site-layout">
      <Header className="site-layout-background">Settings</Header>
      <Content>
        <FormSettings />
      </Content>
      <Footer />
    </Layout>
  );
}

export default SettingsPage;
