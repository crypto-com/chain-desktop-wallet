import React, { useEffect, useState } from 'react';
import '../staking.less';
import 'antd/dist/antd.css';
import { Button, Form, Table, Typography, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useTranslation } from 'react-i18next';

import {
  sessionState,
  walletAssetState,
  ledgerIsExpertModeState,
  fetchingDBState,
} from '../../../recoil/atom';
import { UserAsset } from '../../../models/UserAsset';
import { BroadCastResult, StakingTransactionData } from '../../../models/Transaction';
import { renderExplorerUrl } from '../../../models/Explorer';
import { getUIDynamicAmount } from '../../../utils/NumberUtils';
import { middleEllipsis } from '../../../utils/utils';
import { LEDGER_WALLET_TYPE, detectConditionsError } from '../../../service/LedgerService';

import { secretStoreService } from '../../../service/storage/SecretStoreService';
import { walletService } from '../../../service/WalletService';

import ModalPopup from '../../../components/ModalPopup/ModalPopup';
import SuccessModalPopup from '../../../components/SuccessModalPopup/SuccessModalPopup';
import ErrorModalPopup from '../../../components/ErrorModalPopup/ErrorModalPopup';
import PasswordFormModal from '../../../components/PasswordForm/PasswordFormModal';
import { FormUndelegateComponent } from './FormUndelegateComponent';
import { FormRedelegateComponent } from './FormRedelegateComponent';

import { useLedgerStatus } from '../../../hooks/useLedgerStatus';
import { ledgerNotification } from '../../../components/LedgerNotification/LedgerNotification';

const { Text } = Typography;

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

export const FormDelegationOperations = props => {
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
            <FormUndelegateComponent
              currentSession={currentSession}
              undelegateFormValues={undelegateFormValues}
              isChecked={isUndelegateDisclaimerChecked}
              setIsChecked={setIsUndelegateDisclaimerChecked}
              form={form}
            />
          ) : (
            <FormRedelegateComponent
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
