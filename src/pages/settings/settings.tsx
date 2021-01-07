import React, { useEffect, useState, useRef } from 'react';
import './settings.less';
import 'antd/dist/antd.css';
import { Button, Form, Input, Layout, Tabs } from 'antd';
import { useRecoilState } from 'recoil';
import { sessionState } from '../../recoil/atom';
import { walletService } from '../../service/WalletService';
import { NodeData } from '../../models/Wallet';
import { Session } from '../../models/Session';

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
        name="nodeUrl"
        label="Node URL"
        rules={[
          {
            required: true,
          },
          {
            pattern: /(https?:\/\/)?[\w\-~]+(\.[\w\-~]+)+(\/[\w\-~]*)*(#[\w-]*)?(\?.*)?/,
            message: 'Please enter a valid node url',
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

const FormSettings = () => {
  const [form] = Form.useForm();
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [session, setSession] = useRecoilState(sessionState);
  const defaultSettings = session.wallet.config;
  const didMountRef = useRef(false);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      form.setFieldsValue({
        nodeUrl: defaultSettings.nodeUrl,
        chainId: defaultSettings.network.chainId,
      });
    }
  }, [form, defaultSettings]);

  const onFinish = async values => {
    if (
      defaultSettings.nodeUrl === values.nodeUrl &&
      defaultSettings.network.chainId === values.chainId
    ) {
      // No update was done, return here
      return;
    }
    setIsButtonLoading(true);
    const nodeData: NodeData = {
      walletId: session.wallet.identifier,
      chainId: values.chainId,
      nodeUrl: values.nodeUrl,
    };
    await walletService.updateWalletNodeConfig(nodeData);
    const updatedWallet = await walletService.findWalletByIdentifier(session.wallet.identifier);
    const newSession = new Session(updatedWallet);
    await walletService.setCurrentSession(newSession);
    setSession(newSession);
    setIsButtonLoading(false);
  };

  const onFill = () => {
    form.setFieldsValue({
      nodeUrl: defaultSettings.nodeUrl,
      chainId: defaultSettings.network.chainId,
    });
  };

  return (
    <Form
      {...layout}
      layout="vertical"
      form={form}
      name="control-hooks"
      requiredMark="optional"
      onFinish={onFinish}
    >
      <Tabs defaultActiveKey="1">
        <TabPane tab="Node Configuration" key="1">
          <div className="site-layout-background settings-content">
            <div className="container">
              <div className="description">General settings</div>
              <FormGeneral />
            </div>
          </div>
        </TabPane>
      </Tabs>
      <Form.Item {...tailLayout}>
        <Button type="primary" htmlType="submit" loading={isButtonLoading}>
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
