import React, { useEffect, useRef } from 'react';
import './settings.less';
import 'antd/dist/antd.css';
import { Button, Form, Input, Layout, Tabs } from 'antd';
import { useRecoilValue } from 'recoil';
import { sessionState } from '../../recoil/atom';

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
        requiredMark="optional"
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
        requiredMark="optional"
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
        requiredMark="optional"
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
  const defaultSettings = session.wallet.config;
  const didMountRef = useRef(false);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      form.setFieldsValue({
        name: defaultSettings.name,
        nodeUrl: defaultSettings.nodeUrl,
        chainId: defaultSettings.network.chainId,
      });
    }
  }, [form, defaultSettings]);

  const onFinish = values => {
    // TO-DO save network config
    // eslint-disable-next-line
    console.log(values);
  };

  const onFill = () => {
    form.setFieldsValue({
      name: defaultSettings.name,
      nodeUrl: defaultSettings.nodeUrl,
      chainId: defaultSettings.network.chainId,
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
