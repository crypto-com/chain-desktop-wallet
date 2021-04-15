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
import { sessionState, walletAssetState, ledgerIsExpertModeState } from '../../recoil/atom';
import { BroadCastResult } from '../../models/Transaction';
import { TransactionUtils } from '../../utils/TransactionUtils';
import {
  adjustedTransactionAmount,
  fromScientificNotation,
  getCurrentMinAssetAmount,
  getNormalScaleAmount,
} from '../../utils/NumberUtils';
import { FIXED_DEFAULT_FEE } from '../../config/StaticConfig';
import { LEDGER_WALLET_TYPE, detectConditionsError } from '../../service/LedgerService';

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
  const [errorMessages, setErrorMessages] = useState([]);
  const [inputPasswordVisible, setInputPasswordVisible] = useState(false);
  const [decryptedPhrase, setDecryptedPhrase] = useState('');
  const [walletAsset, setWalletAsset] = useRecoilState(walletAssetState);
  const [ledgerIsExpertMode, setLedgerIsExpertMode] = useRecoilState(ledgerIsExpertModeState);
  const currentSession = useRecoilValue(sessionState);

  const showConfirmationModal = () => {
    setInputPasswordVisible(false);
    const transferInoputAmount = adjustedTransactionAmount(
      form.getFieldValue('amount'),
      walletAsset,
      currentSession.wallet.config.fee !== undefined &&
        currentSession.wallet.config.fee.networkFee !== undefined
        ? currentSession.wallet.config.fee.networkFee
        : FIXED_DEFAULT_FEE,
    );
    setFormValues({
      ...form.getFieldsValue(),
      // Replace scientific notation to plain string values
      amount: fromScientificNotation(transferInoputAmount),
    });
    setIsVisibleConfirmationModal(true);
  };

  const showPasswordInput = () => {
    if (decryptedPhrase || currentSession.wallet.walletType === LEDGER_WALLET_TYPE) {
      showConfirmationModal();
    } else {
      setInputPasswordVisible(true);
    }
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
    const { walletType } = currentSession.wallet;
    if (!decryptedPhrase && walletType !== LEDGER_WALLET_TYPE) {
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
        walletType,
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
      if (walletType === LEDGER_WALLET_TYPE) {
        setLedgerIsExpertMode(detectConditionsError(e.toString()));
      }

      setErrorMessages(e.message.split(': '));
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

  const scaleUpBalance = scaledBalance(walletAsset); // From BaseXYZ balance to XYZ balance
  const currentMinAssetAmount = getCurrentMinAssetAmount(walletAsset);
  const maximumSendAmount = scaleUpBalance;

  const customAddressValidator = TransactionUtils.addressValidator(
    currentSession,
    walletAsset,
    AddressType.USER,
  );
  const customAmountValidator = TransactionUtils.validTransactionAmountValidator();
  const customMaxValidator = TransactionUtils.maxValidator(
    maximumSendAmount,
    'Sending amount exceeds your available wallet balance',
  );
  const customMinValidator = TransactionUtils.minValidator(
    fromScientificNotation(currentMinAssetAmount),
    `Sending amount is lower than minimum allowed of ${fromScientificNotation(
      currentMinAssetAmount,
    )} ${walletAsset.symbol}`,
  );

  return (
    <Form
      {...layout}
      layout="vertical"
      form={form}
      name="control-ref"
      onFinish={showPasswordInput}
      requiredMark={false}
    >
      {/* <div className="sender">Sender Address</div> */}
      {/* <div className="sender">{currentSession.wallet.address}</div> */}

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
        <Input placeholder="Enter recipient address" />
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
            customMaxValidator,
            customMinValidator,
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
              <div className="label">Sender Address</div>
              <div className="address">{`${currentSession.wallet.address}`}</div>
            </div>
            <div className="item">
              <div className="label">To Address</div>
              <div className="address">{`${formValues?.recipientAddress}`}</div>
            </div>
            <div className="item">
              <div className="label">Amount</div>
              <div>{`${formValues?.amount} ${walletAsset.symbol}`}</div>
            </div>
            <div className="item">
              <div className="label">Transaction Fee</div>
              <div>{`${getNormalScaleAmount(
                currentSession.wallet.config.fee !== undefined &&
                  currentSession.wallet.config.fee.networkFee !== undefined
                  ? currentSession.wallet.config.fee.networkFee
                  : FIXED_DEFAULT_FEE,
                walletAsset,
              )} ${walletAsset.symbol}`}</div>
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
              The transfer transaction failed. Please try again later.
              <br />
              {errorMessages
                .filter((item, idx) => {
                  return errorMessages.indexOf(item) === idx;
                })
                .map((err, idx) => (
                  <div key={idx}>- {err}</div>
                ))}
              {ledgerIsExpertMode ? (
                <div>Please ensure that your have enabled Expert mode on your ledger device.</div>
              ) : (
                ''
              )}
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
