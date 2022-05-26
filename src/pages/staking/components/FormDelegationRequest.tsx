import React, { useEffect, useState, useRef } from 'react';
import '../staking.less';
import 'antd/dist/antd.css';
import { Button, Checkbox, Form, Input, InputNumber, Layout, Alert } from 'antd';
import { OrderedListOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useTranslation } from 'react-i18next';
import { AddressType } from '@crypto-org-chain/chain-jslib/lib/dist/utils/address';
import numeral from 'numeral';

import {
  allMarketState,
  sessionState,
  walletAssetState,
  ledgerIsExpertModeState,
  fetchingDBState,
  validatorListState,
} from '../../../recoil/atom';
import {
  getAssetAmountInFiat,
  getAssetBalancePrice,
  scaledBalance,
} from '../../../models/UserAsset';
import { BroadCastResult } from '../../../models/Transaction';
import { TransactionUtils } from '../../../utils/TransactionUtils';
import {
  adjustedTransactionAmount,
  fromScientificNotation,
  getCurrentMinAssetAmount,
} from '../../../utils/NumberUtils';
import { LEDGER_WALLET_TYPE, detectConditionsError } from '../../../service/LedgerService';
import {
  AnalyticsActions,
  AnalyticsCategory,
  AnalyticsService,
  AnalyticsTxType,
} from '../../../service/analytics/AnalyticsService';
import { secretStoreService } from '../../../service/storage/SecretStoreService';
import { walletService } from '../../../service/WalletService';

import ModalPopup from '../../../components/ModalPopup/ModalPopup';
import SuccessModalPopup from '../../../components/SuccessModalPopup/SuccessModalPopup';
import ErrorModalPopup from '../../../components/ErrorModalPopup/ErrorModalPopup';
import PasswordFormModal from '../../../components/PasswordForm/PasswordFormModal';
import RowAmountOption from '../../../components/RowAmountOption/RowAmountOption';
import ValidatorListTable from './ValidatorListTable';

import {
  UNBLOCKING_PERIOD_IN_DAYS,
  FIXED_DEFAULT_FEE,
  SUPPORTED_CURRENCY,
} from '../../../config/StaticConfig';
import { isValidatorAddressSuspicious } from '../../../models/ModerationConfig';
import { useLedgerStatus } from '../../../hooks/useLedgerStatus';
import { ledgerNotification } from '../../../components/LedgerNotification/LedgerNotification';
import GasStepSelectTendermint, {
  GasInfoTendermint,
} from '../../../components/GasCustomize/Tendermint/GasSelect';

const { Content, Sider } = Layout;
const { Search } = Input;
const layout = {
  // labelCol: { span: 8 },
  // wrapperCol: { span: 16 },
};
const tailLayout = {
  // wrapperCol: { offset: 8, span: 16 },
};

export const FormDelegationRequest = props => {
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
      console.error('Error occurred while transfer', e);
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
    `${walletAsset.assetType}-${walletAsset.mainnetSymbol}-${currentSession.currency}`,
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
      <GasStepSelectTendermint />
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
                {walletAsset && assetMarketData && assetMarketData.price
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
            <GasInfoTendermint />
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
