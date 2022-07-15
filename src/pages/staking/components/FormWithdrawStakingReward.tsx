import React, { useEffect, useState } from 'react';
import '../staking.less';
import 'antd/dist/antd.css';
import { Button, Table, Typography, Spin } from 'antd';
import { ExclamationCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useTranslation } from 'react-i18next';
import Big from 'big.js';
import numeral from 'numeral';

import {
  allMarketState,
  sessionState,
  walletAssetState,
  ledgerIsExpertModeState,
  fetchingDBState,
} from '../../../recoil/atom';
import {
  AssetMarketPrice,
  getAssetRewardsBalancePrice,
  scaledRewardBalance,
  UserAsset,
} from '../../../models/UserAsset';
import { BroadCastResult, RewardTransactionData } from '../../../models/Transaction';
import { renderExplorerUrl } from '../../../models/Explorer';
import { getUIDynamicAmount } from '../../../utils/NumberUtils';
// import { isNumeric } from '../../../utils/utils';
import { LEDGER_WALLET_TYPE, detectConditionsError } from '../../../service/LedgerService';

import { secretStoreService } from '../../../service/storage/SecretStoreService';
import { walletService } from '../../../service/WalletService';

import ModalPopup from '../../../components/ModalPopup/ModalPopup';
import SuccessModalPopup from '../../../components/SuccessModalPopup/SuccessModalPopup';
import ErrorModalPopup from '../../../components/ErrorModalPopup/ErrorModalPopup';
import PasswordFormModal from '../../../components/PasswordForm/PasswordFormModal';

import { SUPPORTED_CURRENCY } from '../../../config/StaticConfig';

import { useLedgerStatus } from '../../../hooks/useLedgerStatus';
import { ledgerNotification } from '../../../components/LedgerNotification/LedgerNotification';
import { GasInfoTendermint } from '../../../components/GasStepSelect/GasStepSelectTendermint';
import GasStepSelect from '../../../components/GasStepSelect/index';

const { Text } = Typography;

interface RewardsTabularData {
  key: string;
  rewardAmount: string;
  rewardMarketPrice: string;
  validatorAddress: string;
}

export const FormWithdrawStakingReward = () => {
  type RewardActionType = 'withdrawall' | 'withdraw' | 'restake' | 'restakeall';

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

  const [withdrawAllModalVisible, setWithdrawAllModalVisible] = useState(false);
  const [restakeAllModalVisible, setRestakeAllModalVisible] = useState(false);

  const [marketData, setMarketData] = useState<AssetMarketPrice>();

  const [ledgerIsExpertMode, setLedgerIsExpertMode] = useRecoilState(ledgerIsExpertModeState);
  const allMarketData = useRecoilValue(allMarketState);
  const currentSession = useRecoilValue(sessionState);
  const fetchingDB = useRecoilValue(fetchingDBState);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [rewards, setRewards] = useState<RewardsTabularData[]>([]);
  const { isLedgerConnected } = useLedgerStatus({ asset: walletAsset });

  const maxLedgerRestake = 3;

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

  const syncRewardsData = async () => {
    const currentMarketData = allMarketData.get(
      `${walletAsset?.mainnetSymbol}-${currentSession?.currency}`,
    );

    const allRewards: RewardTransactionData[] = await walletService.retrieveAllRewards(
      currentSession.wallet.identifier,
    );

    const currentWalletAsset = await walletService.retrieveDefaultWalletAsset(currentSession);
    setWalletAsset(currentWalletAsset);

    const rewardsTabularData = convertToTabularData(
      allRewards,
      currentWalletAsset,
      currentMarketData,
    );
    setRewards(rewardsTabularData);
    setWalletAsset(currentWalletAsset);
  };

  useEffect(() => {
    setMarketData(allMarketData.get(`${walletAsset?.mainnetSymbol}-${currentSession.currency}`));
    syncRewardsData();
  }, [fetchingDB, confirmLoading, isRewardsLoading]);

  const showConfirmationModal = () => {
    setInputPasswordVisible(false);
    setIsVisibleConfirmationModal(true);
  };

  const showConfirmationRestakeModal = () => {
    setInputPasswordVisible(false);
    setIsConfirmationRestakeModalVisible(true);
  };

  const handleWithdrawAllModal = () => {
    setWithdrawAllModalVisible(false);
    setInputPasswordVisible(false);
  };

  const handleRestakeAllModal = () => {
    setRestakeAllModalVisible(false);
    setInputPasswordVisible(false);
  };

  const showPasswordInput = (action: string) => {
    // TODO: check if decryptedPhrase expired
    if ((decryptedPhrase && false) || currentSession.wallet.walletType === LEDGER_WALLET_TYPE) {
      if (!isLedgerConnected && currentSession.wallet.walletType === LEDGER_WALLET_TYPE) {
        ledgerNotification(currentSession.wallet, walletAsset!);
        return;
      }
      if (action === 'restake') {
        showConfirmationRestakeModal();
      } else if (action === 'withdrawall') {
        setWithdrawAllModalVisible(true);
      } else if (action === 'restakeall') {
        setRestakeAllModalVisible(true);
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
    } else if (rewardAction === 'withdrawall') {
      setWithdrawAllModalVisible(true);
    } else if (rewardAction === 'restakeall') {
      setRestakeAllModalVisible(true);
    } else {
      showConfirmationModal();
    }
  };

  const onConfirmWithdrawAllStakingRewards = async () => {
    const { walletType } = currentSession.wallet;
    if (!decryptedPhrase && currentSession.wallet.walletType !== LEDGER_WALLET_TYPE) {
      setWithdrawAllModalVisible(false);
      setIsVisibleConfirmationModal(false);
      return;
    }
    try {
      setIsVisibleConfirmationModal(false);
      setConfirmLoading(true);
      const rewardWithdrawAllResult = await walletService.sendStakingWithdrawAllRewardsTx({
        validatorAddressList: rewards.map(rewardInfo => rewardInfo.validatorAddress),
        decryptedPhrase,
        walletType,
      });
      setBroadcastResult(rewardWithdrawAllResult);
      setIsVisibleConfirmationModal(false);
      handleWithdrawAllModal();
      setConfirmLoading(false);
      setIsSuccessTransferModalVisible(true);
    } catch (e) {
      if (walletType === LEDGER_WALLET_TYPE) {
        setLedgerIsExpertMode(detectConditionsError(((e as unknown) as any).toString()));
      }

      setIsVisibleConfirmationModal(false);
      setErrorMessages(((e as unknown) as any).message.split(': '));
      setWithdrawAllModalVisible(false);
      setConfirmLoading(false);
      setInputPasswordVisible(false);
      setIsErrorTransferModalVisible(true);
      // eslint-disable-next-line no-console
      console.error('Error occurred while transfer', e);
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
      setIsRewardsLoading(true);
      await syncRewardsData();
      setIsRewardsLoading(false);
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

  const onConfirmRestakeReward = async () => {
    const { walletType } = currentSession.wallet;
    if (!decryptedPhrase && currentSession.wallet.walletType !== LEDGER_WALLET_TYPE) {
      setIsVisibleConfirmationModal(false);
      return;
    }
    try {
      setConfirmLoading(true);
      const restakeRewardAmount = withdrawValues.rewardAmount.split(' ')[0];
      const restakeRewardResult = await walletService.sendRestakeRewardsTx({
        validatorAddress: withdrawValues.validatorAddress,
        decryptedPhrase,
        walletType,
        amount: restakeRewardAmount,
        asset: walletAsset,
        memo: '',
      });

      if (restakeRewardResult.transactionHash) {
        // Success - Reward withdraw transaction was successfully broadcasted

        // withdrawValues.rewardAmount = '0.1 CRO'

        setBroadcastResult(restakeRewardResult);
        setSuccessRestakeRewardModalMessage(
          t('general.successModalPopup.restakeReward.description1'),
        );

        setIsConfirmationRestakeModalVisible(false);
        setConfirmLoading(false);
        setIsSuccessRestakeRewardModalVisible(true);
      } else if (
        restakeRewardResult?.code !== undefined &&
        restakeRewardResult?.code !== null &&
        restakeRewardResult.code === walletService.BROADCAST_TIMEOUT_CODE
      ) {
        // Timed Out - Reward withdraw transaction
        setBroadcastResult(restakeRewardResult);
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
      console.error('Error occurred while transfer', e);
    }
  };

  const onConfirmRestakeAllRewards = async () => {
    const { walletType } = currentSession.wallet;
    if (!decryptedPhrase && currentSession.wallet.walletType !== LEDGER_WALLET_TYPE) {
      setIsVisibleConfirmationModal(false);
      setRestakeAllModalVisible(false);
      return;
    }
    try {
      setIsVisibleConfirmationModal(false);
      setConfirmLoading(true);

      const restakeRewardResult = await walletService.sendRestakeAllRewardsTx({
        validatorAddressList: rewards.map(rewardInfo => rewardInfo.validatorAddress),
        decryptedPhrase,
        walletType,
        amountList: rewards.map(rewardInfo => rewardInfo.rewardAmount.split(' ')[0]),
        asset: walletAsset,
        memo: '',
      });

      if (restakeRewardResult.transactionHash) {
        setBroadcastResult(restakeRewardResult);
        setSuccessRestakeRewardModalMessage(
          t('general.successModalPopup.restakeReward.description1'),
        );

        setIsConfirmationRestakeModalVisible(false);
        setIsVisibleConfirmationModal(false);
        setConfirmLoading(false);
        setIsSuccessRestakeRewardModalVisible(true);
        handleRestakeAllModal();
      } else if (
        restakeRewardResult?.code !== undefined &&
        restakeRewardResult?.code !== null &&
        restakeRewardResult.code === walletService.BROADCAST_TIMEOUT_CODE
      ) {
        // Timed Out - Reward withdraw transaction
        setBroadcastResult(restakeRewardResult);
        setSuccessRestakeRewardModalMessage(
          t('general.successModalPopup.restakeReward.description4'),
        );
        setIsVisibleConfirmationModal(false);
        setIsConfirmationRestakeModalVisible(false);
        setConfirmLoading(false);
        setIsSuccessRestakeRewardModalVisible(true);
        setRestakeAllModalVisible(false);
      } else {
        // Failed - Reward withdraw transaction
        throw new Error(t('general.errorModalPopup.reward.description'));
      }
    } catch (e) {
      if (walletType === LEDGER_WALLET_TYPE) {
        setLedgerIsExpertMode(detectConditionsError(((e as unknown) as any).toString()));
      }

      setErrorMessages(((e as unknown) as any).message.split(': '));
      setRestakeAllModalVisible(false);
      setIsConfirmationRestakeModalVisible(false);
      setConfirmLoading(false);
      setInputPasswordVisible(false);
      setIsErrorTransferModalVisible(true);
      // eslint-disable-next-line no-console
      console.error('Error occurred during transfer', e);
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
      key: 'withdrawAction',
      render: record => (
        <>
          <a
            onClick={() => {
              setWithdrawValues({
                validatorAddress: record.validatorAddress,
                rewardAmount: record.rewardAmount,
                rewardMarketPrice: record.rewardMarketPrice,
              });
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
      key: 'restakeAction',
      render: record => (
        <>
          <a
            onClick={() => {
              setWithdrawValues({
                validatorAddress: record.validatorAddress,
                rewardAmount: record.rewardAmount,
                rewardMarketPrice: record.rewardMarketPrice,
              });
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
      />
    );
  };

  return (
    <div>
      {!rewards || rewards.length === 0 || !rewards[0].validatorAddress ? (
        ''
      ) : (
        <div className="top-action-btns">
          {rewards.length > maxLedgerRestake &&
          currentSession.wallet.walletType === LEDGER_WALLET_TYPE ? (
            <>
              <div />
              <Button
                id="withdraw-all-btn"
                className="top-action-btn"
                type="primary"
                onClick={() => {
                  setRewardAction('withdrawall');
                  setTimeout(() => {
                    showPasswordInput('withdrawall');
                  }, 200);
                }}
              >
                {t('staking.withdrawall')}
              </Button>
            </>
          ) : (
            <>
              <Button
                id="withdraw-all-btn"
                className="top-action-btn"
                type="primary"
                onClick={() => {
                  setRewardAction('withdrawall');
                  setTimeout(() => {
                    showPasswordInput('withdrawall');
                  }, 200);
                }}
              >
                {t('staking.withdrawall')}
              </Button>
              <Button
                id="restake-all-btn"
                className="top-action-btn"
                type="primary"
                onClick={() => {
                  setRewardAction('restakeall');
                  setTimeout(() => {
                    showPasswordInput('restakeall');
                  }, 200);
                }}
              >
                {t('staking.restakeall')}
              </Button>
            </>
          )}
        </div>
      )}

      {/* Withdraw All Rewards Modal */}
      <ModalPopup
        isModalVisible={withdrawAllModalVisible}
        handleCancel={handleWithdrawAllModal}
        handleOk={onConfirmWithdrawAllStakingRewards}
        confirmationLoading={confirmLoading}
        className="reward-modal"
        footer={[
          <Button
            key="submit"
            type="primary"
            loading={confirmLoading}
            disabled={!isLedgerConnected && currentSession.wallet.walletType === LEDGER_WALLET_TYPE}
            onClick={onConfirmWithdrawAllStakingRewards}
          >
            {t('general.confirm')}
          </Button>,
          <Button key="back" type="link" onClick={handleWithdrawAllModal}>
            {t('general.cancel')}
          </Button>,
        ]}
        okText={t('general.confirm')}
      >
        <>
          <div className="title">{t('staking.withdrawall')}</div>
          <div className="description">{t('staking.modal2.description')}</div>
          <div className="item">
            <div className="label">{t('staking.modal2.label1')}</div>
            <div className="address">{`${currentSession.wallet.address}`}</div>
          </div>
          <div className="item">
            <div className="label">{t('staking.modal2.label4')}</div>

            <div
              className={
                rewards && rewards.length > 3 ? 'address-container scrollable' : 'address-container'
              }
            >
              {rewards.map((elem, idx) => (
                <>
                  <div
                    id={'address'.concat(idx.toString())}
                    className="address"
                  >{`${elem?.validatorAddress}`}</div>
                </>
              ))}
            </div>
          </div>
          <div className="item">
            <div className="label">{t('staking.modal2.label5')}</div>
            {walletAsset ? (
              <div>
                {numeral(scaledRewardBalance(walletAsset)).format('0,0.0000')} {walletAsset?.symbol}
              </div>
            ) : (
              ''
            )}

            <div className="fiat">
              {walletAsset && marketData && marketData.price
                ? `${SUPPORTED_CURRENCY.get(marketData.currency)?.symbol}${numeral(
                    getAssetRewardsBalancePrice(walletAsset, marketData),
                  ).format('0,0.00')} ${marketData?.currency}
                    `
                : ''}
            </div>
          </div>
          <GasStepSelect asset={walletAsset} />
          <div className="note">
            <ExclamationCircleOutlined style={{ color: '#1199fa', marginRight: '4px' }} />
            {t('staking.modal6.note.part1')} <b>{t('staking.modal6.note.part2')}</b>{' '}
            {t('staking.modal6.note.part3')} <b>{t('staking.modal6.note.part4')}</b>{' '}
            {t('staking.modal6.note.part5')}
          </div>
        </>
      </ModalPopup>

      {/* Restake All Rewards Modal */}
      <ModalPopup
        isModalVisible={restakeAllModalVisible}
        handleCancel={handleRestakeAllModal}
        handleOk={onConfirmRestakeAllRewards}
        confirmationLoading={confirmLoading}
        className="reward-modal"
        footer={[
          <Button
            key="submit"
            type="primary"
            loading={confirmLoading}
            disabled={!isLedgerConnected && currentSession.wallet.walletType === LEDGER_WALLET_TYPE}
            onClick={onConfirmRestakeAllRewards}
          >
            {t('general.confirm')}
          </Button>,
          <Button key="back" type="link" onClick={handleRestakeAllModal}>
            {t('general.cancel')}
          </Button>,
        ]}
        okText={t('general.confirm')}
      >
        <>
          <div className="title">{t('staking.restakeall')}</div>
          <div className="description">{t('staking.modal2.description')}</div>
          <div className="item">
            <div className="label">{t('staking.modal2.label1')}</div>
            <div className="address">{`${currentSession.wallet.address}`}</div>
          </div>
          <div className="item">
            <div className="label">{t('staking.modal2.label4')}</div>

            <div
              className={
                rewards && rewards.length > 3 ? 'address-container scrollable' : 'address-container'
              }
            >
              {rewards.map((elem, idx) => (
                <>
                  <div
                    id={'address'.concat(idx.toString())}
                    className="address"
                  >{`${elem?.validatorAddress}`}</div>
                </>
              ))}
            </div>
          </div>
          <div className="item">
            <div className="label">{t('staking.modal2.label5')}</div>
            {walletAsset ? (
              <div>
                {numeral(scaledRewardBalance(walletAsset)).format('0,0.0000')} {walletAsset?.symbol}
              </div>
            ) : (
              ''
            )}

            <div className="fiat">
              {walletAsset && marketData && marketData.price
                ? `${SUPPORTED_CURRENCY.get(marketData.currency)?.symbol}${numeral(
                    getAssetRewardsBalancePrice(walletAsset, marketData),
                  ).format('0,0.00')} ${marketData?.currency}
                    `
                : ''}
            </div>
          </div>
          <GasStepSelect asset={walletAsset} />
          <div className="note">
            <ExclamationCircleOutlined style={{ color: '#1199fa', marginRight: '4px' }} />
            {t('staking.modal6.note.part1')} <b>{t('staking.modal6.note.part2')}</b>{' '}
            {t('staking.modal6.note.part3')} <b>{t('staking.modal6.note.part4')}</b>{' '}
            {t('staking.modal6.note.part5')}
          </div>
        </>
      </ModalPopup>

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
          <GasInfoTendermint />
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
          <GasInfoTendermint />
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
