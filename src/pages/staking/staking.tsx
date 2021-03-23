import React, { useEffect, useRef, useState } from 'react';
import './staking.less';
import 'antd/dist/antd.css';
import { AutoComplete, Button, Form, Input, InputNumber, Layout, Table, Tabs } from 'antd';
// import {ReactComponent as HomeIcon} from '../../assets/icon-home-white.svg';
import { useRecoilState, useRecoilValue } from 'recoil';
import { AddressType } from '@crypto-com/chain-jslib/lib/dist/utils/address';
import ModalPopup from '../../components/ModalPopup/ModalPopup';
import { walletService } from '../../service/WalletService';
import SuccessModalPopup from '../../components/SuccessModalPopup/SuccessModalPopup';
import ErrorModalPopup from '../../components/ErrorModalPopup/ErrorModalPopup';
import PasswordFormModal from '../../components/PasswordForm/PasswordFormModal';
import { secretStoreService } from '../../storage/SecretStoreService';
import { walletAssetState, sessionState, validatorTopListState } from '../../recoil/atom';
import { scaledAmount, scaledBalance, UserAsset } from '../../models/UserAsset';
import { BroadCastResult, RewardTransaction } from '../../models/Transaction';
import { TransactionUtils } from '../../utils/TransactionUtils';
import {
  adjustedTransactionAmount,
  fromScientificNotation,
  getCurrentMinAssetAmount,
} from '../../utils/NumberUtils';

const { Header, Content, Footer } = Layout;
const { TabPane } = Tabs;
const layout = {
  // labelCol: { span: 8 },
  // wrapperCol: { span: 16 },
};
const tailLayout = {
  // wrapperCol: { offset: 8, span: 16 },
};

interface RewardsTabularData {
  key: string;
  rewardAmount: string;
  validatorAddress: string;
}

const FormDelegationRequest = () => {
  const [form] = Form.useForm();
  const [formValues, setFormValues] = useState({
    validatorAddress: '',
    amount: '',
    memo: '',
  });
  const [isConfirmationModalVisible, setIsVisibleConfirmationModal] = useState(false);
  const [isSuccessTransferModalVisible, setIsSuccessTransferModalVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<BroadCastResult>({});
  const [isErrorTransferModalVisible, setIsErrorTransferModalVisible] = useState(false);
  const [inputPasswordVisible, setInputPasswordVisible] = useState(false);
  const [decryptedPhrase, setDecryptedPhrase] = useState('');
  const [walletAsset, setWalletAsset] = useRecoilState(walletAssetState);
  const currentSession = useRecoilValue(sessionState);
  const [validatorTopList, setValidatorTopList] = useRecoilState(validatorTopListState);
  const didMountRef = useRef(false);

  useEffect(() => {
    let unmounted = false;

    const syncValidatorsData = async () => {
      const currentValidatorList =
        validatorTopList.length === 0
          ? await walletService.getLatestTopValidators()
          : validatorTopList;

      if (!unmounted) {
        setValidatorTopList(currentValidatorList);
      }
    };

    if (!didMountRef.current) {
      syncValidatorsData();
      didMountRef.current = true;
    }

    return () => {
      unmounted = true;
    };
  }, [validatorTopList]);

  const showConfirmationModal = () => {
    setInputPasswordVisible(false);
    const stakeInputAmount = adjustedTransactionAmount(form.getFieldValue('amount'), walletAsset);

    setFormValues({
      ...form.getFieldsValue(),
      // Replace scientific notation to plain string values
      amount: fromScientificNotation(stakeInputAmount),
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

  const onConfirmDelegation = async () => {
    const memo = formValues.memo !== null && formValues.memo !== undefined ? formValues.memo : '';
    if (!decryptedPhrase) {
      return;
    }
    try {
      setConfirmLoading(true);
      const { walletType } = currentSession.wallet;
      const stakingResult = await walletService.sendDelegateTransaction({
        validatorAddress: formValues.validatorAddress,
        amount: formValues.amount,
        asset: walletAsset,
        memo,
        decryptedPhrase,
        walletType,
      });
      setBroadcastResult(stakingResult);

      setIsVisibleConfirmationModal(false);
      setConfirmLoading(false);
      setIsSuccessTransferModalVisible(true);
      const currentWalletAsset = await walletService.retrieveDefaultWalletAsset(currentSession);
      setWalletAsset(currentWalletAsset);
      setInputPasswordVisible(false);

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

  const currentMinAssetAmount = getCurrentMinAssetAmount(walletAsset);
  const maximumStakeAmount = scaledBalance(walletAsset);

  const customAmountValidator = TransactionUtils.validTransactionAmountValidator();
  const customAddressValidator = TransactionUtils.addressValidator(
    currentSession,
    walletAsset,
    AddressType.VALIDATOR,
  );
  const customMaxValidator = TransactionUtils.maxValidator(
    maximumStakeAmount,
    'Staking amount exceeds your available wallet balance',
  );
  const customMinValidator = TransactionUtils.minValidator(
    fromScientificNotation(currentMinAssetAmount),
    `Staking amount is lower than minimum allowed of ${fromScientificNotation(
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
      <Form.Item
        name="validatorAddress"
        label="Validator address"
        hasFeedback
        validateFirst
        rules={[
          { required: true, message: 'Validator address is required' },
          customAddressValidator,
        ]}
      >
        <AutoComplete
          options={[
            {
              label: 'Top Validators',
              options: validatorTopList.map(e => {
                return {
                  value: e.validatorAddress,
                };
              }),
            },
          ]}
          placeholder="Enter validator address"
        />
      </Form.Item>
      <div className="amount">
        <Form.Item
          name="amount"
          label="Delegation Amount"
          hasFeedback
          validateFirst
          rules={[
            { required: true, message: 'Staking amount is required' },
            {
              pattern: /[^0]+/,
              message: 'Staking amount cannot be 0',
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
          handleOk={onConfirmDelegation}
          confirmationLoading={confirmLoading}
          button={
            <Button type="primary" htmlType="submit">
              Review
            </Button>
          }
          footer={[
            <Button
              key="submit"
              type="primary"
              loading={confirmLoading}
              onClick={onConfirmDelegation}
            >
              Confirm
            </Button>,
            <Button key="back" type="link" onClick={handleCancel}>
              Cancel
            </Button>,
          ]}
          okText="Confirm"
        >
          <>
            <div className="title">Confirm Transaction</div>
            <div className="description">Please review the below information. </div>
            <div className="item">
              <div className="label">Sender Address</div>
              <div className="address">{`${currentSession.wallet.address}`}</div>
            </div>
            <div className="item">
              <div className="label">Delegating to Validator</div>
              <div className="address">{`${formValues?.validatorAddress}`}</div>
            </div>
            <div className="item">
              <div className="label">Amount</div>
              <div>{`${formValues?.amount} ${walletAsset.symbol}`}</div>
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
              <div className="description">Your delegation transaction was successful !</div>
            )}
            {/* <div>{broadcastResult.transactionHash ?? ''}</div> */}
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
              The staking transaction failed. Please try again later
            </div>
          </>
        </ErrorModalPopup>
      </Form.Item>
    </Form>
  );
};

const FormWithdrawStakingReward = () => {
  const [withdrawValues, setWithdrawValues] = useState({
    validatorAddress: '',
    rewardAmount: '',
  });
  const [isConfirmationModalVisible, setIsVisibleConfirmationModal] = useState(false);
  const [isSuccessTransferModalVisible, setIsSuccessTransferModalVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<BroadCastResult>({});
  const [isErrorTransferModalVisible, setIsErrorTransferModalVisible] = useState(false);
  const [inputPasswordVisible, setInputPasswordVisible] = useState(false);
  const [decryptedPhrase, setDecryptedPhrase] = useState('');
  const [walletAsset, setWalletAsset] = useRecoilState(walletAssetState);
  const currentSession = useRecoilValue(sessionState);
  const didMountRef = useRef(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [rewards, setRewards] = useState<RewardsTabularData[]>([]);

  const convertToTabularData = (allRewards: RewardTransaction[], currentAsset: UserAsset) => {
    return allRewards
      .filter(reward => Number(reward.amount) > 0)
      .map(reward => {
        const rewardData: RewardsTabularData = {
          key: `${reward.validatorAddress}${reward.amount}`,
          rewardAmount: `${scaledAmount(reward.amount, currentAsset.decimals)} ${
            currentAsset.symbol
          }`,
          validatorAddress: reward.validatorAddress,
        };
        return rewardData;
      });
  };

  useEffect(() => {
    const syncRewardsData = async () => {
      const allRewards: RewardTransaction[] = await walletService.retrieveAllRewards(
        currentSession.wallet.identifier,
      );

      const rewardsTabularData = convertToTabularData(allRewards, walletAsset);
      setRewards(rewardsTabularData);
    };

    if (!didMountRef.current) {
      syncRewardsData();
      didMountRef.current = true;
    }
  }, [rewards, currentSession, walletAsset]);

  const showConfirmationModal = () => {
    setInputPasswordVisible(false);
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
    if (!decryptedPhrase) {
      setIsVisibleConfirmationModal(false);
      return;
    }
    try {
      setConfirmLoading(true);
      const { walletType } = currentSession.wallet;
      const rewardWithdrawResult = await walletService.sendStakingRewardWithdrawalTx({
        validatorAddress: withdrawValues.validatorAddress,
        decryptedPhrase,
        walletType,
      });
      setBroadcastResult(rewardWithdrawResult);

      setIsVisibleConfirmationModal(false);
      setConfirmLoading(false);
      setIsSuccessTransferModalVisible(true);
      const currentWalletAsset = await walletService.retrieveDefaultWalletAsset(currentSession);
      setWalletAsset(currentWalletAsset);
    } catch (e) {
      setIsVisibleConfirmationModal(false);
      setConfirmLoading(false);
      setInputPasswordVisible(false);
      setIsErrorTransferModalVisible(true);
      // eslint-disable-next-line no-console
      console.log('Error occurred while transfer', e);
    }
  };

  const handleCancelConfirmationModal = () => {
    setIsVisibleConfirmationModal(false);
    setInputPasswordVisible(false);
  };

  const closeSuccessModal = () => {
    setIsSuccessTransferModalVisible(false);
  };

  const closeErrorModal = () => {
    setIsErrorTransferModalVisible(false);
  };

  const rewardColumns = [
    {
      title: 'Validator Address',
      dataIndex: 'validatorAddress',
      key: 'validatorAddress',
      render: text => (
        <a
          target="_blank"
          rel="noreferrer"
          href={`${currentSession.wallet.config.explorerUrl}/validator/${text}`}
        >
          {text}
        </a>
      ),
    },
    {
      title: 'Reward Amount',
      dataIndex: 'rewardAmount',
      key: 'rewardAmount',
    },
    {
      title: 'Action',
      dataIndex: 'withdrawAction',
      key: 'withdrawAction',
      render: () => (
        <a
          onClick={() => {
            setTimeout(() => {
              showPasswordInput();
            }, 200);
          }}
        >
          Withdraw Reward
        </a>
      ),
    },
  ];

  const StakingTable = () => {
    return (
      <Table
        columns={rewardColumns}
        dataSource={rewards}
        onRow={record => {
          return {
            onClick: () => {
              setWithdrawValues({
                validatorAddress: record.validatorAddress,
                rewardAmount: record.rewardAmount,
              });
            },
          };
        }}
      />
    );
  };

  return (
    <div>
      <StakingTable />
      <ModalPopup
        isModalVisible={isConfirmationModalVisible}
        handleCancel={handleCancelConfirmationModal}
        handleOk={onConfirmTransfer}
        confirmationLoading={confirmLoading}
        footer={[
          <Button key="submit" type="primary" loading={confirmLoading} onClick={onConfirmTransfer}>
            Confirm
          </Button>,
          <Button key="back" type="link" onClick={handleCancelConfirmationModal}>
            Cancel
          </Button>,
        ]}
        okText="Confirm"
      >
        <>
          <div className="title">Confirm Transaction</div>
          <div className="description">Please review the below information. </div>
          <div className="item">
            <div className="label">Sender Address</div>
            <div className="address">{`${currentSession.wallet.address}`}</div>
          </div>
          <div className="item">
            <div className="label">Withdraw Reward From Validator</div>
            <div className="address">{`${withdrawValues?.validatorAddress}`}</div>
          </div>
          <div className="item">
            <div className="label">Rewards</div>
            <div>{`${withdrawValues.rewardAmount}`}</div>
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
            <div className="description">
              Your rewards withdrawal transaction was broadcasted successfully !
            </div>
          )}
          {/* <div>{broadcastResult.transactionHash ?? ''}</div> */}
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
            The reward withdrawal transaction failed. Please try again later
          </div>
        </>
      </ErrorModalPopup>
    </div>
  );
};

function StakingPage() {
  return (
    <Layout className="site-layout">
      <Header className="site-layout-background">Staking</Header>

      <Content>
        <Tabs defaultActiveKey="1">
          <TabPane tab="Staking Rewards" key="1">
            <div className="site-layout-background stake-content">
              <div className="container">
                <div className="description">Withdraw rewards from delegated funds.</div>
                <FormWithdrawStakingReward />
              </div>
            </div>
          </TabPane>
          <TabPane tab="Delegate Funds" key="2">
            <div className="site-layout-background stake-content">
              <div className="container">
                <div className="description">Delegate funds to validator.</div>
                <FormDelegationRequest />
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
