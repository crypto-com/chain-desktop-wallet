import React, { useEffect, useState } from 'react';
import './home.less';
import 'antd/dist/antd.css';
import { Button, Form, Layout, notification, Table, Tabs, Tag, Typography } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import { useRecoilState, useRecoilValue } from 'recoil';
import numeral from 'numeral';
import {
  scaledBalance,
  scaledStakingBalance,
  getAssetBalancePrice,
  getAssetStakingBalancePrice,
  UserAsset,
} from '../../models/UserAsset';
import {
  hasShownWarningOnWalletTypeState,
  sessionState,
  marketState,
  walletAssetState,
  ledgerIsExpertModeState,
  fetchingDBState,
} from '../../recoil/atom';
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
import { UndelegateFormComponent } from './components/UndelegateFormComponent';
import RedelegateFormComponent from './components/RedelegateFormComponent';
import { getUIDynamicAmount } from '../../utils/NumberUtils';
import { middleEllipsis } from '../../utils/utils';
import { LEDGER_WALLET_TYPE, detectConditionsError } from '../../service/LedgerService';

const electron = window.require('electron');
const pageView = electron.remote.getGlobal('pageView');

const { Text } = Typography;

const { Header, Content, Footer } = Layout;
const { TabPane } = Tabs;

enum StakingActionType {
  UNDELEGATE = 'UNDELEGATE',
  REDELEGATE = 'REDELEGATE',
}

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
      const stakedAmount = getUIDynamicAmount(dlg.stakedAmount, currentAsset);
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
    const transferAmount = getUIDynamicAmount(transfer.amount, currentAsset);
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
  const marketData = useRecoilValue(marketState);
  const [ledgerIsExpertMode, setLedgerIsExpertMode] = useRecoilState(ledgerIsExpertModeState);
  const [fetchingDB, setFetchingDB] = useRecoilState(fetchingDBState);

  // Undelegate action related states changes
  const [form] = Form.useForm();

  const [isConfirmationModalVisible, setIsVisibleConfirmationModal] = useState(false);
  const [isSuccessTransferModalVisible, setIsSuccessTransferModalVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [isErrorTransferModalVisible, setIsErrorTransferModalVisible] = useState(false);
  const [inputPasswordVisible, setInputPasswordVisible] = useState(false);

  const [hasShownNotLiveWallet, setHasShownNotLiveWallet] = useRecoilState(
    hasShownWarningOnWalletTypeState,
  );

  const [decryptedPhrase, setDecryptedPhrase] = useState('');
  const [broadcastResult, setBroadcastResult] = useState<BroadCastResult>({});
  const [errorMessages, setErrorMessages] = useState([]);

  const [undelegateFormValues, setUndelegateFormValues] = useState({
    validatorAddress: '',
    undelegateAmount: '',
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [redelegateFormValues, setRedelegateFormValues] = useState({
    validatorOriginAddress: '',
    validatorDestinationAddress: '',
    redelegateAmount: '',
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [delegationActionType, setDelegationActionType] = useState<StakingActionType>();

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

  const onSyncBtnCall = async () => {
    setFetchingDB(true);

    await walletService.syncAll();
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

    showWalletStateNotification(currentSession.wallet.config);

    setDelegations(stakingTabularData);
    setTransfers(transferTabularData);
    setUserAsset(currentAsset);
    setHasShownNotLiveWallet(true);

    setFetchingDB(false);
  };

  useEffect(() => {
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

      showWalletStateNotification(currentSession.wallet.config);
      setDelegations(stakingTabularData);
      setTransfers(transferTabularData);
      setUserAsset(currentAsset);
      setHasShownNotLiveWallet(true);

      pageView('Home');
    };

    syncAssetData();
  }, [fetchingDB]);

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
          {middleEllipsis(text, 12)}
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
      render: text => <div data-original={text}>{middleEllipsis(text, 12)}</div>,
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
    if (decryptedPhrase || currentSession.wallet.walletType === LEDGER_WALLET_TYPE) {
      showConfirmationModal();
    } else {
      setInputPasswordVisible(true);
    }
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

  const onConfirmDelegationAction = async () => {
    const { walletType } = currentSession.wallet;

    if (!decryptedPhrase && walletType !== LEDGER_WALLET_TYPE) {
      return;
    }
    try {
      setConfirmLoading(true);

      // TODO : Here switch between undelegation and redelegation
      let broadcastedTransaction: BroadCastResult | null = null;

      if (delegationActionType === StakingActionType.UNDELEGATE) {
        const undelegateAmount = form.getFieldValue('undelegateAmount');
        broadcastedTransaction = await walletService.sendUnDelegateTransaction({
          validatorAddress: undelegateFormValues.validatorAddress,
          amount: undelegateAmount,
          asset: userAsset,
          memo: '',
          decryptedPhrase,
          walletType,
        });
      } else if (delegationActionType === StakingActionType.REDELEGATE) {
        const redelegateAmount = form.getFieldValue('redelegateAmount');
        const validatorDesAddress = form.getFieldValue('validatorDestinationAddress');
        broadcastedTransaction = await walletService.sendReDelegateTransaction({
          validatorSourceAddress: redelegateFormValues.validatorOriginAddress,
          validatorDestinationAddress: validatorDesAddress,
          amount: redelegateAmount,
          asset: userAsset,
          memo: '',
          decryptedPhrase,
          walletType,
        });
      } else {
        return;
      }

      const allDelegations: StakingTransactionData[] = await walletService.retrieveAllDelegations(
        currentSession.wallet.identifier,
      );

      const delegationTabularData = convertDelegations(allDelegations, userAsset);
      setDelegations(delegationTabularData);

      setBroadcastResult(broadcastedTransaction);

      setIsVisibleConfirmationModal(false);
      setConfirmLoading(false);
      setIsSuccessTransferModalVisible(true);
      const currentWalletAsset = await walletService.retrieveDefaultWalletAsset(currentSession);
      setUserAsset(currentWalletAsset);
      setInputPasswordVisible(false);

      // Reset values
      form.resetFields();

      if (delegationActionType === StakingActionType.UNDELEGATE) {
        setUndelegateFormValues({
          validatorAddress: '',
          undelegateAmount: '',
        });
      } else if (delegationActionType === StakingActionType.REDELEGATE) {
        setRedelegateFormValues({
          redelegateAmount: '',
          validatorDestinationAddress: '',
          validatorOriginAddress: '',
        });
      }
    } catch (e) {
      if (walletType === LEDGER_WALLET_TYPE) {
        setLedgerIsExpertMode(detectConditionsError(e.toString()));
      }

      setErrorMessages(e.message.split(': '));
      setIsVisibleConfirmationModal(false);
      setConfirmLoading(false);
      setInputPasswordVisible(false);
      setIsErrorTransferModalVisible(true);
    }
  };

  const onDelegationCellsClicked = e => {
    const eventData = JSON.parse(e.currentTarget.dataset.id);
    const { validatorAddress, stakedAmount, actionType } = eventData;
    const newStakingAction: StakingActionType = StakingActionType[actionType];
    setDelegationActionType(newStakingAction);

    if (newStakingAction === StakingActionType.UNDELEGATE) {
      setUndelegateFormValues({
        validatorAddress,
        undelegateAmount: stakedAmount,
      });
    } else if (newStakingAction === StakingActionType.REDELEGATE) {
      setRedelegateFormValues({
        redelegateAmount: stakedAmount,
        validatorOriginAddress: validatorAddress,
        validatorDestinationAddress: '',
      });
    }

    showPasswordInput();
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
          {middleEllipsis(text, 8)}
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
      render: text => <a>{middleEllipsis(text, 8)}</a>,
    },
    {
      title: 'Undelegate',
      dataIndex: 'undelegateAction',
      key: 'undelegateAction',
      render: (text, record: StakingTabularData) => {
        const clickData = {
          ...record,
          actionType: StakingActionType.UNDELEGATE,
        };
        return (
          <a data-id={JSON.stringify(clickData)} onClick={onDelegationCellsClicked}>
            <Text type="danger">Undelegate Stake</Text>
          </a>
        );
      },
    },
    {
      title: 'Redelegate',
      dataIndex: 'redelegate',
      key: 'redelegateAction',
      render: (text, record: StakingTabularData) => {
        const clickData = {
          ...record,
          actionType: StakingActionType.REDELEGATE,
        };
        return (
          <a data-id={JSON.stringify(clickData)} onClick={onDelegationCellsClicked}>
            <Text type="success">Redelegate Stake</Text>
          </a>
        );
      },
    },
  ];

  return (
    <Layout className="site-layout">
      <Header className="site-layout-background">
        Welcome Back!
        <SyncOutlined
          onClick={() => {
            onSyncBtnCall();
          }}
          style={{ position: 'absolute', right: '36px', marginTop: '6px' }}
          spin={fetchingDB}
        />
      </Header>
      <Content>
        <div className="site-layout-background balance-container">
          <div className="balance">
            <div className="title">TOTAL BALANCE</div>
            <div className="quantity">
              {numeral(scaledBalance(userAsset)).format('0,0.0000')} {userAsset?.symbol}
            </div>
            <div className="fiat">
              {marketData && marketData.price
                ? `${numeral(getAssetBalancePrice(userAsset, marketData)).format('$0,0.00')} ${
                    marketData?.currency
                  }`
                : ''}
            </div>
          </div>
          <div className="balance">
            <div className="title">STAKED BALANCE</div>
            <div className="quantity">
              {numeral(scaledStakingBalance(userAsset)).format('0,0.0000')} {userAsset?.symbol}
            </div>
            <div className="fiat">
              {marketData && marketData.price
                ? `${numeral(getAssetStakingBalancePrice(userAsset, marketData)).format(
                    '$0,0.00',
                  )} ${marketData?.currency}`
                : ''}
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
              // onRow={record => {
              //   return {
              //     onClick: () => {
              //       setUndelegateFormValues({
              //         validatorAddress: record.validatorAddress,
              //         undelegateAmount: record.stakedAmount,
              //       });
              //     },
              //   };
              // }}
            />
          </TabPane>
        </Tabs>
        <div>
          <ModalPopup
            isModalVisible={isConfirmationModalVisible}
            handleCancel={handleCancelConfirmationModal}
            handleOk={onConfirmDelegationAction}
            confirmationLoading={confirmLoading}
            footer={[
              <Button
                key="submit"
                type="primary"
                loading={confirmLoading}
                onClick={onConfirmDelegationAction}
              >
                Confirm
              </Button>,
              <Button key="back" type="link" onClick={handleCancelConfirmationModal}>
                Cancel
              </Button>,
            ]}
            okText="Confirm"
          >
            {delegationActionType === StakingActionType.UNDELEGATE ? (
              <UndelegateFormComponent
                currentSession={currentSession}
                undelegateFormValues={undelegateFormValues}
                form={form}
              />
            ) : (
              <RedelegateFormComponent
                currentSession={currentSession}
                redelegateFormValues={redelegateFormValues}
                walletAsset={userAsset}
                form={form}
              />
            )}
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
                <div className="description">
                  {delegationActionType === StakingActionType.UNDELEGATE
                    ? 'Your undelegation transaction was successful'
                    : 'Your redelegation transaction was successful'}
                </div>
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
                {delegationActionType === StakingActionType.UNDELEGATE
                  ? 'The undelegation transaction failed. Please try again later.'
                  : 'The redelegation transaction failed. Please try again later.'}
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
      </Content>
      <Footer />
    </Layout>
  );
}

export default HomePage;
