import React, { useState } from 'react';
import './send.less';
import 'antd/dist/antd.css';
import { Button, Form, Input, InputNumber, Layout } from 'antd';
import { useRecoilState, useRecoilValue } from 'recoil';
import { AddressType } from '@crypto-com/chain-jslib/lib/dist/utils/address';
import ModalPopup from '../../components/ModalPopup/ModalPopup';
import { walletService } from '../../service/WalletService';
import SuccessModalPopup from '../../components/SuccessModalPopup/SuccessModalPopup';
import ErrorModalPopup from '../../components/ErrorModalPopup/ErrorModalPopup';
import PasswordFormModal from '../../components/PasswordForm/PasswordFormModal';
import { secretStoreService } from '../../storage/SecretStoreService';
import { scaledBalance } from '../../models/UserAsset';
import { sessionState, walletAssetState } from '../../recoil/atom';
import { BroadCastResult } from '../../models/Transaction';
import { TransactionUtils } from '../../utils/TransactionUtils';
import { fromScientificNotation } from '../../utils/NumberUtils';

const { Header, Content, Footer } = Layout;
const layout = {};
const tailLayout = {};

const FormSend = () => {
  const [form] = Form.useForm();
  const [formValues, setFormValues] = useState({ recipientAddress: '', amount: '', memo: '' });
  const [isConfirmationModalVisible, setIsVisibleConfirmationModal] = useState(false);
  const [isSuccessTransferModalVisible, setIsSuccessTransferModalVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<BroadCastResult>({});
  const [isErrorTransferModalVisible, setIsErrorTransferModalVisible] = useState(false);
  const [inputPasswordVisible, setInputPasswordVisible] = useState(false);
  const [decryptedPhrase, setDecryptedPhrase] = useState('');
  const [walletAsset, setWalletAsset] = useRecoilState(walletAssetState);
  const currentSession = useRecoilValue(sessionState);

  const showConfirmationModal = () => {
    setInputPasswordVisible(false);

    setFormValues({
      ...form.getFieldsValue(),
      // Replace scientific notation to plain string values
      amount: fromScientificNotation(form.getFieldValue('amount')),
    });
    setIsVisibleConfirmationModal(true);
  };

  const showPasswordInput = () => {
    if (decryptedPhrase) {
      showConfirmationModal();
    }
    setInputPasswordVisible(true);
  };

  const onWalletDecryptFinish = async (password: string) => {
    const phraseDecrypted = await secretStoreService.decryptPhrase(
      password,
      currentSession.wallet.identifier,
    );
    setDecryptedPhrase(phraseDecrypted);
    showConfirmationModal();
  };

  const onConfirmTransfer = async () => {
    const memo = formValues.memo !== null && formValues.memo !== undefined ? formValues.memo : '';
    if (!decryptedPhrase) {
      return;
    }
    try {
      setConfirmLoading(true);
      const sendResult = await walletService.sendTransfer({
        toAddress: formValues.recipientAddress,
        amount: formValues.amount,
        asset: walletAsset,
        memo,
        decryptedPhrase,
      });

      setBroadcastResult(sendResult);

      setIsVisibleConfirmationModal(false);
      setConfirmLoading(false);
      setIsSuccessTransferModalVisible(true);
      setInputPasswordVisible(false);
      const currentWalletAsset = await walletService.retrieveDefaultWalletAsset(currentSession);
      setWalletAsset(currentWalletAsset);

      form.resetFields();
    } catch (e) {
      setIsVisibleConfirmationModal(false);
      setConfirmLoading(false);
      setInputPasswordVisible(false);
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

  const customAddressValidator = TransactionUtils.addressValidator(
    currentSession,
    walletAsset,
    AddressType.USER,
  );
  const customAmountValidator = TransactionUtils.validTransactionAmountValidator();

  const scaleUpBalance = scaledBalance(walletAsset); // From BaseXYZ balance to XYZ balance
  return (
    <Form
      {...layout}
      layout="vertical"
      form={form}
      name="control-ref"
      onFinish={showPasswordInput}
      requiredMark={false}
    >
      <Form.Item
        name="recipientAddress"
        label="Recipient Address"
        hasFeedback
        validateFirst
        rules={[
          { required: true, message: 'Recipient address is required' },
          customAddressValidator,
        ]}
      >
        <Input placeholder="tcro..." />
      </Form.Item>
      <div className="amount">
        <Form.Item
          name="amount"
          label="Sending Amount"
          hasFeedback
          validateFirst
          rules={[
            { required: true, message: 'Sending amount is required' },
            {
              pattern: /[^0]+/,
              message: 'Sending amount cannot be 0',
            },
            customAmountValidator,
            {
              max: scaleUpBalance,
              min: 0,
              type: 'number',
              message: 'Sending amount exceeds your available wallet balance',
            },
          ]}
        >
          <InputNumber />
        </Form.Item>
        <div className="available">
          <span>Available: </span>
          <div className="available-amount">
            {scaleUpBalance} {walletAsset.symbol}
          </div>
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
              Continue
            </Button>
          }
          okText="Confirm"
          footer={[
            <Button
              key="submit"
              type="primary"
              loading={confirmLoading}
              onClick={onConfirmTransfer}
            >
              Confirm
            </Button>,
            <Button key="back" type="link" onClick={handleCancel}>
              Cancel
            </Button>,
          ]}
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
              {formValues?.memo !== undefined &&
              formValues?.memo !== null &&
              formValues.memo !== '' ? (
                <div>{`${formValues?.memo}`}</div>
              ) : (
                <div>--</div>
              )}
            </div>
          </>
        </ModalPopup>

        <PasswordFormModal
          description="Input the app password decrypt wallet"
          okButtonText="Decrypt wallet"
          onCancel={() => {
            setInputPasswordVisible(false);
          }}
          onSuccess={onWalletDecryptFinish}
          onValidatePassword={async (password: string) => {
            const isValid = await secretStoreService.checkIfPasswordIsValid(password);
            return {
              valid: isValid,
              errMsg: !isValid ? 'The password provided is incorrect, Please try again' : '',
            };
          }}
          successText="Wallet decrypted successfully !"
          title="Provide app password"
          visible={inputPasswordVisible}
          successButtonText="Continue"
          confirmPassword={false}
        />

        <SuccessModalPopup
          isModalVisible={isSuccessTransferModalVisible}
          handleCancel={closeSuccessModal}
          handleOk={closeSuccessModal}
          title="Success!"
          button={null}
          footer={[
            <Button key="submit" type="primary" onClick={closeSuccessModal}>
              Ok
            </Button>,
          ]}
        >
          <>
            {broadcastResult?.code !== undefined &&
            broadcastResult?.code !== null &&
            broadcastResult.code === walletService.BROADCAST_TIMEOUT_CODE ? (
              <div className="description">
                The transaction timed out but it will be included in the subsequent blocks
              </div>
            ) : (
              <div className="description">The transaction was broadcasted successfully!</div>
            )}
            {/* <div className="description">{broadcastResult.transactionHash ?? ''}</div> */}
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
            <div className="description">
              The transfer transaction failed. Please try again later
            </div>
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
      <div className="header-description">
        Move funds from your transfer address to another transfer address or deposit stake to a
        staking address.
      </div>
      <Content>
        <div className="site-layout-background send-content">
          <div className="container">
            <FormSend />
          </div>
        </div>
      </Content>
      <Footer />
    </Layout>
  );
}

export default SendPage;
