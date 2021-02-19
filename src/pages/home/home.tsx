import React, { useEffect, useRef, useState } from 'react';
import './home.less';
import 'antd/dist/antd.css';
import {
  Alert,
  Button,
  Form,
  InputNumber,
  Layout,
  notification,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { useRecoilState, useRecoilValue } from 'recoil';
import {
  scaledAmount,
  scaledBalance,
  scaledStakingBalance,
  UserAsset,
} from '../../models/UserAsset';
import { sessionState, walletAssetState } from '../../recoil/atom';
import { walletService } from '../../service/WalletService';
import {
  BroadCastResult,
  StakingTransactionData,
  TransactionDirection,
  TransactionStatus,
  TransferTransactionData,
} from '../../models/Transaction';
import { Session } from '../../models/Session';
import ModalPopup from '../../components/ModalPopup/ModalPopup';
import PasswordFormModal from '../../components/PasswordForm/PasswordFormModal';
import { secretStoreService } from '../../storage/SecretStoreService';
import SuccessModalPopup from '../../components/SuccessModalPopup/SuccessModalPopup';
import ErrorModalPopup from '../../components/ErrorModalPopup/ErrorModalPopup';
import { NOT_KNOWN_YET_VALUE, WalletConfig } from '../../config/StaticConfig';

const { Text } = Typography;

// import {ReactComponent as HomeIcon} from '../../assets/icon-home-white.svg';

const { Header, Content, Footer } = Layout;
const { TabPane } = Tabs;
const layout = {
  // labelCol: { span: 8 },
  // wrapperCol: { span: 16 },
};

const middleEllipsis = (str: string) => {
  return `${str.substr(0, 12)}...${str.substr(str.length - 12, str.length)}`;
};

interface StakingTabularData {
  key: string;
  stakedAmountWithSymbol: string;
  stakedAmount: string;
  validatorAddress: string;
  delegatorAddress: string;
}

interface TransferTabularData {
  key: string;
  transactionHash: string;
  recipientAddress: string;
  amount: string;
  time: string;
  direction: TransactionDirection;
  status: TransactionStatus;
}

function convertDelegations(allDelegations: StakingTransactionData[], currentAsset: UserAsset) {
  return allDelegations
    .map(dlg => {
      const stakedAmount = scaledAmount(dlg.stakedAmount, currentAsset.decimals).toString();
      const data: StakingTabularData = {
        key: dlg.validatorAddress + dlg.stakedAmount,
        delegatorAddress: dlg.delegatorAddress,
        validatorAddress: dlg.validatorAddress,
        stakedAmountWithSymbol: `${stakedAmount} ${currentAsset.symbol}`,
        stakedAmount,
      };
      return data;
    })
    .filter(dlg => Number(dlg.stakedAmount) > 0);
}

function convertTransfers(
  allTransfers: TransferTransactionData[],
  currentAsset: UserAsset,
  sessionData: Session,
) {
  const { address } = sessionData.wallet;

  function getDirection(from: string, to: string): TransactionDirection {
    if (address === from && address === to) {
      return TransactionDirection.SELF;
    }
    if (address === from) {
      return TransactionDirection.OUTGOING;
    }
    return TransactionDirection.INCOMING;
  }

  return allTransfers.map(transfer => {
    const transferAmount = scaledAmount(transfer.amount, currentAsset.decimals).toString();
    const data: TransferTabularData = {
      key: transfer.hash + transfer.receiverAddress + transfer.amount,
      recipientAddress: transfer.receiverAddress,
      transactionHash: transfer.hash,
      time: new Date(transfer.date).toLocaleString(),
      amount: `${transferAmount}  ${currentAsset.symbol}`,
      direction: getDirection(transfer.senderAddress, transfer.receiverAddress),
      status: transfer.status,
    };
    return data;
  });
}

const isWalletNotLive = (config: WalletConfig) => {
  return config.nodeUrl === NOT_KNOWN_YET_VALUE && config.indexingUrl === NOT_KNOWN_YET_VALUE;
};

function HomePage() {
  const currentSession = useRecoilValue(sessionState);
  const [delegations, setDelegations] = useState<StakingTabularData[]>([]);
  const [transfers, setTransfers] = useState<TransferTabularData[]>([]);
  const [userAsset, setUserAsset] = useRecoilState(walletAssetState);
  const didMountRef = useRef(false);

  // Undelegate action related states changes
  const [form] = Form.useForm();

  const [isConfirmationModalVisible, setIsVisibleConfirmationModal] = useState(false);
  const [isSuccessTransferModalVisible, setIsSuccessTransferModalVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [isErrorTransferModalVisible, setIsErrorTransferModalVisible] = useState(false);
  const [inputPasswordVisible, setInputPasswordVisible] = useState(false);

  const [hasShownNotLiveWallet, setHasShownNotLiveWallet] = useState(false);

  const [decryptedPhrase, setDecryptedPhrase] = useState('');
  const [broadcastResult, setBroadcastResult] = useState<BroadCastResult>({});

  const [undelegateFormValues, setUndelegateFormValues] = useState({
    validatorAddress: '',
    undelegateAmount: '',
  });

  const showWalletStateNotification = (config: WalletConfig) => {
    setTimeout(async () => {
      if (isWalletNotLive(config) && !hasShownNotLiveWallet) {
        notification.warning({
          message: `Wallet Info`,
          description: `The wallet created will be limited only to display address because its ${config.name} configuration is not live yet`,
          placement: 'topRight',
          duration: 0,
        });
      }
    }, 200);
  };

  useEffect(() => {
    let unmounted = false;

    const syncAssetData = async () => {
      const sessionData = await walletService.retrieveCurrentSession();
      const currentAsset = await walletService.retrieveDefaultWalletAsset(sessionData);
      const allDelegations: StakingTransactionData[] = await walletService.retrieveAllDelegations(
        sessionData.wallet.identifier,
      );
      const allTransfers: TransferTransactionData[] = await walletService.retrieveAllTransfers(
        sessionData.wallet.identifier,
      );

      const stakingTabularData = convertDelegations(allDelegations, currentAsset);
      const transferTabularData = convertTransfers(allTransfers, currentAsset, sessionData);

      if (!unmounted) {
        showWalletStateNotification(currentSession.wallet.config);

        setDelegations(stakingTabularData);
        setTransfers(transferTabularData);
        setUserAsset(currentAsset);
        setHasShownNotLiveWallet(true);
      }
    };

    if (!didMountRef.current) {
      syncAssetData();
      didMountRef.current = true;
    }

    return () => {
      unmounted = true;
    };
  }, [delegations, userAsset, hasShownNotLiveWallet]);

  const TransactionColumns = [
    {
      title: 'Transaction Hash',
      dataIndex: 'transactionHash',
      key: 'transactionHash',
      render: text => (
        <a
          data-original={text}
          target="_blank"
          rel="noreferrer"
          href={`${currentSession.wallet.config.explorerUrl}/tx/${text}`}
        >
          {middleEllipsis(text)}
        </a>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (text, record: TransferTabularData) => {
        const color = record.direction === TransactionDirection.OUTGOING ? 'danger' : 'success';
        const sign = record.direction === TransactionDirection.OUTGOING ? '-' : '+';

        return (
          <Text type={color}>
            {sign}
            {text}
          </Text>
        );
      },
    },
    {
      title: 'Recipient',
      dataIndex: 'recipientAddress',
      key: 'recipientAddress',
      render: text => <div data-original={text}>{middleEllipsis(text)}</div>,
    },
    {
      title: 'Time',
      dataIndex: 'time',
      key: 'time',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (text, record: TransferTabularData) => {
        // const color = record.direction === TransactionDirection.OUTGOING ? 'danger' : 'success';
        // const sign = record.direction === TransactionDirection.OUTGOING ? '-' : '+';
        let statusColor;
        if (record.status === TransactionStatus.SUCCESS) {
          statusColor = 'success';
        } else if (record.status === TransactionStatus.FAILED) {
          statusColor = 'error';
        } else {
          statusColor = 'processing';
        }

        return (
          <Tag style={{ border: 'none', padding: '5px 14px' }} color={statusColor}>
            {record.status.toString()}
          </Tag>
        );
      },
    },
  ];

  const showConfirmationModal = () => {
    setInputPasswordVisible(false);
    setIsVisibleConfirmationModal(true);
  };

  const onWalletDecryptFinish = async (password: string) => {
    const phraseDecrypted = await secretStoreService.decryptPhrase(
      password,
      currentSession.wallet.identifier,
    );
    setDecryptedPhrase(phraseDecrypted);
    showConfirmationModal();
  };

  const showPasswordInput = () => {
    if (decryptedPhrase) {
      showConfirmationModal();
    }
    setInputPasswordVisible(true);
  };

  const handleCancelConfirmationModal = () => {
    setIsVisibleConfirmationModal(false);
    setInputPasswordVisible(false);
  };

  const closeSuccessModal = () => {
    setIsSuccessTransferModalVisible(false);
    setInputPasswordVisible(false);
  };

  const closeErrorModal = () => {
    setIsErrorTransferModalVisible(false);
    setInputPasswordVisible(false);
  };

  const onConfirmUnDelegation = async () => {
    if (!decryptedPhrase) {
      return;
    }
    try {
      setConfirmLoading(true);
      const { walletType } = currentSession.wallet;
      const undelegateAmount = form.getFieldValue('undelegateAmount');

      const unstakingResult = await walletService.sendUnDelegateTransaction({
        validatorAddress: undelegateFormValues.validatorAddress,
        amount: undelegateAmount,
        asset: userAsset,
        memo: '',
        decryptedPhrase,
        walletType,
      });

      setBroadcastResult(unstakingResult);

      setIsVisibleConfirmationModal(false);
      setConfirmLoading(false);
      setIsSuccessTransferModalVisible(true);
      const currentWalletAsset = await walletService.retrieveDefaultWalletAsset(currentSession);
      setUserAsset(currentWalletAsset);
      setInputPasswordVisible(false);

      // Reset values
      form.resetFields();
      setUndelegateFormValues({
        validatorAddress: '',
        undelegateAmount: '',
      });
    } catch (e) {
      setIsVisibleConfirmationModal(false);
      setConfirmLoading(false);
      setInputPasswordVisible(false);
      setIsErrorTransferModalVisible(true);
      // eslint-disable-next-line no-console
      console.log('Error occurred while transfer', e);
    }
  };

  const StakingColumns = [
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
      title: 'Staked Amount',
      dataIndex: 'stakedAmountWithSymbol',
      key: 'stakedAmountWithSymbol',
    },
    {
      title: 'Delegator Address',
      dataIndex: 'delegatorAddress',
      key: 'delegatorAddress',
      render: text => <a>{text}</a>,
    },
    {
      title: 'Undelegate',
      dataIndex: 'undelegateAction',
      key: 'undelegateAction',
      render: () => (
        <a
          onClick={() => {
            setTimeout(() => {
              showPasswordInput();
            }, 200);
          }}
        >
          <Text type="danger">Undelegate Stake</Text>
        </a>
      ),
    },
  ];

  return (
    <Layout className="site-layout">
      <Header className="site-layout-background">Welcome Back!</Header>
      <Content>
        <div className="site-layout-background balance-container">
          <div className="balance">
            <div className="title">TOTAL BALANCE</div>
            <div className="quantity">
              {scaledBalance(userAsset)} {userAsset?.symbol}
            </div>
          </div>
          <div className="balance">
            <div className="title">STAKED BALANCE</div>
            <div className="quantity">
              {scaledStakingBalance(userAsset)} {userAsset?.symbol}
            </div>
          </div>
        </div>
        <Tabs defaultActiveKey="1">
          <TabPane tab="Transactions" key="1">
            <Table columns={TransactionColumns} dataSource={transfers} />
          </TabPane>
          <TabPane tab="Delegations" key="2">
            <Table
              columns={StakingColumns}
              dataSource={delegations}
              onRow={record => {
                return {
                  onClick: () => {
                    setUndelegateFormValues({
                      validatorAddress: record.validatorAddress,
                      undelegateAmount: record.stakedAmount,
                    });
                  },
                };
              }}
            />
          </TabPane>
        </Tabs>
        <div>
          <ModalPopup
            isModalVisible={isConfirmationModalVisible}
            handleCancel={handleCancelConfirmationModal}
            handleOk={onConfirmUnDelegation}
            confirmationLoading={confirmLoading}
            footer={[
              <Button
                key="submit"
                type="primary"
                loading={confirmLoading}
                onClick={onConfirmUnDelegation}
              >
                Confirm
              </Button>,
              <Button key="back" type="link" onClick={handleCancelConfirmationModal}>
                Cancel
              </Button>,
            ]}
            okText="Confirm"
          >
            <>
              <div className="title">Confirm Undelegate Transaction</div>
              <div className="description">Please review the below information.</div>
              <div className="item">
                <div className="label">Undelegate From Validator</div>
                <div className="address">{`${undelegateFormValues?.validatorAddress}`}</div>
              </div>
              <div className="item">
                <Form
                  form={form}
                  {...layout}
                  layout="vertical"
                  requiredMark={false}
                  initialValues={{
                    undelegateAmount: undelegateFormValues.undelegateAmount,
                  }}
                >
                  <Form.Item
                    name="undelegateAmount"
                    label="Undelegate Amount"
                    validateFirst
                    rules={[
                      { required: true, message: 'Undelegate amount is required' },
                      {
                        pattern: /[^0]+/,
                        message: 'Undelegate amount cannot be 0',
                      },
                      {
                        max: Number(undelegateFormValues.undelegateAmount),
                        type: 'number',
                        message: 'Undelegate amount cannot be bigger than currently delegated',
                      },
                    ]}
                  >
                    <InputNumber />
                  </Form.Item>
                </Form>
              </div>
              <div>
                <Alert
                  type="info"
                  message="Please do understand that undelegation is fully completed a number of days (~21) after the transaction has been broadcasted."
                  showIcon
                />
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
                  The transaction timed out but it will be included in the subsequent blocks !
                </div>
              ) : (
                <div className="description">Your undelegation transaction was successful</div>
              )}
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
                The undelegation transaction failed. Please try again later
              </div>
            </>
          </ErrorModalPopup>
        </div>
      </Content>
      <Footer />
    </Layout>
  );
}

export default HomePage;
