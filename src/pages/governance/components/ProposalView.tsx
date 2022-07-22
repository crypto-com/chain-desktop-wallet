import React, { useState, useEffect, useRef } from 'react';
import moment from 'moment';
import Big from 'big.js';
import '../governance.less';
import 'antd/dist/antd.css';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Layout, Radio, Button, Card, Progress, Form, InputNumber, Spin } from 'antd';
import {
  // ArrowLeftOutlined,
  LoadingOutlined,
  // InfoCircleOutlined
} from '@ant-design/icons';
import { useRecoilValue, useRecoilState } from 'recoil';
import { useTranslation } from 'react-i18next';

import { secretStoreService } from '../../../service/storage/SecretStoreService';
import { ledgerNotification } from '../../../components/LedgerNotification/LedgerNotification';
import { TransactionUtils } from '../../../utils/TransactionUtils';

import { ledgerIsExpertModeState, sessionState, walletAssetState } from '../../../recoil/atom';
import { useLedgerStatus } from '../../../hooks/useLedgerStatus';
import { detectConditionsError, LEDGER_WALLET_TYPE } from '../../../service/LedgerService';

import ModalPopup from '../../../components/ModalPopup/ModalPopup';
import SuccessModalPopup from '../../../components/SuccessModalPopup/SuccessModalPopup';
import ErrorModalPopup from '../../../components/ErrorModalPopup/ErrorModalPopup';
import PasswordFormModal from '../../../components/PasswordForm/PasswordFormModal';

import { ProposalModel, ProposalStatuses, VoteOption } from '../../../models/Transaction';
import { walletService } from '../../../service/WalletService';
import { AnalyticsService } from '../../../service/analytics/AnalyticsService';
import { getUIDynamicAmount, getBaseScaledAmount } from '../../../utils/NumberUtils';

import { renderExplorerUrl } from '../../../models/Explorer';
import { GasInfoTendermint } from '../../../components/GasStepSelect/GasStepSelectTendermint';

const { Header, Content, Sider } = Layout;

export const ProposalView = (props: any) => {
  const [form] = Form.useForm();

  const allProps = props?.props;
  const { proposalList, setProposalList } = allProps;
  const currentSession = useRecoilValue(sessionState);
  const [finalAmount, setFinalAmount] = useState('10,001');
  const [remainingAmount, setRemainingAmount] = useState('10001');
  const [proposalStatus, setProposposalStatus] = useState(allProps?.proposal?.status);

  const [userAsset, setUserAsset] = useRecoilState(walletAssetState);

  const [totalDepositValue, setTotalDeposit] = useState('0');
  const [totalDepositPercentageValue, setTotalDepositPercentageValue] = useState('0');

  const [isDepositModalVisible, setDepositModalVisible] = useState(false);
  const [confirmDepositModalVisible, setConfirmDepositModalVisible] = useState(false);
  const [isDepositSuccessModalVisible, setDepositSuccessModalVisible] = useState(false);
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [errorMessages, setErrorMessages] = useState([]);

  const [decryptedPhrase, setDecryptedPhrase] = useState('');
  const [inputPasswordVisible, setInputPasswordVisible] = useState(false);

  const { isLedgerConnected } = useLedgerStatus({ asset: userAsset });
  const [ledgerIsExpertMode, setLedgerIsExpertMode] = useRecoilState(ledgerIsExpertModeState);

  const didMountRef = useRef(false);

  const analyticsService = new AnalyticsService(currentSession);

  const numWithCommas = (x: string) => {
    if (x) {
      return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    return x;
  };

  const [t] = useTranslation();

  const customMaxValidator = TransactionUtils.maxValidator(
    remainingAmount.replace(',', ''),
    t('governance.modal2.form.input.proposalDeposit.max.error', {
      maxDeposit: numWithCommas(remainingAmount)
        .concat(' ')
        .concat(userAsset?.symbol),
    }),
  );
  const customMaxValidator0 = TransactionUtils.maxValidator(
    getUIDynamicAmount(userAsset.balance, userAsset),
    t('governance.modal2.form.input.proposalDeposit.max2.error'),
  );
  const customAmountValidator = TransactionUtils.validTransactionAmountValidator();

  const handleCloseDepositSuccessModal = () => {
    setDepositSuccessModalVisible(false);
  };

  const closeErrorModal = () => {
    setIsErrorModalVisible(false);
  };

  const handleCancelDepositModal = () => {
    if (!allProps.confirmLoading) {
      setDepositModalVisible(false);
      setConfirmDepositModalVisible(false);
      form.resetFields();
    }
  };

  const onRadioChange = e => {
    allProps.setVoteOption(e.target.value);
  };

  const onVote = async () => {
    allProps.setModalType('confirmation');
    allProps.showPasswordInput();
  };

  const totalDeposit = () => {
    const depositCalc = allProps?.proposal?.total_deposit
      .reduce((partialSum, a) => partialSum.plus(Big(a.amount)), Big(0))
      .toString();
    const totalDeposit = Big(getUIDynamicAmount(depositCalc, userAsset)).toString();
    setTotalDeposit(totalDeposit);
  };

  const totalDepositPercentage = () => {
    const finalPercentage = Big(totalDepositValue)
      .div(Big(finalAmount.replace(',', '')))
      .times(100)
      .toString();
    setTotalDepositPercentageValue(finalPercentage);
  };

  const remainingDays = () => {
    const submitTime = moment(allProps?.proposal?.submit_time);
    const endDepositTime = moment(allProps?.proposal?.deposit_end_time);
    const duration = moment.duration(endDepositTime.diff(submitTime));
    const days = duration.asDays();
    return days.toString();
  };

  const remainingTotal = () => {
    const remaining = Big(finalAmount.replace(',', ''))
      .minus(Big(totalDepositValue))
      .toString();
    setRemainingAmount(remaining);
  };

  const submitProposalDeposit = async () => {
    const { walletType } = currentSession.wallet;
    const { baseDenom } = currentSession.wallet.config.network.coin;
    allProps.setConfirmLoading(true);

    try {
      const proposalDeposit = await walletService.sendProposalDepositTx({
        proposalId: allProps?.proposal?.proposal_id,
        depositor: userAsset.address!,
        amount: [
          {
            amount: getBaseScaledAmount(form?.getFieldValue('depositAmount'), userAsset),
            denom: baseDenom,
          },
        ],
        decryptedPhrase,
        walletType,
      });

      if (proposalDeposit?.transactionHash) {
        allProps.setConfirmLoading(false);
        allProps.setIsVisibleConfirmationModal(false);
        setConfirmDepositModalVisible(false);
        form.resetFields();

        setTimeout(() => {
          setDepositSuccessModalVisible(true);
        }, 400);

        await refreshProposal();
      }
    } catch (e) {
      if (currentSession.wallet.walletType === LEDGER_WALLET_TYPE) {
        setLedgerIsExpertMode(detectConditionsError(((e as unknown) as any).toString()));
      }
      setErrorMessages(((e as unknown) as any).message.split(': '));
      allProps.setIsVisibleConfirmationModal(false);
      allProps.setConfirmLoading(false);
      // setInputPasswordVisible(false);
      setIsErrorModalVisible(true);
      // eslint-disable-next-line no-console
      console.error('Error occurred while transfer', e);
    }
    allProps.setConfirmLoading(false);
  };

  let fetchProposalList = async () => {
    const list: ProposalModel[] = await walletService.retrieveProposals(
      currentSession.wallet.config.network.chainId,
    );

    const latestProposalOnTop = list.reverse();
    setProposalList(latestProposalOnTop);
  };

  const refreshProposal = async () => {
    await allProps.refreshProposal();
    const sessionData = await walletService.retrieveCurrentSession();

    totalDeposit();
    totalDepositPercentage();
    const currentWalletAsset = await walletService.retrieveDefaultWalletAsset(sessionData);
    setUserAsset(currentWalletAsset);
  };

  const showPasswordInput = () => {
    // TODO: check if decryptedPhrase expired
    if ((decryptedPhrase && false) || currentSession.wallet.walletType === LEDGER_WALLET_TYPE) {
      if (!isLedgerConnected && currentSession.wallet.walletType === LEDGER_WALLET_TYPE) {
        ledgerNotification(currentSession.wallet, userAsset!);
      }
      setConfirmDepositModalVisible(true);
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
    setInputPasswordVisible(false);
    setConfirmDepositModalVisible(true);
  };

  useEffect(() => {
    fetchProposalList = async () => {
      const list: ProposalModel[] = await walletService.retrieveProposals(
        currentSession.wallet.config.network.chainId,
      );

      const latestProposalOnTop = list.reverse();
      setProposalList(latestProposalOnTop);
    };

    if (!didMountRef.current) {
      fetchProposalList();
      didMountRef.current = true;
      analyticsService.logPage('Governance');
    }

    setFinalAmount('10,001');
    remainingTotal();

    setUserAsset(userAsset);

    setProposposalStatus(allProps?.proposal?.status);
    totalDeposit();
    totalDepositPercentage();
    // eslint-disable-next-line
  }, [proposalList, setProposalList, finalAmount, setFinalAmount, props]);

  return (
    <div className="site-layout-background governance-content">
      <div className="container">
        <Layout className="proposal-detail">
          <Content>
            {/* <a>
              <div
                className="back-button"
                onClick={() => allProps.setIsProposalVisible(false)}
                style={{ fontSize: '16px' }}
              >
                <ArrowLeftOutlined style={{ fontSize: '16px', color: '#1199fa' }} />{' '}
                {allProps.historyVisible ? (
                  <>{t('governance.backToHistory')}</>
                ) : (
                  <>{t('governance.backToList')}</>
                )}
              </div>
            </a> */}
            {/* <div className="title">
              {allProps.proposal?.content.title}
            </div>
            <div className="item">
              <div className="status">{processStatusTag(allProps.proposal?.status)}</div>
            </div> */}
            <div className="item">
              {proposalStatus === 'PROPOSAL_STATUS_DEPOSIT_PERIOD' ? (
                <div className="date">
                  <div className="date-container">
                    <div className="info-area date-start">
                      <div className="txt">{t('governance.start')} </div>
                      <div className="info">
                        {moment(allProps.proposal?.submit_time).format('DD/MM/YYYY, h:mm A')}
                      </div>
                    </div>
                    <div className="info-area date-end">
                      <div className="txt">{t('governance.end')} </div>
                      <div className="info">
                        {moment(allProps.proposal?.deposit_end_time).format('DD/MM/YYYY, h:mm A')}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="date">
                  <div className="date-container">
                    <div className="info-area date-start">
                      <div className="txt">{t('governance.start')} </div>
                      <div className="info">
                        {moment(allProps.proposal?.voting_start_time).format('DD/MM/YYYY, h:mm A')}
                      </div>
                    </div>
                    <div className="info-area date-end">
                      <div className="txt">{t('governance.end')} </div>
                      <div className="info">
                        {moment(allProps.proposal?.voting_end_time).format('DD/MM/YYYY, h:mm A')}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="info-area proposal-id">
              <div className="txt">{t('governance.success-modal2.proposal-id')}</div>
              <div className="info">
                #ID-
                {allProps?.proposal?.proposal_id}
              </div>
            </div>

            <div className="description">
              {allProps.proposal?.content.description.split('\\n').map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <div className="item">
              {allProps.proposal?.status === ProposalStatuses.PROPOSAL_STATUS_VOTING_PERIOD ? (
                <Card
                  title={t('governance.castVote')}
                  style={{
                    maxWidth: '500px',
                  }}
                >
                  <Radio.Group onChange={onRadioChange} value={allProps.voteOption}>
                    <Radio.Button value={VoteOption.VOTE_OPTION_YES}>
                      Yes - {t('governance.voteOption.yes')}
                    </Radio.Button>
                    <Radio.Button value={VoteOption.VOTE_OPTION_NO}>
                      No - {t('governance.voteOption.no')}
                    </Radio.Button>
                    <Radio.Button value={VoteOption.VOTE_OPTION_NO_WITH_VETO}>
                      No with Veto - {t('governance.voteOption.noWithVeto')}
                    </Radio.Button>
                    <Radio.Button value={VoteOption.VOTE_OPTION_ABSTAIN}>
                      Abstain - {t('governance.voteOption.abstain')}
                    </Radio.Button>
                  </Radio.Group>
                  {/* <div className="item"> */}
                  <Button type="primary" disabled={!allProps.voteOption} onClick={onVote}>
                    {t('governance.sendVote')}
                  </Button>
                  {/* </div> */}
                </Card>
              ) : (
                ''
              )}
            </div>
          </Content>

          <Sider
            width={proposalStatus === 'PROPOSAL_STATUS_DEPOSIT_PERIOD' ? '400px' : '300px'}
            className={
              proposalStatus === 'PROPOSAL_STATUS_DEPOSIT_PERIOD' ? 'deposit-side' : 'side'
            }
          >
            <Spin
              spinning={allProps.isLoadingTally}
              indicator={<LoadingOutlined />}
              tip="Loading latest results"
            >
              {proposalStatus === 'PROPOSAL_STATUS_DEPOSIT_PERIOD' ? (
                <>
                  <Card>
                    <div className="deposit-card-header">
                      {numWithCommas(totalDepositValue).concat(' ')} {userAsset?.symbol}
                      <span>
                        {' '.concat(t('governance.proposalView.deposited.header'))} {finalAmount}{' '}
                        {userAsset?.symbol}
                      </span>
                    </div>
                    <Progress
                      className="deposit-progress"
                      percent={parseFloat(totalDepositPercentageValue)}
                      showInfo={false}
                      status="normal"
                      strokeColor={{
                        from: '#00A68C',
                        to: '#00A68C',
                      }}
                    />
                    <div className="progress-info">
                      <span className="left">
                        {totalDepositPercentageValue}% {t('governance.proposalView.deposited.cro')}{' '}
                        {finalAmount} {userAsset?.symbol}
                      </span>
                      <span className="right">
                        {remainingDays()} {t('governance.proposalView.deposited.days')}
                      </span>
                    </div>

                    <Button
                      className="submit-proposal-btn"
                      type="primary"
                      disabled={!allProps.voteOption}
                      onClick={() => {
                        if (
                          !isLedgerConnected &&
                          currentSession.wallet.walletType === LEDGER_WALLET_TYPE
                        ) {
                          ledgerNotification(currentSession.wallet, userAsset!);
                        }
                        setDepositModalVisible(true);
                      }}
                    >
                      {t('governance.proposalView.modal3.depositBtn')}
                    </Button>
                  </Card>
                </>
              ) : (
                <Card title={t('governance.result')} style={{ padding: '4px' }}>
                  <div className="vote-result-section">
                    Yes - {t('governance.voteOption.yes')}
                    <br />
                    {/* Vote: {proposalFigures.yes.vote} */}
                    <Progress
                      percent={parseFloat(allProps?.proposalFigures?.yes.rate)}
                      size="small"
                      status="normal"
                      strokeColor={{
                        from: '#31ac46',
                        to: '#1a7905',
                      }}
                    />
                  </div>

                  <div className="vote-result-section">
                    No - {t('governance.voteOption.no')}
                    <br />
                    {/* Vote:  {proposalFigures.no.vote} */}
                    <Progress
                      percent={parseFloat(allProps?.proposalFigures?.no.rate)}
                      strokeColor={{
                        from: '#ec7777',
                        to: '#f27474',
                      }}
                      size="small"
                      status="normal"
                    />
                  </div>

                  <div className="vote-result-section">
                    No with Veto - {t('governance.voteOption.noWithVeto')}
                    <br />
                    {/* Vote:  {proposalFigures.no.vote} */}
                    <Progress
                      percent={parseFloat(allProps?.proposalFigures?.noWithVeto.rate)}
                      strokeColor={{
                        from: '#e2c24d',
                        to: '#f3a408',
                      }}
                      size="small"
                      status="normal"
                    />
                  </div>

                  <div className="vote-result-section">
                    Abstain - {t('governance.voteOption.abstain')}
                    <br />
                    {/* Vote:  {proposalFigures.no.vote} */}
                    <Progress
                      percent={parseFloat(allProps?.proposalFigures?.abstain.rate)}
                      strokeColor={{
                        from: '#dbdddc',
                        to: '#b1b3b3',
                      }}
                      size="small"
                      status="normal"
                    />
                  </div>
                </Card>
              )}
            </Spin>
          </Sider>

          {/* DEPOSIT IN PROPOSAL MODAL */}
          <ModalPopup
            isModalVisible={isDepositModalVisible}
            handleCancel={handleCancelDepositModal}
            handleOk={() => {}}
            closable={!allProps.confirmLoading}
            confirmationLoading={allProps.confirmLoading}
            footer={[
              <Button
                key="submit"
                type="primary"
                loading={allProps.confirmLoading}
                onClick={() => {
                  form.submit();
                }}
                disabled={
                  !isLedgerConnected && currentSession.wallet.walletType === LEDGER_WALLET_TYPE
                }
              >
                {t('governance.proposalView.modal3.depositBtn')}
              </Button>,
              <Button key="back" type="link" onClick={handleCancelDepositModal}>
                {t('general.cancel')}
              </Button>,
            ]}
            okText={t('general.confirm')}
          >
            <>
              <Header className="create-proposal-header">
                {' '}
                {t('governance.proposalView.modal3.header')}{' '}
              </Header>

              <Form
                className="create-proposal-form"
                form={form}
                name="create-proposal-form"
                layout="vertical"
                requiredMark={false}
                onFinish={() => {
                  allProps.setModalType('deposit');
                  setDepositModalVisible(false);

                  setTimeout(() => {
                    showPasswordInput();
                  }, 200);
                }}
              >
                <Form.Item
                  name="depositAmount"
                  validateFirst
                  label={t('governance.proposalView.modal3.field')}
                  hasFeedback
                  rules={[
                    {
                      required: true,
                      message: `${t('governance.modal2.form.input.proposalDeposit')} ${t(
                        'general.required',
                      )}`,
                    },
                    {
                      pattern: /[^0]+/,
                      message: t('governance.modal2.form.input.proposalDeposit.error'),
                    },
                    customAmountValidator,
                    customMaxValidator,
                    customMaxValidator0,
                  ]}
                >
                  <InputNumber
                    placeholder={`${t('governance.proposalView.modal3.placeholder')}`}
                    addonAfter={userAsset.symbol}
                  />
                </Form.Item>

                <div className="avail-bal-container">
                  <div className="avail-bal-txt">{t('governance.modal2.form.balance')}</div>
                  <div className="avail-bal-val">
                    {getUIDynamicAmount(userAsset.balance, userAsset)} {userAsset.symbol}
                  </div>
                </div>
              </Form>
            </>
          </ModalPopup>

          {/* DEPOSIT IN PROPOSAL MODAL */}
          <ModalPopup
            className="deposit-proposal-modal"
            isModalVisible={confirmDepositModalVisible}
            handleCancel={handleCancelDepositModal}
            handleOk={() => {
              submitProposalDeposit();
            }}
            closable={!allProps.confirmLoading}
            confirmationLoading={allProps.confirmLoading}
            footer={[
              <Button
                key="submit"
                type="primary"
                loading={allProps.confirmLoading}
                onClick={() => {
                  submitProposalDeposit();
                }}
                disabled={
                  !isLedgerConnected && currentSession.wallet.walletType === LEDGER_WALLET_TYPE
                }
              >
                {t('governance.proposalView.modal4.depositBtn')}
              </Button>,
              <Button key="back" type="link" onClick={handleCancelDepositModal}>
                {t('general.cancel')}
              </Button>,
            ]}
            okText={t('general.confirm')}
          >
            <>
              <div className="title">{t('governance.proposalView.modal4.header')}</div>
              <div className="description">{t('governance.proposalView.modal4.description')}</div>
              <div className="row">
                <div className="field">{t('home.transactions.table1.fromAddress')} </div>
                <div className="value">
                  <a
                    data-original={userAsset.address}
                    target="_blank"
                    rel="noreferrer"
                    href={`${renderExplorerUrl(
                      currentSession.activeAsset?.config ?? currentSession.wallet.config,
                      'address',
                    )}/${userAsset.address}`}
                  >
                    {userAsset.address}
                  </a>
                </div>
              </div>

              <div className="row">
                <div className="field">{t('governance.proposalView.modal4.amountLabel')} </div>
                <div className="value">
                  {numWithCommas(form?.getFieldValue('depositAmount'))}{' '}
                  {currentSession.wallet.config.network.coin.croDenom.toUpperCase()}
                </div>
              </div>
              <GasInfoTendermint />
            </>
          </ModalPopup>

          {/* CREATE PROPOSAL's SUCCESS MODAL */}
          <SuccessModalPopup
            isModalVisible={isDepositSuccessModalVisible}
            handleCancel={handleCloseDepositSuccessModal}
            handleOk={handleCloseDepositSuccessModal}
            title={t('general.successModalPopup.title')}
            button={null}
            footer={[
              <Button
                className="create-proposal-success-btn"
                key="submit"
                type="primary"
                onClick={handleCloseDepositSuccessModal}
              >
                {t('general.ok')}
              </Button>,
            ]}
          >
            <div className="create-proposal-success-modal">
              <div className="info">{t('governance.proposalView.successModal.message')}</div>
            </div>
          </SuccessModalPopup>

          <ErrorModalPopup
            isModalVisible={isErrorModalVisible}
            handleCancel={closeErrorModal}
            handleOk={closeErrorModal}
            title={t('general.errorModalPopup.title')}
            footer={[]}
          >
            <>
              <div className="description">
                {t('general.errorModalPopup.vote.description')}
                <br />
                {errorMessages
                  .filter((item, idx) => {
                    return errorMessages.indexOf(item) === idx;
                  })
                  .map((err, idx) => (
                    <div key={idx}>- {err}</div>
                  ))}
                {ledgerIsExpertMode ? (
                  <div>{t('general.errorModalPopup.ledgerExportMode')}</div>
                ) : (
                  ''
                )}
              </div>
            </>
          </ErrorModalPopup>

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
        </Layout>
      </div>
    </div>
  );
};
