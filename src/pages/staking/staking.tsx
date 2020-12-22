import React, { useEffect, useRef, useState } from 'react';
import './staking.less';
import 'antd/dist/antd.css';
import { Button, Form, Input, Layout, Table, Tabs } from 'antd';
// import {ReactComponent as HomeIcon} from '../../assets/icon-home-white.svg';
import { useRecoilState, useRecoilValue } from 'recoil';
import ModalPopup from '../../components/ModalPopup/ModalPopup';
import { walletService } from '../../service/WalletService';
import SuccessModalPopup from '../../components/SuccessModalPopup/SuccessModalPopup';
import ErrorModalPopup from '../../components/ErrorModalPopup/ErrorModalPopup';
import PasswordFormModal from '../../components/PasswordForm/PasswordFormModal';
import { secretStoreService } from '../../storage/SecretStoreService';
import { walletAssetState, sessionState } from '../../recoil/atom';
import { scaledAmount, scaledBalance, UserAsset } from '../../models/UserAsset';
import { RewardTransaction } from '../../models/Transaction';

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
  const [transactionHash, setTransactionHash] = useState('');
  const [isErrorTransferModalVisible, setIsErrorTransferModalVisible] = useState(false);
  const [inputPasswordVisible, setInputPasswordVisible] = useState(false);
  const [decryptedPhrase, setDecryptedPhrase] = useState('');
  const [walletAsset, setWalletAsset] = useRecoilState(walletAssetState);
  const currentSession = useRecoilValue(sessionState);

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
      const hash = await walletService.sendDelegateTransaction({
        validatorAddress: formValues.validatorAddress,
        amount: formValues.amount,
        asset: walletAsset,
        memo,
        decryptedPhrase,
      });
      setTransactionHash(hash);

      setIsVisibleConfirmationModal(false);
      setConfirmLoading(false);
      setIsSuccessTransferModalVisible(true);
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
        name="validatorAddress"
        label="Validator address"
        rules={[
          { required: true, message: 'Validator address is required' },
          {
            pattern: RegExp(
              `^(${walletAsset.symbol
                .toString()
                .toLocaleLowerCase()}cncl)[a-zA-HJ-NP-Z0-9]{20,150}$`,
              'i',
            ),
            message: `The address provided is not a correct validator address`,
          },
        ]}
      >
        <Input placeholder="tcro..." />
      </Form.Item>
      <div className="amount">
        <Form.Item
          name="amount"
          label="Delegation Amount"
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
          <div className="available-amount">{scaledBalance(walletAsset)} CRO</div>
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
          okText="Confirm"
        >
          <>
            <div className="title">Confirm Transaction</div>
            <div className="description">Please review the below information. </div>
            <div className="item">
              <div className="label">Delegating to Validator</div>
              <div className="address">{`${formValues?.validatorAddress}`}</div>
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
            <div>Your delegation transaction was successful!</div>
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

const FormWithdrawStakingReward = () => {
  const [withdrawValues, setWithdrawValues] = useState({
    validatorAddress: '',
    rewardAmount: '',
  });
  const [isConfirmationModalVisible, setIsVisibleConfirmationModal] = useState(false);
  const [isSuccessTransferModalVisible, setIsSuccessTransferModalVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');
  const [isErrorTransferModalVisible, setIsErrorTransferModalVisible] = useState(false);
  const [inputPasswordVisible, setInputPasswordVisible] = useState(false);
  const [decryptedPhrase, setDecryptedPhrase] = useState('');
  const [walletAsset, setWalletAsset] = useRecoilState(walletAssetState);
  const currentSession = useRecoilValue(sessionState);
  const didMountRef = useRef(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [rewards, setRewards] = useState<RewardsTabularData[]>([]);

  const convertToTabularData = (allRewards: RewardTransaction[], currentAsset: UserAsset) => {
    return allRewards.map(reward => {
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
  }, [rewards]);

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
      const hash = await walletService.sendStakingRewardWithdrawalTx({
        validatorAddress: withdrawValues.validatorAddress,
        decryptedPhrase,
      });
      setTransactionHash(hash);

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

  const handleCancel = () => {
    setIsVisibleConfirmationModal(false);
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
      render: text => <a>{text}</a>,
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
        handleCancel={handleCancel}
        handleOk={onConfirmTransfer}
        confirmationLoading={confirmLoading}
        // button={
        //   <Button type="primary" htmlType="submit">
        //     Review
        //   </Button>
        // }
        okText="Confirm"
      >
        <>
          <div className="title">Confirm Transaction</div>
          <div className="description">Please review the below information. </div>
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
          <div>Your rewards withdrawal transaction was broadcasted successfully !</div>
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
          <div>The reward withdrawal transaction failed. Please try again later</div>
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
