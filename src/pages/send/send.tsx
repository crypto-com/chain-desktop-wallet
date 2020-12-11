import React, { useState } from 'react';
import './send.less';
import 'antd/dist/antd.css';
import { Layout, Form, Input, Button } from 'antd';
// import {ReactComponent as HomeIcon} from '../../assets/icon-home-white.svg';

import ModalPopup from '../../components/ModalPopup/ModalPopup';

const { Header, Content, Footer } = Layout;
const layout = {
  // labelCol: { span: 8 },
  // wrapperCol: { span: 16 },
};
const tailLayout = {
  // wrapperCol: { offset: 8, span: 16 },
};
const availableAmount = '250,000';
const FormSend = () => {
  const [form] = Form.useForm();
  const [formValues, setFormValues] = useState({ address: '', amount: '' });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const showModal = () => {
    setFormValues(form.getFieldsValue());
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <Form
      {...layout}
      layout="vertical"
      form={form}
      name="control-ref"
      onFinish={showModal}
      requiredMark={false}
    >
      <Form.Item name="address" label="To Address" rules={[{ required: true }]}>
        <Input placeholder="tcro..." />
      </Form.Item>
      <div className="amount">
        <Form.Item name="amount" label="Sending Amount" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <div className="available">
          <span>Available: </span>
          <div className="available-amount">{availableAmount} CRO</div>
        </div>
      </div>

      <Form.Item {...tailLayout}>
        <ModalPopup
          isModalVisible={isModalVisible}
          handleCancel={handleCancel}
          handleOk={handleOk}
          button={
            <Button type="primary" htmlType="submit">
              Review
            </Button>
          }
          footer={[
            <Button key="submit" type="primary" onClick={handleOk}>
              Confirm to send
            </Button>,
          ]}
        >
          <>
            <div className="title">Send</div>
            <div className="description">Please review the below information. </div>
            <div className="item">
              <div className="label">To Address</div>
              <div className="address">{`${formValues?.address}`}</div>
            </div>
            <div className="item">
              <div className="label">Amount</div>
              <div>{`${formValues?.amount} CRO`}</div>
            </div>
          </>
        </ModalPopup>
      </Form.Item>
    </Form>
  );
};

function SendPage() {
  return (
      <Layout className="site-layout">
        <Header className="site-layout-background">Send</Header>
        <Content>
          <div className="site-layout-background send-content">
            <div className="container">
              <div className="description">
                Move funds from your transfer address to another transfer address or deposit stake
                to a staking address.
              </div>
              <FormSend />
            </div>
          </div>
        </Content>
        <Footer />
      </Layout>
  );
}

export default SendPage;
