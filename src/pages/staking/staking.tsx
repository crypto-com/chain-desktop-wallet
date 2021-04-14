import React, { useEffect, useRef, useState } from 'react';
import './staking.less';
import 'antd/dist/antd.css';
import { Button, Checkbox, Form, Input, InputNumber, Layout, Table, Tabs } from 'antd';
import { OrderedListOutlined } from '@ant-design/icons';
import { useRecoilState, useRecoilValue } from 'recoil';
import { AddressType } from '@crypto-com/chain-jslib/lib/dist/utils/address';
import Big from 'big.js';
import numeral from 'numeral';
import ModalPopup from '../../components/ModalPopup/ModalPopup';
import { walletService } from '../../service/WalletService';
import SuccessModalPopup from '../../components/SuccessModalPopup/SuccessModalPopup';
import ErrorModalPopup from '../../components/ErrorModalPopup/ErrorModalPopup';
import PasswordFormModal from '../../components/PasswordForm/PasswordFormModal';
import { secretStoreService } from '../../storage/SecretStoreService';
import {
  marketState,
  sessionState,
  walletAssetState,
  ledgerIsExpertModeState,
} from '../../recoil/atom';
import { AssetMarketPrice, scaledAmount, scaledBalance, UserAsset } from '../../models/UserAsset';
import { BroadCastResult, RewardTransaction, ValidatorModel } from '../../models/Transaction';
import { TransactionUtils } from '../../utils/TransactionUtils';
import { FIXED_DEFAULT_FEE } from '../../config/StaticConfig';
import {
  adjustedTransactionAmount,
  fromScientificNotation,
  getCurrentMinAssetAmount,
  getUIDynamicAmount,
} from '../../utils/NumberUtils';
import { middleEllipsis, ellipsis } from '../../utils/utils';
import { LEDGER_WALLET_TYPE, detectLedgerNormalMode } from '../../service/LedgerService';

const { Header, Content, Footer } = Layout;
const { Search } = Input;
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
  rewardMarketPrice: string;
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
  const [errorMessages, setErrorMessages] = useState([]);
  const [inputPasswordVisible, setInputPasswordVisible] = useState(false);
  const [decryptedPhrase, setDecryptedPhrase] = useState('');
  const [isValidatorListVisible, setIsValidatorListVisible] = useState(false);
  const [showMemo, setShowMemo] = useState(false);
  const [walletAsset, setWalletAsset] = useRecoilState(walletAssetState);
  const currentSession = useRecoilValue(sessionState);
  const [ledgerIsExpertMode, setLedgerIsExpertMode] = useRecoilState(ledgerIsExpertModeState);
  const [validatorTopList, setValidatorTopList] = useState<ValidatorModel[]>([]);
  const didMountRef = useRef(false);

  const processValidatorList = (validatorList: ValidatorModel[]) => {
    return validatorList.map((validator, idx) => {
      const validatorModel = {
        ...validator,
        key: `${idx}`,
      };
      return validatorModel;
    });
  };

  useEffect(() => {
    let unmounted = false;

    const syncValidatorsData = async () => {
      const currentValidatorList = await walletService.retrieveTopValidators(
        currentSession.wallet.config.network.chainId,
      );

      if (!unmounted) {
        const validatorList = processValidatorList(currentValidatorList);
        setValidatorTopList(validatorList);
      }
    };

    if (!didMountRef.current) {
      syncValidatorsData();
      didMountRef.current = true;
    }

    return () => {
      unmounted = true;
    };
  }, [validatorTopList, setValidatorTopList]);

  const showConfirmationModal = () => {
    setInputPasswordVisible(false);

    const networkFee =
      currentSession.wallet.config.fee !== undefined &&
      currentSession.wallet.config.fee.networkFee !== undefined
        ? currentSession.wallet.config.fee.networkFee
        : FIXED_DEFAULT_FEE;

    const stakeInputAmount = adjustedTransactionAmount(
      form.getFieldValue('amount'),
      walletAsset,
      networkFee,
    );

    setFormValues({
      ...form.getFieldsValue(),
      // Replace scientific notation to plain string values
      amount: fromScientificNotation(stakeInputAmount),
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

  const onConfirmDelegation = async () => {
    const memo = formValues.memo !== null && formValues.memo !== undefined ? formValues.memo : '';
    const { walletType } = currentSession.wallet;
    if (!decryptedPhrase && walletType !== LEDGER_WALLET_TYPE) {
      return;
    }
    try {
      setConfirmLoading(true);
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
      if (walletType === LEDGER_WALLET_TYPE) {
        setLedgerIsExpertMode(await detectLedgerNormalMode());
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

  const validatorColumns = [
    {
      title: 'Name',
      dataIndex: 'validatorName',
      key: 'validatorName',
      render: (validatorName, record) => (
        <a
          data-original={record.validatorAddress}
          target="_blank"
          rel="noreferrer"
          href={`${currentSession.wallet.config.explorerUrl}/validator/${record.validatorAddress}`}
        >
          {ellipsis(validatorName, 24)}
        </a>
      ),
    },
    {
      title: 'Website',
      dataIndex: 'validatorWebSite',
      key: 'validatorWebSite',
      render: validatorWebSite => {
        return validatorWebSite === '' ? (
          'n.a.'
        ) : (
          <a
            data-original={validatorWebSite}
            target="_blank"
            rel="noreferrer"
            href={`${validatorWebSite}`}
          >
            {ellipsis(validatorWebSite, 24)}
          </a>
        );
      },
    },
    {
      title: 'Address',
      dataIndex: 'validatorAddress',
      key: 'validatorAddress',
      render: validatorAddress => (
        <a
          data-original={validatorAddress}
          title={validatorAddress}
          target="_blank"
          rel="noreferrer"
          href={`${currentSession.wallet.config.explorerUrl}/validator/${validatorAddress}`}
        >
          {middleEllipsis(validatorAddress, 10)}
        </a>
      ),
    },
    {
      title: 'Voting Power',
      dataIndex: 'currentTokens',
      key: 'currentTokens',
      sorter: (a, b) => new Big(a.currentTokens).cmp(new Big(b.currentTokens)),
      defaultSortOrder: 'descend' as any,
      render: currentTokens => {
        return (
          <span>
            {numeral(scaledAmount(currentTokens, 8)).format('0,0.00')}{' '}
            {currentSession.wallet.config.network.coin.croDenom.toUpperCase()}
          </span>
        );
      },
    },
    {
      title: 'Rate',
      dataIndex: 'currentCommissionRate',
      key: 'currentCommissionRate',
      sorter: (a, b) => new Big(a.currentCommissionRate).cmp(new Big(b.currentCommissionRate)),
      render: currentCommissionRate => (
        <span>{new Big(currentCommissionRate).times(100).toFixed(2)}%</span>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: record => (
        <a
          onClick={() => {
            setIsValidatorListVisible(false);
            form.setFieldsValue({
              validatorAddress: record.validatorAddress,
            });
          }}
        >
          Select
        </a>
      ),
    },
  ];

  function onShowMemoChange() {
    setShowMemo(!showMemo);
  }

  return (
    <Form
      {...layout}
      layout="vertical"
      form={form}
      name="control-ref"
      onFinish={showPasswordInput}
      requiredMark={false}
    >
      <>
        <ModalPopup
          isModalVisible={isValidatorListVisible}
          handleCancel={() => setIsValidatorListVisible(false)}
          handleOk={() => setIsValidatorListVisible(false)}
          className="validator-modal"
          footer={[]}
          okText="Confirm"
          width={1000}
        >
          <div className="title">Validator List</div>
          <div className="description">Please select one of the validator.</div>
          <div className="item">
            <Table
              dataSource={validatorTopList}
              columns={validatorColumns}
              pagination={{ showSizeChanger: false }}
            />
          </div>
        </ModalPopup>
      </>
      <Form.Item
        name="validatorAddress"
        label="Validator address"
        hasFeedback
        validateFirst
        rules={[
          { required: true, message: 'Validator address is required' },
          customAddressValidator,
        ]}
        className="input-validator-address"
      >
        <Search
          placeholder="Enter validator address"
          enterButton={<OrderedListOutlined />}
          onSearch={() => setIsValidatorListVisible(true)}
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
      <Checkbox onChange={onShowMemoChange} checked={showMemo}>
        Want to set custom memo?
      </Checkbox>
      {showMemo ? (
        <div style={{ paddingTop: '12px' }}>
          <Form.Item name="memo" label="Memo (Optional)">
            <Input />
          </Form.Item>
        </div>
      ) : (
        <div />
      )}
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
              The staking transaction failed. Please try again later.
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

const FormWithdrawStakingReward = () => {
  const [withdrawValues, setWithdrawValues] = useState({
    validatorAddress: '',
    rewardAmount: '',
    rewardMarketPrice: '',
  });
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
  const marketData = useRecoilValue(marketState);
  const currentSession = useRecoilValue(sessionState);
  const didMountRef = useRef(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [rewards, setRewards] = useState<RewardsTabularData[]>([]);

  const convertToTabularData = (
    allRewards: RewardTransaction[],
    currentAsset: UserAsset,
    currentMarketPrice: AssetMarketPrice,
  ) => {
    return allRewards
      .filter(reward => Big(reward.amount).gte(Big(0)))
      .map(reward => {
        const rewardAmount = getUIDynamicAmount(reward.amount, currentAsset);
        const marketPrice = marketData && marketData.price ? new Big(currentMarketPrice.price) : '';
        const rewardMarketPrice =
          marketData && marketData.price ? new Big(rewardAmount).times(marketPrice).toFixed(2) : '';
        const rewardData: RewardsTabularData = {
          key: `${reward.validatorAddress}${reward.amount}`,
          rewardAmount: `${rewardAmount} ${currentAsset.symbol}`,
          rewardMarketPrice:
            rewardMarketPrice !== ''
              ? `${numeral(rewardMarketPrice).format('$0,0.00')} ${marketData?.currency}`
              : ``,
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

      const rewardsTabularData = convertToTabularData(allRewards, walletAsset, marketData);
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
    const { walletType } = currentSession.wallet;
    if (!decryptedPhrase && currentSession.wallet.walletType !== LEDGER_WALLET_TYPE) {
      setIsVisibleConfirmationModal(false);
      return;
    }
    try {
      setConfirmLoading(true);
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
      if (walletType === LEDGER_WALLET_TYPE) {
        setLedgerIsExpertMode(await detectLedgerNormalMode());
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
      key: 'rewardAmount',
      render: record => {
        return (
          <>
            {record.rewardAmount} <br />
            <span style={{ color: '#1199fa' }}>{record.rewardMarketPrice}</span>
          </>
        );
      },
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
                rewardMarketPrice: record.rewardMarketPrice,
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
        className="reward-modal"
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
            <div className="fiat">{`${withdrawValues.rewardMarketPrice}`}</div>
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
            The reward withdrawal transaction failed. Please try again later.
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
