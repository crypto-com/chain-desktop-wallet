import React, { useEffect, useState, useRef } from 'react';
import './staking.less';
import 'antd/dist/antd.css';
import { Button, Checkbox, Form, Input, InputNumber, Layout, Table, Tabs, Typography } from 'antd';
import { OrderedListOutlined } from '@ant-design/icons';
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
  scaledAmount,
  scaledBalance,
  UserAsset,
} from '../../models/UserAsset';
import {
  BroadCastResult,
  RewardTransaction,
  ValidatorModel,
  StakingTransactionData,
} from '../../models/Transaction';
import { TransactionUtils } from '../../utils/TransactionUtils';
import {
  FIXED_DEFAULT_FEE,
  CUMULATIVE_SHARE_PERCENTAGE_THRESHOLD,
  SUPPORTED_CURRENCY,
} from '../../config/StaticConfig';
import {
  adjustedTransactionAmount,
  fromScientificNotation,
  getCurrentMinAssetAmount,
  getUIDynamicAmount,
} from '../../utils/NumberUtils';
import { middleEllipsis, ellipsis } from '../../utils/utils';
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
import { UndelegateFormComponent } from '../home/components/UndelegateFormComponent';
import RedelegateFormComponent from '../home/components/RedelegateFormComponent';
import ValidatorPowerPercentBar from '../../components/ValidatorPowerPercentBar/ValidatorPowerPercentBar';

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

  const currentValidatorList = useRecoilValue(validatorListState);
  const currentSession = useRecoilValue(sessionState);
  const fetchingDB = useRecoilValue(fetchingDBState);

  const [ledgerIsExpertMode, setLedgerIsExpertMode] = useRecoilState(ledgerIsExpertModeState);
  const [validatorTopList, setValidatorTopList] = useState<ValidatorModel[]>([]);
  const [displayWarning, setDisplayWarning] = useState(true);

  const analyticsService = new AnalyticsService(currentSession);

  const didMountRef = useRef(false);
  const allMarketData = useRecoilValue(allMarketState);

  const [t] = useTranslation();

  const processValidatorList = (validatorList: ValidatorModel[] | null) => {
    if (validatorList) {
      let willDisplayWarningColumn = false;
      let displayedWarningColumn = false;

      return validatorList.map((validator, idx) => {
        if (
          new Big(validator.cumulativeSharesIncludePercentage!).gte(
            CUMULATIVE_SHARE_PERCENTAGE_THRESHOLD,
          ) &&
          !displayedWarningColumn
        ) {
          displayedWarningColumn = true;
          willDisplayWarningColumn = true;
        }

        const validatorModel = {
          ...validator,
          key: `${idx}`,
          displayWarningColumn: willDisplayWarningColumn,
        };

        willDisplayWarningColumn = false;

        return validatorModel;
      });
    }
    return [];
  };

  useEffect(() => {
    const syncValidatorsData = async () => {
      const validatorList = processValidatorList(currentValidatorList);
      setValidatorTopList(validatorList);
    };

    const syncAssetData = async () => {
      const currentWalletAsset = await walletService.retrieveDefaultWalletAsset(currentSession);
      setWalletAsset(currentWalletAsset);
    };

    if (!didMountRef.current) {
      syncAssetData();
      didMountRef.current = true;
    }

    syncValidatorsData();
  }, [fetchingDB, walletAsset, currentValidatorList]);

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

  const validatorColumns = [
    {
      title: t('staking.validatorList.table.validatorName'),
      dataIndex: 'validatorName',
      key: 'validatorName',
      render: (validatorName, record) => (
        <a
          data-original={record.validatorAddress}
          target="_blank"
          rel="noreferrer"
          href={`${currentSession.wallet.config.explorerUrl.validator}/${record.validatorAddress}`}
        >
          {ellipsis(validatorName, 24)}
        </a>
      ),
    },
    {
      title: t('staking.validatorList.table.validatorWebsite'),
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
      title: t('staking.validatorList.table.validatorAddress'),
      dataIndex: 'validatorAddress',
      key: 'validatorAddress',
      render: validatorAddress => (
        <a
          data-original={validatorAddress}
          title={validatorAddress}
          target="_blank"
          rel="noreferrer"
          href={`${currentSession.wallet.config.explorerUrl.validator}/${validatorAddress}`}
        >
          {middleEllipsis(validatorAddress, 10)}
        </a>
      ),
    },
    {
      title: t('staking.validatorList.table.currentTokens'),
      dataIndex: 'currentTokens',
      key: 'currentTokens',
      sorter: (a, b) => new Big(a.currentTokens).cmp(new Big(b.currentTokens)),
      defaultSortOrder: 'descend' as any,
      render: currentTokens => {
        return (
          <span>
            {numeral(scaledAmount(currentTokens, 8)).format('0,0')}{' '}
            {currentSession.wallet.config.network.coin.croDenom.toUpperCase()}
          </span>
        );
      },
    },
    {
      title: t('staking.validatorList.table.cumulativeShares'),
      // dataIndex: 'cumulativeShares',
      key: 'cumulativeShares',
      // sorter: (a, b) => new Big(a.cumulativeShares).cmp(new Big(b.cumulativeShares)),
      defaultSortOrder: 'descend' as any,
      render: record => {
        return (
          <>
            {/* <span>{record.cumulativeShares} %</span> */}
            <ValidatorPowerPercentBar
              percentExcludeCurrent={record.cumulativeSharesExcludePercentage} // light blue
              percentIncludeCurrent={record.cumulativeSharesIncludePercentage} // primary blue
            />
          </>
        );
      },
    },
    {
      title: t('staking.validatorList.table.currentCommissionRate'),
      dataIndex: 'currentCommissionRate',
      key: 'currentCommissionRate',
      sorter: (a, b) => new Big(a.currentCommissionRate).cmp(new Big(b.currentCommissionRate)),
      render: currentCommissionRate => (
        <span>{new Big(currentCommissionRate).times(100).toFixed(2)}%</span>
      ),
    },
    {
      title: t('general.action'),
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
          {t('general.select')}
        </a>
      ),
    },
  ];

  function onShowMemoChange() {
    setShowMemo(!showMemo);
  }

  const assetMarketData = allMarketData[`${walletAsset.mainnetSymbol}-${currentSession.currency}`];
  const localFiatSymbol = SUPPORTED_CURRENCY.get(assetMarketData.currency)?.symbol;

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
            <Table
              locale={{
                triggerDesc: t('general.table.triggerDesc'),
                triggerAsc: t('general.table.triggerAsc'),
                cancelSort: t('general.table.cancelSort'),
              }}
              dataSource={validatorTopList}
              columns={validatorColumns}
              pagination={{ showSizeChanger: false }}
              onChange={(pagination, filters, sorter: any) => {
                if (
                  (sorter.order === 'descend' && sorter.field === 'currentTokens') ||
                  sorter.order === undefined
                ) {
                  setDisplayWarning(true);
                } else {
                  setDisplayWarning(false);
                }
              }}
              expandable={{
                rowExpandable: record => record.displayWarningColumn! && displayWarning,
                expandedRowRender: record =>
                  record.displayWarningColumn &&
                  displayWarning && (
                    <div className="cumulative-stake33">
                      {t('staking.validatorList.table.warningCumulative')}
                    </div>
                  ),
                expandIconColumnIndex: -1,
              }}
              rowClassName={record => {
                const greyBackground =
                  new Big(record.cumulativeSharesIncludePercentage!).lte(
                    CUMULATIVE_SHARE_PERCENTAGE_THRESHOLD,
                  ) || record.displayWarningColumn;
                return greyBackground ? 'grey-background' : '';
              }}
              defaultExpandAllRows
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
            {walletAsset
              ? `(${localFiatSymbol}${numeral(
                  getAssetBalancePrice(walletAsset, assetMarketData),
                ).format('0,0.00')})`
              : ''}{' '}
          </div>
        </div>
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
                {walletAsset
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
            </div>
          </>
        </ErrorModalPopup>
      </Form.Item>
    </Form>
  );
};

const FormDelegationOperations = () => {
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
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [decryptedPhrase, setDecryptedPhrase] = useState('');
  const [broadcastResult, setBroadcastResult] = useState<BroadCastResult>({});
  const [errorMessages, setErrorMessages] = useState([]);

  const [t] = useTranslation();

  useEffect(() => {
    const syncStakingData = async () => {
      const currentWalletAsset = await walletService.retrieveDefaultWalletAsset(currentSession);

      const allDelegations: StakingTransactionData[] = await walletService.retrieveAllDelegations(
        currentSession.wallet.identifier,
      );
      const stakingTabularData = currentWalletAsset
        ? convertDelegations(allDelegations, currentWalletAsset)
        : [];
      setDelegations(stakingTabularData);
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

  const StakingColumns = [
    {
      title: t('home.transactions.table2.validatorAddress'),
      dataIndex: 'validatorAddress',
      key: 'validatorAddress',
      render: text => (
        <a
          target="_blank"
          rel="noreferrer"
          href={`${currentSession.wallet.config.explorerUrl.validator}/${text}`}
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
          href={`${currentSession.wallet.config.explorerUrl.address}/${text}`}
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
            </div>
          </>
        </ErrorModalPopup>
      </div>
    </>
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
  // const walletAllAssets = useRecoilValue(walletAllAssetsState);

  const [ledgerIsExpertMode, setLedgerIsExpertMode] = useRecoilState(ledgerIsExpertModeState);
  const allMarketData = useRecoilValue(allMarketState);
  const currentSession = useRecoilValue(sessionState);
  const fetchingDB = useRecoilValue(fetchingDBState);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [rewards, setRewards] = useState<RewardsTabularData[]>([]);

  const [t] = useTranslation();

  const convertToTabularData = (
    allRewards: RewardTransaction[],
    currentAsset: UserAsset,
    currentMarketPrice: AssetMarketPrice,
  ) => {
    return allRewards
      .filter(reward => Big(reward.amount).gte(Big(0)))
      .map(reward => {
        const rewardAmount = getUIDynamicAmount(reward.amount, currentAsset);
        const marketPrice =
          currentMarketPrice && currentMarketPrice.price ? new Big(currentMarketPrice.price) : '';
        const rewardMarketPrice =
          currentMarketPrice && currentMarketPrice.price
            ? new Big(rewardAmount).times(marketPrice).toFixed(2)
            : '';
        const rewardData: RewardsTabularData = {
          key: `${reward.validatorAddress}${reward.amount}`,
          rewardAmount: `${rewardAmount} ${currentAsset.symbol}`,
          rewardMarketPrice:
            rewardMarketPrice !== ''
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
      const currentMarketData = allMarketData[`${walletAsset?.symbol}-${currentSession?.currency}`];

      const allRewards: RewardTransaction[] = await walletService.retrieveAllRewards(
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
      setWalletAsset(primaryAsset);
    };

    syncRewardsData();
  }, [fetchingDB]);

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
      title: t('staking.formWithdralStakingReward.table.validatorName'),
      dataIndex: 'validatorAddress',
      key: 'validatorAddress',
      render: text => (
        <a
          target="_blank"
          rel="noreferrer"
          href={`${currentSession.wallet.config.explorerUrl.validator}/${text}`}
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
      title: t('general.action'),
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
          {t('staking.formWithdralStakingReward.table.action1')}
        </a>
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
            <div className="description">{t('general.successModalPopup.timeout.description')}</div>
          ) : (
            <div className="description">{t('general.successModalPopup.reward.description')}</div>
          )}
          {/* <div>{broadcastResult.transactionHash ?? ''}</div> */}
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
          </div>
        </>
      </ErrorModalPopup>
    </div>
  );
};

const StakingPage = () => {
  const currentSession = useRecoilValue(sessionState);
  const analyticsService = new AnalyticsService(currentSession);
  const didMountRef = useRef(false);

  const [t] = useTranslation();

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      analyticsService.logPage('Staking');
    }
  }, []);

  return (
    <Layout className="site-layout">
      <Header className="site-layout-background">{t('staking.title')}</Header>

      <Content>
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
                <FormDelegationRequest />
              </div>
            </div>
          </TabPane>
          <TabPane tab={t('staking.tab3')} key="3">
            <div className="site-layout-background stake-content">
              <div className="container">
                <div className="description">{t('staking.description3')}</div>
                <FormDelegationOperations />
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
