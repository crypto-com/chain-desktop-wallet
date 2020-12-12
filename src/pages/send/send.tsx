import React, { useState } from 'react';
import './send.less';
import 'antd/dist/antd.css';
import { Layout, Form, Input, Button } from 'antd';
// import {ReactComponent as HomeIcon} from '../../assets/icon-home-white.svg';

import ModalPopup from '../../components/ModalPopup/ModalPopup';
import { walletService } from '../../service/WalletService';
import SuccessModalPopup from '../../components/SuccessModalPopup/SuccessModalPopup';
import ErrorModalPopup from '../../components/ErrorModalPopup/ErrorModalPopup';

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
  const [formValues, setFormValues] = useState({ recipientAddress: '', amount: '', memo: '' });
  const [isConfirmationModalVisible, setIsVisibleConfirmationModal] = useState(false);
  const [isSuccessTransferModalVisible, setIsSuccessTransferModalVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');
  const [isErrorTransferModalVisible, setIsErrorTransferModalVisible] = useState(false);

  const showModal = () => {
    setFormValues(form.getFieldsValue());
    setIsVisibleConfirmationModal(true);
  };

  const onConfirmTransfer = async () => {
    const memo = formValues.memo !== null && formValues.memo !== undefined ? formValues.memo : '';
    try {
      setConfirmLoading(true);
      const hash = await walletService.sendTransfer({
        toAddress: formValues.recipientAddress,
        amount: formValues.amount,
        memo,
      });
      setTransactionHash(hash);

      setIsVisibleConfirmationModal(false);
      setConfirmLoading(false);
      setIsSuccessTransferModalVisible(true);

      form.resetFields();
    } catch (e) {
      setIsVisibleConfirmationModal(false);
      setConfirmLoading(false);
      setIsErrorTransferModalVisible(true);
      // eslint-disable-next-line no-console
      console.log('Error occurred while transfer', e);
    }
  };

  const handleCancel = () => {
    setIsVisibleConfirmationModal(false);
  };

  const closeSuccessModal = () => {
    setIsSuccessTransferModalVisible(false);
  };

  const closeErrorModal = () => {
    setIsErrorTransferModalVisible(false);
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
      <Form.Item name="recipientAddress" label="Recipient Address" rules={[{ required: true }]}>
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
      <Form.Item name="memo" label="Memo (Optional)">
        <Input />
      </Form.Item>

      <Form.Item {...tailLayout}>
        <ModalPopup
          isModalVisible={isConfirmationModalVisible}
          handleCancel={handleCancel}
          handleOk={onConfirmTransfer}
          confirmationLoading={confirmLoading}
          button={
            <Button type="primary" htmlType="submit">
              Review
            </Button>
          }
          okText="Confirm"
        >
          <>
            <div className="title">Confirm Transaction</div>
            <div className="description">Please review the below information. </div>
            <div className="item">
              <div className="label">To Address</div>
              <div className="address">{`${formValues?.recipientAddress}`}</div>
            </div>
            <div className="item">
              <div className="label">Amount</div>
              <div>{`${formValues?.amount} CRO`}</div>
            </div>
            <div className="item">
              <div className="label">Memo</div>
              <div>{`${formValues?.memo ?? ''}`}</div>
            </div>
          </>
        </ModalPopup>

        <SuccessModalPopup
          isModalVisible={isSuccessTransferModalVisible}
          handleCancel={closeSuccessModal}
          handleOk={closeSuccessModal}
          title="Success!"
          button={null}
          footer={[
            <Button key="submit" type="primary" onClick={closeSuccessModal}>
              Ok Thanks
            </Button>,
          ]}
        >
          <>
            <div>Your transfer was successful!</div>
            <div>{transactionHash}</div>
          </>
        </SuccessModalPopup>
        <ErrorModalPopup
          isModalVisible={isErrorTransferModalVisible}
          handleCancel={closeErrorModal}
          handleOk={closeErrorModal}
          title="An error happened!"
          footer={[]}
        >
          <>
            <div>The transfer transaction failed. Please try again later</div>
          </>
        </ErrorModalPopup>
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
              Move funds from your transfer address to another transfer address or deposit stake to
              a staking address.
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
