import React, { useState } from 'react';
import './send.less';
import 'antd/dist/antd.css';
import { Button, Form, Input, Layout } from 'antd';
import { useRecoilState } from 'recoil';

import ModalPopup from '../../components/ModalPopup/ModalPopup';
import { walletService } from '../../service/WalletService';
import SuccessModalPopup from '../../components/SuccessModalPopup/SuccessModalPopup';
import ErrorModalPopup from '../../components/ErrorModalPopup/ErrorModalPopup';
import PasswordFormModal from '../../components/PasswordForm/PasswordFormModal';
import { secretStoreService } from '../../storage/SecretStoreService';
import { scaledBalance } from '../../models/UserAsset';
import { walletAssetState } from '../../recoil/atom';
import { BroadCastResult } from '../../models/Transaction';

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

  const showConfirmationModal = () => {
    setInputPasswordVisible(false);
    setFormValues(form.getFieldsValue());
    setIsVisibleConfirmationModal(true);
  };

  const showPasswordInput = () => {
    if (decryptedPhrase) {
      showConfirmationModal();
    }
    setInputPasswordVisible(true);
  };

  const onWalletDecryptFinish = async (password: string) => {
    const currentSession = await walletService.retrieveCurrentSession();
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
      const currentSession = await walletService.retrieveCurrentSession();
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
        rules={[
          { required: true, message: 'Recipient address is required' },
          {
            pattern: RegExp(
              `^(${walletAsset.symbol.toString().toLocaleLowerCase()})[a-zA-HJ-NP-Z0-9]{20,120}$`,
              'i',
            ),
            message: `The recipient address should be a valid ${walletAsset.symbol
              .toString()
              .toUpperCase()} address`,
          },
        ]}
      >
        <Input placeholder="tcro..." />
      </Form.Item>
      <div className="amount">
        <Form.Item
          name="amount"
          label="Sending Amount"
          rules={[
            { required: true, message: 'Transfer amount is required' },
            {
              pattern: /^(0|[1-9]\d*)?(\.\d+)?(?<=\d)$/,
              message: 'Transfer amount should be a number',
            },
          ]}
        >
          <Input />
        </Form.Item>
        <div className="available">
          <span>Available: </span>
          <div className="available-amount">
            {scaledBalance(walletAsset)} {walletAsset.symbol}
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

            {formValues?.memo !== undefined &&
            formValues?.memo !== null &&
            formValues.memo !== '' ? (
              <div className="item">
                <div className="label">Memo</div>
                <div>{`${formValues?.memo}`}</div>
              </div>
            ) : (
              <div />
            )}
          </>
        </ModalPopup>

        <PasswordFormModal
          description="Input the application password decrypt wallet"
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
          title="Provide application password"
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
              Ok Thanks
            </Button>,
          ]}
        >
          <>
            {broadcastResult?.code !== undefined &&
            broadcastResult?.code !== null &&
            broadcastResult.code === walletService.BROADCAST_TIMEOUT_CODE ? (
              <div>The transaction timed out but it will be included in the subsequent blocks</div>
            ) : (
              <div>The transaction was broad-casted successfully !</div>
            )}
            <div>{broadcastResult.transactionHash ?? ''}</div>
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
