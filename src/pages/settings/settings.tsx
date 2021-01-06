import React from // useEffect,
// useRef
'react';
import './settings.less';
import 'antd/dist/antd.css';
import { useRecoilValue } from 'recoil';
import { sessionState } from '../../recoil/atom';
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
        name="addressPrefix"
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
  const session = useRecoilValue(sessionState);
  // const didMountRef = useRef(false);

  // useEffect(() => {
  //   if (!didMountRef.current) {
  //     didMountRef.current = true;
  //   }
  // }, [session])

  const defaultSettings = session.wallet.config;

  const onFinish = values => {
    console.log(values);
  };

  const onFill = () => {
    form.setFieldsValue({
      name: defaultSettings.name,
      nodeUrl: defaultSettings.nodeUrl,
      derivationPath: defaultSettings.derivationPath,
      addressPrefix: defaultSettings.network.addressPrefix,
      chainId: defaultSettings.network.chainId,
      baseDenom: defaultSettings.network.coin.baseDenom,
      croDenom: defaultSettings.network.coin.croDenom,
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
