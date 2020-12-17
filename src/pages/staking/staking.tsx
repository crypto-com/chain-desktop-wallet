import React, { useState } from 'react';
import './staking.less';
import 'antd/dist/antd.css';
import { Layout, Form, Input, Button, Tabs, Table } from 'antd';
// import {ReactComponent as HomeIcon} from '../../assets/icon-home-white.svg';
import { useRecoilValue } from 'recoil';
import ModalPopup from '../../components/ModalPopup/ModalPopup';
import { walletService } from '../../service/WalletService';
import SuccessModalPopup from '../../components/SuccessModalPopup/SuccessModalPopup';
import ErrorModalPopup from '../../components/ErrorModalPopup/ErrorModalPopup';
import { walletAssetState } from '../../recoil/atom';

const { Header, Content, Footer } = Layout;
const { TabPane } = Tabs;
const layout = {
  // labelCol: { span: 8 },
  // wrapperCol: { span: 16 },
};
const tailLayout = {
  // wrapperCol: { offset: 8, span: 16 },
};

const FormDepositStake = () => {
  const [form] = Form.useForm();
  const [formValues, setFormValues] = useState({ stakingAddress: '', amount: '', memo: '' });
  const [isConfirmationModalVisible, setIsVisibleConfirmationModal] = useState(false);
  const [isSuccessTransferModalVisible, setIsSuccessTransferModalVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');
  const [isErrorTransferModalVisible, setIsErrorTransferModalVisible] = useState(false);
  const walletAsset = useRecoilValue(walletAssetState);

  const showModal = () => {
    setFormValues(form.getFieldsValue());
    setIsVisibleConfirmationModal(true);
  };

  const onConfirmTransfer = async () => {
    const memo = formValues.memo !== null && formValues.memo !== undefined ? formValues.memo : '';
    try {
      setConfirmLoading(true);
      // TODO: walletService.depositStake

      const hash = await walletService.sendTransfer({
        toAddress: formValues.stakingAddress,
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
      <Form.Item
        name="stakingAddress"
        label="Deposit Staking Address"
        rules={[{ required: true, message: 'Staking address is required' }]}
      >
        <Input placeholder="tcro..." />
      </Form.Item>
      <div className="amount">
        <Form.Item
          name="amount"
          label="Staking Amount"
          rules={[
            { required: true, message: 'Staking amount is required' },
            {
              pattern: /^(0|[1-9]\d*)?(\.\d+)?(?<=\d)$/,
              message: 'Staking amount should be a number',
            },
          ]}
        >
          <Input />
        </Form.Item>
        <div className="available">
          <span>Available: </span>
          <div className="available-amount">{walletAsset.balance} CRO</div>
        </div>
      </div>
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
              <div className="label">Deposit To Address</div>
              <div className="address">{`${formValues?.stakingAddress}`}</div>
            </div>
            <div className="item">
              <div className="label">Amount</div>
              <div>{`${formValues?.amount} CRO`}</div>
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
            <div>The staking transaction failed. Please try again later</div>
          </>
        </ErrorModalPopup>
      </Form.Item>
    </Form>
  );
};

const FormUnbondStake = () => {
  const [form] = Form.useForm();
  const [formValues, setFormValues] = useState({ stakingAddress: '', amount: '', memo: '' });
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
      // TODO: walletService.unbondStake
      const hash = await walletService.sendTransfer({
        toAddress: formValues.stakingAddress,
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
  const StakingColumns = [
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      render: text => (
        <a
          onClick={() => {
            form.setFieldsValue({
              stakingAddress: text,
            });
          }}
        >
          {text}
        </a>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
    },
  ];

  const StakingData = [
    {
      key: '1',
      address: 'tcro1reyshfdygf7673xm9p8v0xvtd96m6cd6dzswyj',
      amount: '500, 000',
      tags: ['nice', 'developer'],
    },
    {
      key: '2',
      address: 'tcro1uevms2nv4f2dhvm5u7sgus2yncgh7gdwn6urwe',
      amount: '300, 000',
      tags: ['loser'],
    },
    {
      key: '3',
      address: 'tcro1uvvmzes9kazpkt359exm67qqj384l7c74mjgrr',
      amount: '100, 000',
      tags: ['cool', 'teacher'],
    },
  ];

  const StakingTable = () => {
    return <Table columns={StakingColumns} dataSource={StakingData} />;
  };

  return (
    <div>
      <StakingTable />

      <Form
        {...layout}
        layout="vertical"
        form={form}
        name="control-ref"
        onFinish={showModal}
        requiredMark={false}
      >
        <Form.Item
          name="stakingAddress"
          label="Unbond Staking Address"
          rules={[{ required: true, message: 'Staking address is required' }]}
        >
          <Input disabled placeholder="Click address in the table to fill" />
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
                <div className="label">Unbond From Address</div>
                <div className="address">{`${formValues?.stakingAddress}`}</div>
              </div>
              {/* <div className="item">
              <div className="label">Amount</div>
              <div>{`${formValues?.amount} CRO`}</div>
            </div> */}
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
              <div>The staking transaction failed. Please try again later</div>
            </>
          </ErrorModalPopup>
        </Form.Item>
      </Form>
    </div>
  );
};

function StakingPage() {
  return (
    <Layout className="site-layout">
      <Header className="site-layout-background">Staking</Header>

      <Content>
        <Tabs defaultActiveKey="1">
          <TabPane tab="Deposit Stake" key="1">
            <div className="site-layout-background stake-content">
              <div className="container">
                <div className="description">Deposit fund to a staking address.</div>
                <FormDepositStake />
              </div>
            </div>
          </TabPane>
          <TabPane tab="Unbond Stake" key="2">
            <div className="site-layout-background stake-content">
              <div className="container">
                <div className="description">Unbond fund from a staking address.</div>
                <FormUnbondStake />
              </div>
            </div>
          </TabPane>
        </Tabs>
      </Content>
      <Footer />
    </Layout>
  );
}

export default StakingPage;
