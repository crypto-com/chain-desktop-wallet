import React, { useEffect, useState, useRef } from 'react';
import './staking.less';
import 'antd/dist/antd.css';
import moment from 'moment';
import {
  Button,
  Checkbox,
  Form,
  Input,
  InputNumber,
  Layout,
  Table,
  Tabs,
  Typography,
  Alert,
  Spin,
} from 'antd';
import { OrderedListOutlined, ExclamationCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useTranslation } from 'react-i18next';
import { AddressType } from '@crypto-org-chain/chain-jslib/lib/dist/utils/address';
import Big from 'big.js';
import numeral from 'numeral';

import {
  allMarketState,
  sessionState,
  walletAssetState,
  ledgerIsExpertModeState,
  fetchingDBState,
  validatorListState,
} from '../../recoil/atom';
import {
  AssetMarketPrice,
  getAssetAmountInFiat,
  getAssetBalancePrice,
  getAssetStakingBalancePrice,
  getAssetUnbondingBalancePrice,
  getAssetRewardsBalancePrice,
  scaledBalance,
  scaledStakingBalance,
  scaledUnbondingBalance,
  scaledRewardBalance,
  UserAsset,
} from '../../models/UserAsset';
import {
  BroadCastResult,
  RewardTransactionData,
  StakingTransactionData,
  UnbondingDelegationData,
} from '../../models/Transaction';
import { renderExplorerUrl } from '../../models/Explorer';
import { TransactionUtils } from '../../utils/TransactionUtils';
import {
  adjustedTransactionAmount,
  fromScientificNotation,
  getCurrentMinAssetAmount,
  getUIDynamicAmount,
} from '../../utils/NumberUtils';
import { isNumeric, middleEllipsis } from '../../utils/utils';
import { LEDGER_WALLET_TYPE, detectConditionsError } from '../../service/LedgerService';
import {
  AnalyticsActions,
  AnalyticsCategory,
  AnalyticsService,
  AnalyticsTxType,
} from '../../service/analytics/AnalyticsService';
import { secretStoreService } from '../../storage/SecretStoreService';
import { walletService } from '../../service/WalletService';

import ModalPopup from '../../components/ModalPopup/ModalPopup';
import SuccessModalPopup from '../../components/SuccessModalPopup/SuccessModalPopup';
import ErrorModalPopup from '../../components/ErrorModalPopup/ErrorModalPopup';
import PasswordFormModal from '../../components/PasswordForm/PasswordFormModal';
import { UndelegateFormComponent } from './components/UndelegateFormComponent';
import RedelegateFormComponent from './components/RedelegateFormComponent';
import RowAmountOption from '../../components/RowAmountOption/RowAmountOption';
import ValidatorListTable from './components/ValidatorListTable';

import {
  MODERATION_CONFIG_FILE_URL,
  UNBLOCKING_PERIOD_IN_DAYS,
  FIXED_DEFAULT_FEE,
  SUPPORTED_CURRENCY,
} from '../../config/StaticConfig';
import { isValidatorAddressSuspicious, ModerationConfig } from '../../models/ModerationConfig';
import { useLedgerStatus } from '../../hooks/useLedgerStatus';
import { ledgerNotification } from '../../components/LedgerNotification/LedgerNotification';

const { Header, Content, Footer, Sider } = Layout;
const { Search } = Input;
const { TabPane } = Tabs;
const layout = {
  // labelCol: { span: 8 },
  // wrapperCol: { span: 16 },
};
const tailLayout = {
  // wrapperCol: { offset: 8, span: 16 },
};

const { Text } = Typography;

interface RewardsTabularData {
  key: string;
  rewardAmount: string;
  rewardMarketPrice: string;
  validatorAddress: string;
}

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
interface UnbondingDelegationTabularData {
  key: string;
  delegatorAddress: string;
  validatorAddress: string;
  unbondingAmount: string;
  unbondingAmountWithSymbol: string;
  remainingTime: string;
  completionTime: string;
}

const FormDelegationRequest = props => {
  const { moderationConfig } = props;
  const [form] = Form.useForm();
  const [formValues, setFormValues] = useState({
    validatorAddress: '',
    amount: '',
    memo: '',
  });
  const [isConfirmationModalVisible, setIsVisibleConfirmationModal] = useState(false);
  const [isSuccessTransferModalVisible, setIsSuccessTransferModalVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<BroadCastResult>({});
  const [isErrorTransferModalVisible, setIsErrorTransferModalVisible] = useState(false);
  const [errorMessages, setErrorMessages] = useState([]);
  const [inputPasswordVisible, setInputPasswordVisible] = useState(false);
  const [decryptedPhrase, setDecryptedPhrase] = useState('');
  const [isValidatorListVisible, setIsValidatorListVisible] = useState(false);
  const [showMemo, setShowMemo] = useState(false);
  const [walletAsset, setWalletAsset] = useRecoilState(walletAssetState);

  const currentValidatorList = useRecoilValue(validatorListState);
  const currentSession = useRecoilValue(sessionState);
  const fetchingDB = useRecoilValue(fetchingDBState);

  const [ledgerIsExpertMode, setLedgerIsExpertMode] = useRecoilState(ledgerIsExpertModeState);
  // const [moderationConfig, setModerationConfig] = useState<ModerationConfig>();

  const analyticsService = new AnalyticsService(currentSession);

  const didMountRef = useRef(false);
  const allMarketData = useRecoilValue(allMarketState);

  const { isLedgerConnected } = useLedgerStatus({ asset: walletAsset });

  const [t] = useTranslation();

  useEffect(() => {
    const syncAssetData = async () => {
      const currentWalletAsset = await walletService.retrieveDefaultWalletAsset(currentSession);
      setWalletAsset(currentWalletAsset);
    };

    if (!didMountRef.current) {
      syncAssetData();
      didMountRef.current = true;
    }

    // moderationConfigHandler();
  }, [fetchingDB, walletAsset]);

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
      if (!isLedgerConnected && currentSession.wallet.walletType === LEDGER_WALLET_TYPE) {
        ledgerNotification(currentSession.wallet, walletAsset!);
      }
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

      analyticsService.logTransactionEvent(
        broadcastResult.transactionHash as string,
        formValues.amount,
        AnalyticsTxType.StakingTransaction,
        AnalyticsActions.FundsStaked,
        AnalyticsCategory.Delegate,
      );

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
        setLedgerIsExpertMode(detectConditionsError(((e as unknown) as any).toString()));
      }

      setErrorMessages(((e as unknown) as any).message.split(': '));
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
    t('staking.maxValidator.error'),
  );
  const customMinValidator = TransactionUtils.minValidator(
    fromScientificNotation(currentMinAssetAmount),
    `${t('staking.minValidator.error')} ${fromScientificNotation(currentMinAssetAmount)} ${
      walletAsset.symbol
    }`,
  );

  function onShowMemoChange() {
    setShowMemo(!showMemo);
  }

  const assetMarketData = allMarketData.get(
    `${walletAsset.mainnetSymbol}-${currentSession.currency}`,
  );
  const localFiatSymbol = SUPPORTED_CURRENCY.get(assetMarketData?.currency ?? 'USD')?.symbol;
  const undelegatePeriod =
    currentSession.wallet.config.name === 'MAINNET'
      ? UNBLOCKING_PERIOD_IN_DAYS.UNDELEGATION.MAINNET
      : UNBLOCKING_PERIOD_IN_DAYS.UNDELEGATION.OTHERS;

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
          width={1200}
        >
          <div className="title">{t('staking.validatorList.table.title')}</div>
          <div className="description">{t('staking.validatorList.table.description')}</div>
          <div className="item">
            <ValidatorListTable
              currentSession={currentSession}
              // validatorTopList={validatorTopList}
              currentValidatorList={currentValidatorList}
              moderationConfig={moderationConfig}
              setIsValidatorListVisible={setIsValidatorListVisible}
              form={form}
            />
          </div>
        </ModalPopup>
      </>
      <Form.Item
        name="validatorAddress"
        label={t('staking.formDelegation.validatorAddress.label')}
        hasFeedback
        validateFirst
        rules={[
          {
            required: true,
            message: `${t('staking.formDelegation.validatorAddress.label')} ${t(
              'general.required',
            )}`,
          },
          customAddressValidator,
        ]}
        className="input-validator-address"
      >
        <Search
          placeholder={t('staking.formDelegation.validatorAddress.placeholder')}
          enterButton={<OrderedListOutlined />}
          onSearch={() => setIsValidatorListVisible(true)}
        />
      </Form.Item>
      <div className="amount">
        <Form.Item
          name="amount"
          label={t('staking.formDelegation.amount.label')}
          hasFeedback
          validateFirst
          rules={[
            {
              required: true,
              message: `${t('staking.formDelegation.amount.label')} ${t('general.required')}`,
            },
            {
              pattern: /[^0]+/,
              message: `${t('staking.formDelegation.amount.label')} ${t('general.cannot0')}`,
            },
            customAmountValidator,
            customMaxValidator,
            customMinValidator,
          ]}
        >
          <InputNumber />
        </Form.Item>
        <div className="available">
          <span>{t('general.available')}: </span>
          <div className="available-amount">
            {scaledBalance(walletAsset)} {walletAsset?.symbol}{' '}
            {walletAsset && assetMarketData
              ? `(${localFiatSymbol}${numeral(
                  getAssetBalancePrice(walletAsset, assetMarketData),
                ).format('0,0.00')})`
              : ''}{' '}
          </div>
        </div>
        <RowAmountOption form={form} walletAsset={walletAsset} style={{ marginBottom: '10px' }} />
      </div>
      <Checkbox onChange={onShowMemoChange} checked={showMemo}>
        {t('staking.formDelegation.checkbox1')}
      </Checkbox>
      {showMemo ? (
        <div style={{ paddingTop: '12px' }}>
          <Form.Item name="memo" label={t('staking.formDelegation.memo.label')}>
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
              {t('general.review')}
            </Button>
          }
          footer={[
            <Button
              key="submit"
              type="primary"
              disabled={
                !isChecked ||
                (!isLedgerConnected && currentSession.wallet.walletType === LEDGER_WALLET_TYPE)
              }
              loading={confirmLoading}
              onClick={onConfirmDelegation}
            >
              {t('general.confirm')}
            </Button>,
            <Button key="back" type="link" onClick={handleCancel}>
              {t('general.cancel')}
            </Button>,
          ]}
          okText="Confirm"
        >
          <>
            <div className="title">{t('staking.modal1.title')}</div>
            <div className="description">{t('staking.modal1.description')}</div>
            <div className="item">
              <div className="label">{t('staking.modal1.label1')}</div>
              <div className="address">{`${currentSession.wallet.address}`}</div>
            </div>
            <div className="item">
              <div className="label">{t('staking.modal1.label2')}</div>
              <div className="address">{`${formValues?.validatorAddress}`}</div>
            </div>
            <div className="item">
              <div className="label">{t('staking.modal1.label3')}</div>
              <div>
                {`${formValues?.amount} ${walletAsset?.symbol}`}{' '}
                {walletAsset && assetMarketData
                  ? `(${localFiatSymbol}${numeral(
                      getAssetAmountInFiat(formValues?.amount, assetMarketData),
                    ).format('0,0.00')})`
                  : ''}
              </div>
            </div>
            {formValues?.memo !== undefined &&
            formValues?.memo !== null &&
            formValues.memo !== '' ? (
              <div className="item">
                <div className="label">{t('staking.modal1.label4')}</div>
                <div>{`${formValues?.memo}`}</div>
              </div>
            ) : (
              <div />
            )}
            {isValidatorAddressSuspicious(formValues.validatorAddress, moderationConfig) && (
              <Alert
                message={
                  <div className="alert-item">
                    <Layout>
                      <Sider width="20px">
                        <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                      </Sider>
                      <Content>{t('staking.model1.warning')}</Content>
                    </Layout>
                  </div>
                }
                type="error"
              />
            )}

            <div className="item">
              <Checkbox checked={isChecked} onChange={() => setIsChecked(!isChecked)}>
                {t('general.undelegateFormComponent.checkbox1', {
                  unbondingPeriod: undelegatePeriod,
                })}
              </Checkbox>
            </div>
          </>
        </ModalPopup>
        <PasswordFormModal
          description={t('general.passwordFormModal.description')}
          okButtonText={t('general.passwordFormModal.okButton')}
          onCancel={() => {
            setInputPasswordVisible(false);
          }}
          onSuccess={onWalletDecryptFinish}
          onValidatePassword={async (password: string) => {
            const isValid = await secretStoreService.checkIfPasswordIsValid(password);
            return {
              valid: isValid,
              errMsg: !isValid ? t('general.passwordFormModal.error') : '',
            };
          }}
          successText={t('general.passwordFormModal.success')}
          title={t('general.passwordFormModal.title')}
          visible={inputPasswordVisible}
          successButtonText={t('general.continue')}
          confirmPassword={false}
        />
        <SuccessModalPopup
          isModalVisible={isSuccessTransferModalVisible}
          handleCancel={closeSuccessModal}
          handleOk={closeSuccessModal}
          title={t('general.successModalPopup.title')}
          button={null}
          footer={[
            <Button key="submit" type="primary" onClick={closeSuccessModal}>
              {t('general.ok')}
            </Button>,
          ]}
        >
          <>
            {broadcastResult?.code !== undefined &&
            broadcastResult?.code !== null &&
            broadcastResult.code === walletService.BROADCAST_TIMEOUT_CODE ? (
              <div className="description">
                {t('general.successModalPopup.timeout.description')}
              </div>
            ) : (
              <div className="description">
                {t('general.successModalPopup.staking.description')}
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
              {t('general.errorModalPopup.staking.description')}
              <br />
              {errorMessages
                .filter((item, idx) => {
                  return errorMessages.indexOf(item) === idx;
                })
                .map((err, idx) => (
                  <div key={idx}>- {err}</div>
                ))}
              {ledgerIsExpertMode ? <div>{t('general.errorModalPopup.ledgerExportMode')}</div> : ''}
              {currentSession.wallet.walletType === LEDGER_WALLET_TYPE ? (
                <>
                  <a
                    href="https://crypto.org/docs/wallets/ledger_desktop_wallet.html#ledger-connection-troubleshoot"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('general.errorModalPopup.ledgerTroubleshoot')}
                  </a>
                </>
              ) : (
                <></>
              )}
            </div>
          </>
        </ErrorModalPopup>
      </Form.Item>
    </Form>
  );
};

const FormDelegationOperations = props => {
  const { moderationConfig } = props;
  // Undelegate action related states changes
  const [form] = Form.useForm();
  const [userAsset, setUserAsset] = useRecoilState(walletAssetState);
  const [ledgerIsExpertMode, setLedgerIsExpertMode] = useRecoilState(ledgerIsExpertModeState);
  const currentSession = useRecoilValue(sessionState);
  const fetchingDB = useRecoilValue(fetchingDBState);

  const [delegations, setDelegations] = useState<StakingTabularData[]>([]);
  const [undelegateFormValues, setUndelegateFormValues] = useState({
    validatorAddress: '',
    undelegateAmount: '',
  });
  const [isUndelegateDisclaimerChecked, setIsUndelegateDisclaimerChecked] = useState(false);
  const [redelegateFormValues, setRedelegateFormValues] = useState({
    validatorOriginAddress: '',
    validatorDestinationAddress: '',
    redelegateAmount: '',
  });
  const [delegationActionType, setDelegationActionType] = useState<StakingActionType>();

  const [isConfirmationModalVisible, setIsVisibleConfirmationModal] = useState(false);
  const [isSuccessTransferModalVisible, setIsSuccessTransferModalVisible] = useState(false);
  const [isErrorTransferModalVisible, setIsErrorTransferModalVisible] = useState(false);
  const [inputPasswordVisible, setInputPasswordVisible] = useState(false);
  const [isDelegationsLoading, setIsDelegationsLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [decryptedPhrase, setDecryptedPhrase] = useState('');
  const [broadcastResult, setBroadcastResult] = useState<BroadCastResult>({});
  const [errorMessages, setErrorMessages] = useState([]);

  const { isLedgerConnected } = useLedgerStatus({ asset: userAsset });

  const [t] = useTranslation();

  useEffect(() => {
    const syncStakingData = async () => {
      setIsDelegationsLoading(true);
      const currentWalletAsset = await walletService.retrieveDefaultWalletAsset(currentSession);

      const allDelegations: StakingTransactionData[] = await walletService.retrieveAllDelegations(
        currentSession.wallet.identifier,
      );

      const stakingTabularData = currentWalletAsset
        ? convertDelegations(allDelegations, currentWalletAsset)
        : [];
      setDelegations(stakingTabularData);
      setIsDelegationsLoading(false);
    };

    syncStakingData();
  }, [fetchingDB]);

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
      if (!isLedgerConnected && currentSession.wallet.walletType === LEDGER_WALLET_TYPE) {
        ledgerNotification(currentSession.wallet, userAsset!);
      }
      showConfirmationModal();
    } else {
      setInputPasswordVisible(true);
    }
  };

  const onConfirmDelegationAction = async () => {
    const { walletType } = currentSession.wallet;

    if (!decryptedPhrase && walletType !== LEDGER_WALLET_TYPE) {
      return;
    }
    try {
      setConfirmLoading(true);

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
        setLedgerIsExpertMode(detectConditionsError(((e as unknown) as any).toString()));
      }

      setErrorMessages(((e as unknown) as any).message.split(': '));
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

  function convertDelegations(allDelegations: StakingTransactionData[], currentAsset: UserAsset) {
    return allDelegations
      .map((dlg, idx) => {
        const stakedAmount = getUIDynamicAmount(dlg.stakedAmount, currentAsset);
        const data: StakingTabularData = {
          key: `${idx}_${dlg.validatorAddress}_${dlg.stakedAmount}`,
          delegatorAddress: dlg.delegatorAddress,
          validatorAddress: dlg.validatorAddress,
          stakedAmountWithSymbol: `${stakedAmount} ${currentAsset.symbol}`,
          stakedAmount,
        };
        return data;
      })
      .filter(dlg => Number(dlg.stakedAmount) > 0);
  }

  const StakingColumns = [
    {
      title: t('home.transactions.table2.validatorAddress'),
      dataIndex: 'validatorAddress',
      key: 'validatorAddress',
      render: text => (
        <a
          target="_blank"
          rel="noreferrer"
          href={`${renderExplorerUrl(currentSession.wallet.config, 'validator')}/${text}`}
        >
          {middleEllipsis(text, 8)}
        </a>
      ),
    },
    {
      title: t('home.transactions.table2.stakedAmountWithSymbol'),
      dataIndex: 'stakedAmountWithSymbol',
      key: 'stakedAmountWithSymbol',
    },
    {
      title: t('home.transactions.table2.delegatorAddress'),
      dataIndex: 'delegatorAddress',
      key: 'delegatorAddress',
      render: text => (
        <a
          data-original={text}
          target="_blank"
          rel="noreferrer"
          href={`${renderExplorerUrl(currentSession.wallet.config, 'address')}/${text}`}
        >
          {middleEllipsis(text, 8)}
        </a>
      ),
    },
    {
      title: t('home.transactions.table2.undelegateAction'),
      dataIndex: 'undelegateAction',
      key: 'undelegateAction',
      render: (text, record: StakingTabularData) => {
        const clickData = {
          ...record,
          actionType: StakingActionType.UNDELEGATE,
        };
        return (
          <a data-id={JSON.stringify(clickData)} onClick={onDelegationCellsClicked}>
            <Text type="danger">{t('home.transactions.table2.action1')}</Text>
          </a>
        );
      },
    },
    {
      title: t('home.transactions.table2.redelegateAction'),
      dataIndex: 'redelegate',
      key: 'redelegateAction',
      render: (text, record: StakingTabularData) => {
        const clickData = {
          ...record,
          actionType: StakingActionType.REDELEGATE,
        };
        return (
          <a data-id={JSON.stringify(clickData)} onClick={onDelegationCellsClicked}>
            <Text type="success">{t('home.transactions.table2.action2')}</Text>
          </a>
        );
      },
    },
  ];

  return (
    <>
      <Table
        locale={{
          triggerDesc: t('general.table.triggerDesc'),
          triggerAsc: t('general.table.triggerAsc'),
          cancelSort: t('general.table.cancelSort'),
        }}
        columns={StakingColumns}
        dataSource={delegations}
        loading={{
          indicator: <Spin indicator={<LoadingOutlined style={{ fontSize: 36 }} spin />} />,
          spinning: isDelegationsLoading,
        }}
        rowKey={record => record.key}
      />
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
              disabled={
                (delegationActionType === StakingActionType.UNDELEGATE &&
                  !isUndelegateDisclaimerChecked) ||
                (!isLedgerConnected && currentSession.wallet.walletType === LEDGER_WALLET_TYPE)
              }
            >
              {t('general.confirm')}
            </Button>,
            <Button key="back" type="link" onClick={handleCancelConfirmationModal}>
              {t('general.cancel')}
            </Button>,
          ]}
          okText={t('general.confirm')}
        >
          {delegationActionType === StakingActionType.UNDELEGATE ? (
            <UndelegateFormComponent
              currentSession={currentSession}
              undelegateFormValues={undelegateFormValues}
              isChecked={isUndelegateDisclaimerChecked}
              setIsChecked={setIsUndelegateDisclaimerChecked}
              form={form}
            />
          ) : (
            <RedelegateFormComponent
              currentSession={currentSession}
              redelegateFormValues={redelegateFormValues}
              moderationConfig={moderationConfig}
              walletAsset={userAsset}
              form={form}
            />
          )}
        </ModalPopup>
        <PasswordFormModal
          description={t('general.passwordFormModal.description')}
          okButtonText={t('general.passwordFormModal.okButton')}
          onCancel={() => {
            setInputPasswordVisible(false);
          }}
          onSuccess={onWalletDecryptFinish}
          onValidatePassword={async (password: string) => {
            const isValid = await secretStoreService.checkIfPasswordIsValid(password);
            return {
              valid: isValid,
              errMsg: !isValid ? t('general.passwordFormModal.error') : '',
            };
          }}
          successText={t('general.passwordFormModal.success')}
          title={t('general.passwordFormModal.title')}
          visible={inputPasswordVisible}
          successButtonText={t('general.continue')}
          confirmPassword={false}
        />

        <SuccessModalPopup
          isModalVisible={isSuccessTransferModalVisible}
          handleCancel={closeSuccessModal}
          handleOk={closeSuccessModal}
          title={t('general.successModalPopup.title')}
          button={null}
          footer={[
            <Button key="submit" type="primary" onClick={closeSuccessModal}>
              {t('general.ok')}
            </Button>,
          ]}
        >
          <>
            {broadcastResult?.code !== undefined &&
            broadcastResult?.code !== null &&
            broadcastResult.code === walletService.BROADCAST_TIMEOUT_CODE ? (
              <div className="description">
                {t('general.successModalPopup.timeout.description')}
              </div>
            ) : (
              <div className="description">
                {delegationActionType === StakingActionType.UNDELEGATE
                  ? t('general.successModalPopup.undelegation.description')
                  : t('general.successModalPopup.redelegation.description')}
              </div>
            )}
          </>
        </SuccessModalPopup>
        <ErrorModalPopup
          isModalVisible={isErrorTransferModalVisible}
          handleCancel={closeErrorModal}
          handleOk={closeErrorModal}
          title={t('general.errorModalPopup.title')}
          footer={[]}
        >
          <>
            <div className="description">
              {delegationActionType === StakingActionType.UNDELEGATE
                ? t('general.errorModalPopup.undelegation.description')
                : t('general.errorModalPopup.redelegation.description')}
              <br />
              {errorMessages
                .filter((item, idx) => {
                  return errorMessages.indexOf(item) === idx;
                })
                .map((err, idx) => (
                  <div key={idx}>- {err}</div>
                ))}
              {ledgerIsExpertMode ? <div>{t('general.errorModalPopup.ledgerExportMode')}</div> : ''}
              {currentSession.wallet.walletType === LEDGER_WALLET_TYPE ? (
                <>
                  <a
                    href="https://crypto.org/docs/wallets/ledger_desktop_wallet.html#ledger-connection-troubleshoot"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('general.errorModalPopup.ledgerTroubleshoot')}
                  </a>
                </>
              ) : (
                <></>
              )}
            </div>
          </>
        </ErrorModalPopup>
      </div>
    </>
  );
};

const FormWithdrawStakingReward = () => {
  type RewardActionType = 'withdraw' | 'restake';

  const [withdrawValues, setWithdrawValues] = useState({
    validatorAddress: '',
    rewardAmount: '',
    rewardMarketPrice: '',
  });
  const [isConfirmationModalVisible, setIsVisibleConfirmationModal] = useState(false);
  const [isConfirmationRestakeModalVisible, setIsConfirmationRestakeModalVisible] = useState(false);
  const [isSuccessTransferModalVisible, setIsSuccessTransferModalVisible] = useState(false);
  const [isSuccessRestakeRewardModalVisible, setIsSuccessRestakeRewardModalVisible] = useState(
    false,
  );
  const [successRestakeRewardModalMessage, setSuccessRestakeRewardModalMessage] = useState('');
  const [isRewardsLoading, setIsRewardsLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<BroadCastResult>({});
  const [isErrorTransferModalVisible, setIsErrorTransferModalVisible] = useState(false);
  const [errorMessages, setErrorMessages] = useState([]);
  const [inputPasswordVisible, setInputPasswordVisible] = useState(false);
  const [decryptedPhrase, setDecryptedPhrase] = useState('');
  const [rewardAction, setRewardAction] = useState<RewardActionType>('withdraw');
  const [walletAsset, setWalletAsset] = useRecoilState(walletAssetState);
  // const walletAllAssets = useRecoilValue(walletAllAssetsState);

  const [ledgerIsExpertMode, setLedgerIsExpertMode] = useRecoilState(ledgerIsExpertModeState);
  const allMarketData = useRecoilValue(allMarketState);
  const currentSession = useRecoilValue(sessionState);
  const fetchingDB = useRecoilValue(fetchingDBState);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [rewards, setRewards] = useState<RewardsTabularData[]>([]);
  const { isLedgerConnected } = useLedgerStatus({ asset: walletAsset });

  const [t] = useTranslation();

  const convertToTabularData = (
    allRewards: RewardTransactionData[],
    currentAsset: UserAsset,
    currentMarketPrice: AssetMarketPrice | undefined,
  ) => {
    return allRewards
      .filter(reward => Big(reward.amount).gte(Big(0)))
      .map((reward, idx) => {
        const rewardAmount = getUIDynamicAmount(reward.amount, currentAsset);
        const marketPrice =
          currentMarketPrice && currentMarketPrice.price ? new Big(currentMarketPrice.price) : '';
        const rewardMarketPrice =
          currentMarketPrice && currentMarketPrice.price
            ? new Big(rewardAmount).times(marketPrice).toFixed(2)
            : '';
        const rewardData: RewardsTabularData = {
          key: `${idx}_${reward.validatorAddress}${reward.amount}`,
          rewardAmount: `${rewardAmount} ${currentAsset.symbol}`,
          rewardMarketPrice:
            rewardMarketPrice !== '' && currentMarketPrice
              ? `${SUPPORTED_CURRENCY.get(currentMarketPrice?.currency)?.symbol}${numeral(
                  rewardMarketPrice,
                ).format('0,0.00')} ${currentMarketPrice?.currency}`
              : ``,
          validatorAddress: reward.validatorAddress,
        };
        return rewardData;
      });
  };

  useEffect(() => {
    const syncRewardsData = async () => {
      setIsRewardsLoading(true);
      const currentMarketData = allMarketData.get(
        `${walletAsset?.mainnetSymbol}-${currentSession?.currency}`,
      );

      const allRewards: RewardTransactionData[] = await walletService.retrieveAllRewards(
        currentSession.wallet.identifier,
      );

      const currentWalletAsset = await walletService.retrieveDefaultWalletAsset(currentSession);
      setWalletAsset(currentWalletAsset);

      // Make sure the primary/default asset is the correct one
      const primaryAsset =
        walletAsset.identifier && walletAsset.name !== 'default'
          ? walletAsset
          : await walletService.retrieveDefaultWalletAsset(currentSession);

      const rewardsTabularData = convertToTabularData(allRewards, primaryAsset, currentMarketData);
      setRewards(rewardsTabularData);
      setIsRewardsLoading(false);
      setWalletAsset(primaryAsset);
    };

    syncRewardsData();
  }, [fetchingDB, confirmLoading]);

  const showConfirmationModal = () => {
    setInputPasswordVisible(false);
    setIsVisibleConfirmationModal(true);
  };

  const showConfirmationRestakeModal = () => {
    setInputPasswordVisible(false);
    setIsConfirmationRestakeModalVisible(true);
  };

  const showPasswordInput = (action: string) => {
    if (decryptedPhrase || currentSession.wallet.walletType === LEDGER_WALLET_TYPE) {
      if (!isLedgerConnected && currentSession.wallet.walletType === LEDGER_WALLET_TYPE) {
        ledgerNotification(currentSession.wallet, walletAsset!);
        return;
      }
      if (action === 'restake') {
        showConfirmationRestakeModal();
      } else {
        showConfirmationModal();
      }
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
    if (rewardAction === 'restake') {
      showConfirmationRestakeModal();
    } else {
      showConfirmationModal();
    }
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
    } catch (e) {
      if (walletType === LEDGER_WALLET_TYPE) {
        setLedgerIsExpertMode(detectConditionsError(((e as unknown) as any).toString()));
      }

      setErrorMessages(((e as unknown) as any).message.split(': '));
      setIsVisibleConfirmationModal(false);
      setConfirmLoading(false);
      setInputPasswordVisible(false);
      setIsErrorTransferModalVisible(true);
      // eslint-disable-next-line no-console
      console.log('Error occurred while transfer', e);
    }
  };

  const onConfirmRestakeReward = async () => {
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

      if (rewardWithdrawResult.transactionHash) {
        // Success - Reward withdraw transaction was successfully broadcasted

        // withdrawValues.rewardAmount = '0.1 CRO'
        const restakeRewardAmount = withdrawValues.rewardAmount.split(' ')[0];

        if (!isNumeric(restakeRewardAmount)) {
          setSuccessRestakeRewardModalMessage(
            t('general.successModalPopup.restakeReward.description3'),
          );
        } else {
          const restakeRewardResult = await walletService.sendDelegateTransaction({
            validatorAddress: withdrawValues.validatorAddress,
            amount: restakeRewardAmount,
            asset: walletAsset,
            memo: '',
            decryptedPhrase,
            walletType,
          });

          if (restakeRewardResult.transactionHash) {
            // Success - Both Reward withdraw & restake transactions were successfully broadcasted
            setBroadcastResult(restakeRewardResult);
            setSuccessRestakeRewardModalMessage(
              t('general.successModalPopup.restakeReward.description1'),
            );
          } else if (
            rewardWithdrawResult?.code !== undefined &&
            rewardWithdrawResult?.code !== null &&
            rewardWithdrawResult.code === walletService.BROADCAST_TIMEOUT_CODE
          ) {
            // Timed Out - Restake transaction
            setBroadcastResult(restakeRewardResult);
            setSuccessRestakeRewardModalMessage(
              t('general.successModalPopup.restakeReward.description2'),
            );
          } else {
            // Failed - Restake transaction
            setBroadcastResult(restakeRewardResult);
            setSuccessRestakeRewardModalMessage(
              t('general.successModalPopup.restakeReward.description3'),
            );
          }
          setIsConfirmationRestakeModalVisible(false);
          setConfirmLoading(false);
          setIsSuccessRestakeRewardModalVisible(true);
        }
      } else if (
        rewardWithdrawResult?.code !== undefined &&
        rewardWithdrawResult?.code !== null &&
        rewardWithdrawResult.code === walletService.BROADCAST_TIMEOUT_CODE
      ) {
        // Timed Out - Reward withdraw transaction
        setBroadcastResult(rewardWithdrawResult);
        setSuccessRestakeRewardModalMessage(
          t('general.successModalPopup.restakeReward.description4'),
        );
        setIsConfirmationRestakeModalVisible(false);
        setConfirmLoading(false);
        setIsSuccessRestakeRewardModalVisible(true);
      } else {
        // Failed - Reward withdraw transaction
        throw new Error(t('general.errorModalPopup.reward.description'));
      }
    } catch (e) {
      if (walletType === LEDGER_WALLET_TYPE) {
        setLedgerIsExpertMode(detectConditionsError(((e as unknown) as any).toString()));
      }

      setErrorMessages(((e as unknown) as any).message.split(': '));
      setIsConfirmationRestakeModalVisible(false);
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

  const handleCancelConfirmationRestakeModal = () => {
    setIsConfirmationRestakeModalVisible(false);
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
      title: t('staking.formWithdralStakingReward.table.validatorName'),
      dataIndex: 'validatorAddress',
      key: 'validatorAddress',
      render: text => (
        <a
          target="_blank"
          rel="noreferrer"
          href={`${renderExplorerUrl(currentSession.wallet.config, 'validator')}/${text}`}
        >
          {text}
        </a>
      ),
    },
    {
      title: t('staking.formWithdralStakingReward.table.rewardAmount'),
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
      title: t('staking.formWithdralStakingReward.table.withdraw'),
      dataIndex: 'withdrawAction',
      key: 'withdrawAction',
      render: () => (
        <>
          <a
            onClick={() => {
              setRewardAction('withdraw');
              setTimeout(() => {
                showPasswordInput('withdraw');
              }, 200);
            }}
          >
            {t('staking.formWithdralStakingReward.table.action1')}
          </a>
        </>
      ),
    },
    {
      title: t('staking.formWithdralStakingReward.table.restake'),
      dataIndex: 'restakeAction',
      key: 'restakeAction',
      render: () => (
        <>
          <a
            onClick={() => {
              setRewardAction('restake');
              setTimeout(() => {
                showPasswordInput('restake');
              }, 200);
            }}
          >
            <Text type="success">{t('staking.formWithdralStakingReward.table.action2')}</Text>
          </a>
        </>
      ),
    },
  ];

  const StakingTable = () => {
    return (
      <Table
        locale={{
          triggerDesc: t('general.table.triggerDesc'),
          triggerAsc: t('general.table.triggerAsc'),
          cancelSort: t('general.table.cancelSort'),
        }}
        columns={rewardColumns}
        loading={{
          indicator: <Spin indicator={<LoadingOutlined style={{ fontSize: 36 }} spin />} />,
          spinning: isRewardsLoading,
        }}
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
          <Button
            key="submit"
            type="primary"
            loading={confirmLoading}
            disabled={!isLedgerConnected && currentSession.wallet.walletType === LEDGER_WALLET_TYPE}
            onClick={onConfirmTransfer}
          >
            {t('general.confirm')}
          </Button>,
          <Button key="back" type="link" onClick={handleCancelConfirmationModal}>
            {t('general.cancel')}
          </Button>,
        ]}
        okText={t('general.confirm')}
      >
        <>
          <div className="title">{t('staking.modal2.title')}</div>
          <div className="description">{t('staking.modal2.description')}</div>
          <div className="item">
            <div className="label">{t('staking.modal2.label1')}</div>
            <div className="address">{`${currentSession.wallet.address}`}</div>
          </div>
          <div className="item">
            <div className="label">{t('staking.modal2.label2')}</div>
            <div className="address">{`${withdrawValues?.validatorAddress}`}</div>
          </div>
          <div className="item">
            <div className="label">{t('staking.modal2.label3')}</div>
            <div>{`${withdrawValues.rewardAmount}`}</div>
            <div className="fiat">{`${withdrawValues.rewardMarketPrice}`}</div>
          </div>
        </>
      </ModalPopup>
      <ModalPopup
        isModalVisible={isConfirmationRestakeModalVisible}
        handleCancel={handleCancelConfirmationRestakeModal}
        handleOk={onConfirmRestakeReward}
        confirmationLoading={confirmLoading}
        className="reward-modal"
        footer={[
          <Button
            key="submit"
            type="primary"
            loading={confirmLoading}
            onClick={onConfirmRestakeReward}
          >
            {t('general.confirm')}
          </Button>,
          <Button key="back" type="link" onClick={handleCancelConfirmationRestakeModal}>
            {t('general.cancel')}
          </Button>,
        ]}
        okText={t('general.confirm')}
      >
        <>
          <div className="title">{t('staking.modal5.title')}</div>
          <div className="description">{t('staking.modal5.description')}</div>
          <div className="item">
            <div className="label">{t('staking.modal5.label1')}</div>
            <div className="address">{`${currentSession.wallet.address}`}</div>
          </div>
          <div className="item">
            <div className="label">{t('staking.modal5.label2')}</div>
            <div className="address">{`${withdrawValues?.validatorAddress}`}</div>
          </div>
          <div className="item">
            <div className="label">{t('staking.modal5.label3')}</div>
            <div>{`${withdrawValues.rewardAmount}`}</div>
            <div className="fiat">{`${withdrawValues.rewardMarketPrice}`}</div>
          </div>
        </>
      </ModalPopup>
      <PasswordFormModal
        description={t('general.passwordFormModal.description')}
        okButtonText={t('general.passwordFormModal.okButton')}
        onCancel={() => {
          setInputPasswordVisible(false);
        }}
        onSuccess={password => onWalletDecryptFinish(password)}
        onValidatePassword={async (password: string) => {
          const isValid = await secretStoreService.checkIfPasswordIsValid(password);
          return {
            valid: isValid,
            errMsg: !isValid ? t('general.passwordFormModal.error') : '',
          };
        }}
        successText={t('general.passwordFormModal.success')}
        title={t('general.passwordFormModal.title')}
        visible={inputPasswordVisible}
        successButtonText={t('general.continue')}
        confirmPassword={false}
      />
      <SuccessModalPopup
        isModalVisible={isSuccessTransferModalVisible}
        handleCancel={closeSuccessModal}
        handleOk={closeSuccessModal}
        title={t('general.successModalPopup.title')}
        button={null}
        footer={[
          <Button key="submit" type="primary" onClick={closeSuccessModal}>
            {t('general.ok')}
          </Button>,
        ]}
      >
        <>
          {broadcastResult?.code !== undefined &&
          broadcastResult?.code !== null &&
          broadcastResult.code === walletService.BROADCAST_TIMEOUT_CODE ? (
            <div className="description">{t('general.successModalPopup.timeout.description')}</div>
          ) : (
            <div className="description">{t('general.successModalPopup.reward.description')}</div>
          )}
        </>
      </SuccessModalPopup>
      <SuccessModalPopup
        isModalVisible={isSuccessRestakeRewardModalVisible}
        handleCancel={() => {
          setIsSuccessRestakeRewardModalVisible(false);
        }}
        handleOk={() => {
          setIsSuccessRestakeRewardModalVisible(false);
        }}
        title={t('general.successModalPopup.title')}
        button={null}
        footer={[
          <Button
            key="submit"
            type="primary"
            onClick={() => {
              setIsSuccessRestakeRewardModalVisible(false);
            }}
          >
            {t('general.ok')}
          </Button>,
        ]}
      >
        <>
          <div className="description">{successRestakeRewardModalMessage}</div>
        </>
      </SuccessModalPopup>
      <ErrorModalPopup
        isModalVisible={isErrorTransferModalVisible}
        handleCancel={closeErrorModal}
        handleOk={closeErrorModal}
        title={t('general.errorModalPopup.title')}
        footer={[]}
      >
        <>
          <div className="description">
            {t('general.errorModalPopup.reward.description')}
            <br />
            {errorMessages
              .filter((item, idx) => {
                return errorMessages.indexOf(item) === idx;
              })
              .map((err, idx) => (
                <div key={idx}>- {err}</div>
              ))}
            {ledgerIsExpertMode ? <div>{t('general.errorModalPopup.ledgerExportMode')}</div> : ''}
            {currentSession.wallet.walletType === LEDGER_WALLET_TYPE ? (
              <>
                <a
                  href="https://crypto.org/docs/wallets/ledger_desktop_wallet.html#ledger-connection-troubleshoot"
                  target="_blank"
                  rel="noreferrer"
                >
                  {t('general.errorModalPopup.ledgerTroubleshoot')}
                </a>
              </>
            ) : (
              <></>
            )}
          </div>
        </>
      </ErrorModalPopup>
    </div>
  );
};

const StakingPage = () => {
  const currentSession = useRecoilValue(sessionState);
  const userAsset = useRecoilValue(walletAssetState);
  const currentValidatorList = useRecoilValue(validatorListState);
  const fetchingDB = useRecoilValue(fetchingDBState);
  const allMarketData = useRecoilValue(allMarketState);
  // const [validatorTopList, setValidatorTopList] = useState<ValidatorModel[]>([]);
  const [marketData, setMarketData] = useState<AssetMarketPrice>();

  const [isUnbondingDelegationModalVisible, setIsUnbondingDelegationModalVisible] = useState(false);
  const [isUnbondingVisible, setIsUnbondingVisible] = useState(false);
  const [unbondingDelegations, setUnbondingDelegations] = useState<
    UnbondingDelegationTabularData[]
  >([]);
  const [moderationConfig, setModerationConfig] = useState<ModerationConfig>();
  const analyticsService = new AnalyticsService(currentSession);
  const didMountRef = useRef(false);

  const [t, i18n] = useTranslation();

  const undelegatePeriod =
    currentSession.wallet.config.name === 'MAINNET'
      ? UNBLOCKING_PERIOD_IN_DAYS.UNDELEGATION.MAINNET
      : UNBLOCKING_PERIOD_IN_DAYS.UNDELEGATION.OTHERS;

  const unbondingDelegationColumns = [
    {
      title: t('staking.modal3.table.validatorAddress'),
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
      title: t('staking.modal3.table.unbondingAmount'),
      dataIndex: 'unbondingAmount',
      key: 'unbondingAmount',
      render: text => {
        return <>{text}</>;
      },
    },
    {
      title: t('staking.modal3.table.remainingTime'),
      dataIndex: 'remainingTime',
      key: 'remainingTime',
      render: text => {
        return <>{text}</>;
      },
    },
    {
      title: t('staking.modal3.table.completionTime'),
      dataIndex: 'completionTime',
      key: 'completionTime',
      render: text => {
        return <>{text}</>;
      },
    },
  ];

  const formatRemainingTime = (completionTime: string) => {
    const currentLanguageLocale = i18n.language.replace(/([A-Z])/, '-$1').toLowerCase();

    const targetDate = moment(completionTime);

    // monent treat days > 26 as "a month", show number of days instead
    return moment
      .duration(targetDate.diff(moment()))
      .locale(currentLanguageLocale)
      .humanize({ d: 31 });
  };

  const convertUnbondingDelegations = (
    allUnbondingDelegations: UnbondingDelegationData[],
    currentAsset: UserAsset,
  ) => {
    return (
      allUnbondingDelegations
        .map((dlg, idx) => {
          const unbondingAmount = getUIDynamicAmount(dlg.unbondingAmount, currentAsset);
          const data: UnbondingDelegationTabularData = {
            key: `${idx}_${dlg.validatorAddress}_${dlg.unbondingAmount}_${dlg.completionTime}`,
            delegatorAddress: dlg.delegatorAddress,
            validatorAddress: dlg.validatorAddress,
            completionTime: new Date(dlg.completionTime).toString(),
            unbondingAmount,
            unbondingAmountWithSymbol: `${unbondingAmount} ${currentAsset.symbol}`,
            remainingTime: formatRemainingTime(dlg.completionTime),
          };
          return data;
        })
        // ONLY DISPLAY ``ACTIVE Unbonding Delegations``
        .filter(dlg => moment().diff(moment(dlg.completionTime)) < 0)
    );
  };

  useEffect(() => {
    const syncUnbondingDelegationsData = async () => {
      const allUnbonding = await walletService.retrieveAllUnbondingDelegations(
        currentSession.wallet.identifier,
      );

      const unbondingDelegationTabularData = convertUnbondingDelegations(allUnbonding, userAsset);
      setUnbondingDelegations(unbondingDelegationTabularData);

      setIsUnbondingVisible(unbondingDelegationTabularData.length > 0);
    };

    const moderationConfigHandler = async () => {
      try {
        const fetchModerationConfigData = await fetch(MODERATION_CONFIG_FILE_URL);
        const moderationConfigData = await fetchModerationConfigData.json();
        setModerationConfig(moderationConfigData);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error occurred while fetching moderation config file', error);
      }
    };

    syncUnbondingDelegationsData();

    setMarketData(allMarketData.get(`${userAsset?.mainnetSymbol}-${currentSession.currency}`));

    if (!didMountRef.current) {
      didMountRef.current = true;
      moderationConfigHandler();
      analyticsService.logPage('Staking');
    }
  }, [fetchingDB, currentValidatorList]);

  return (
    <Layout className="site-layout">
      <Header className="site-layout-background">{t('staking.title')}</Header>

      <Content>
        <div className="site-layout-background balance-container">
          <div className="balance">
            <div className="title">{t('staking.balance.title1')}</div>
            {userAsset && (
              <div className="quantity">
                {numeral(scaledStakingBalance(userAsset)).format('0,0.0000')} {userAsset?.symbol}
              </div>
            )}
            <div className="fiat">
              {userAsset && marketData && marketData.price
                ? `${SUPPORTED_CURRENCY.get(marketData.currency)?.symbol}${numeral(
                    getAssetStakingBalancePrice(userAsset, marketData),
                  ).format(`0,0.00`)} ${marketData?.currency}`
                : ''}
            </div>
          </div>
          {isUnbondingVisible ? (
            <div className="balance">
              <div className="title">{t('staking.balance.title2')}</div>
              {userAsset && (
                <div className="quantity">
                  {numeral(scaledUnbondingBalance(userAsset)).format('0,0.0000')}{' '}
                  {userAsset?.symbol}
                </div>
              )}
              <div className="fiat">
                {userAsset && marketData && marketData.price
                  ? `${SUPPORTED_CURRENCY.get(marketData.currency)?.symbol}${numeral(
                      getAssetUnbondingBalancePrice(userAsset, marketData),
                    ).format('0,0.00')} ${marketData?.currency}
                `
                  : ''}
              </div>
            </div>
          ) : (
            <></>
          )}
          <div className="balance">
            <div className="title">{t('staking.balance.title3')}</div>
            {userAsset && (
              <div className="quantity">
                {numeral(scaledRewardBalance(userAsset)).format('0,0.0000')} {userAsset?.symbol}
              </div>
            )}
            <div className="fiat">
              {userAsset && marketData && marketData.price
                ? `${SUPPORTED_CURRENCY.get(marketData.currency)?.symbol}${numeral(
                    getAssetRewardsBalancePrice(userAsset, marketData),
                  ).format('0,0.00')} ${marketData?.currency}
                  `
                : ''}
            </div>
          </div>
        </div>
        <Tabs defaultActiveKey="1">
          <TabPane tab={t('staking.tab1')} key="1">
            <div className="site-layout-background stake-content">
              <div className="container">
                <div className="description">{t('staking.description1')}</div>
                <FormWithdrawStakingReward />
              </div>
            </div>
          </TabPane>
          <TabPane tab={t('staking.tab2')} key="2">
            <div className="site-layout-background stake-content">
              <div className="container">
                <div className="description">{t('staking.description2')}</div>
                <FormDelegationRequest moderationConfig={moderationConfig} />
              </div>
            </div>
          </TabPane>
          <TabPane tab={t('staking.tab3')} key="3">
            <div className="site-layout-background stake-content">
              <div className="container">
                <Layout>
                  <Sider width="60%">
                    <div className="description">{t('staking.description3')}</div>
                  </Sider>
                  {isUnbondingVisible ? (
                    <Content>
                      <div className="view-unstaking">
                        <a
                          onClick={() => {
                            setIsUnbondingDelegationModalVisible(true);
                          }}
                        >
                          {t('staking.modal3.button')}
                        </a>
                      </div>
                      <ModalPopup
                        isModalVisible={isUnbondingDelegationModalVisible}
                        handleCancel={() => setIsUnbondingDelegationModalVisible(false)}
                        handleOk={() => setIsUnbondingDelegationModalVisible(false)}
                        className="unbonding-modal"
                        footer={[]}
                        okText="OK"
                      >
                        <>
                          <div className="title">{t('staking.modal3.title')}</div>
                          <div className="description">
                            {t('staking.modal3.description', { unbondingPeriod: undelegatePeriod })}
                          </div>
                          <Table
                            locale={{
                              triggerDesc: t('general.table.triggerDesc'),
                              triggerAsc: t('general.table.triggerAsc'),
                              cancelSort: t('general.table.cancelSort'),
                            }}
                            columns={unbondingDelegationColumns}
                            dataSource={unbondingDelegations}
                          />
                        </>
                      </ModalPopup>
                    </Content>
                  ) : (
                    <></>
                  )}
                </Layout>
                <FormDelegationOperations moderationConfig={moderationConfig} />
              </div>
            </div>
          </TabPane>
        </Tabs>
      </Content>
      <Footer />
    </Layout>
  );
};

export default StakingPage;
