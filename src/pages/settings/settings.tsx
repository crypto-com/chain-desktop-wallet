import React, { useEffect, useState, useRef } from 'react';
import './settings.less';
import 'antd/dist/antd.css';
import { Button, Form, Input, Layout, Tabs } from 'antd';
import { useRecoilValue } from 'recoil';
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
        name="networkName"
        label="Wallet Name"
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
        label="Node URL"
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

const FormSettings = () => {
  const [form] = Form.useForm();
  const [isButtonLoading, setIsButtonLoading] = useState(false);
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

  const onFinish = async values => {
    // TO-DO save network config
    setIsButtonLoading(true);
    const nodeData: NodeData = {
      walletId: session.wallet.identifier,
      chainId: values.chainId,
      nodeUrl: values.nodeUrl,
      networkName: values.networkName,
    };
    const wallet = await walletService.findWalletByIdentifier(session.wallet.identifier);
    await walletService.updateWalletNodeConfig(nodeData);
    walletService.setCurrentSession(new Session(wallet));
    setIsButtonLoading(false);
  };

  const onFill = () => {
    form.setFieldsValue({
      networkName: defaultSettings.name,
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
        <TabPane tab="General" key="1">
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
