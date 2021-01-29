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
        hasFeedback
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
        name="indexingUrl"
        label="Chain Indexing URL"
        hasFeedback
        rules={[
          { required: true, message: 'Chain Indexing URL is required' },
          {
            pattern: /(https?:\/\/)?[\w\-~]+(\.[\w\-~]+)+(\/[\w\-~]*)*(#[\w-]*)?(\?.*)?/,
            message: 'Please enter a valid indexing url',
          },
        ]}
      >
        <Input placeholder="Chain Indexing URL" />
      </Form.Item>
      <Form.Item
        name="chainId"
        label="Chain ID"
        hasFeedback
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
        indexingUrl: defaultSettings.indexingUrl,
      });
    }
  }, [form, defaultSettings]);

  const onFinish = async values => {
    if (
      defaultSettings.nodeUrl === values.nodeUrl &&
      defaultSettings.indexingUrl === values.indexingUrl &&
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
      indexingUrl: values.indexingUrl,
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
      indexingUrl: defaultSettings.indexingUrl,
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
              {/* <div className="description">General settings</div> */}
              <FormGeneral />
              <Form.Item {...tailLayout} className="button">
                <Button type="primary" htmlType="submit" loading={isButtonLoading}>
                  Save
                </Button>
                <Button type="link" htmlType="button" onClick={onFill}>
                  Restore Default
                </Button>
              </Form.Item>
            </div>
          </div>
        </TabPane>
      </Tabs>
    </Form>
  );
};

function SettingsPage() {
  return (
    <Layout className="site-layout">
      <Header className="site-layout-background">Settings</Header>
      <div className="header-description">
        An invalid configuration might result in wallet malfunction.
      </div>
      <Content>
        <FormSettings />
      </Content>
      <Footer />
    </Layout>
  );
}

export default SettingsPage;
