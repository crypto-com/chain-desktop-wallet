import React, { useState, useEffect, useRef } from 'react';
import moment from 'moment';
import './governance.less';
import 'antd/dist/antd.css';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {
  Layout,
  Tabs,
  List,
  Space,
  Button,
  Tag,
  Select,
  Form,
  Input,
  InputNumber,
  Progress,
} from 'antd';

import Big from 'big.js';
import {
  DislikeOutlined,
  LikeOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  ArrowLeftOutlined,
  FieldTimeOutlined,
} from '@ant-design/icons';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useTranslation } from 'react-i18next';
import { ledgerIsExpertModeState, sessionState, walletAssetState } from '../../recoil/atom';

import { getUIVoteAmount, getUIDynamicAmount, getBaseScaledAmount } from '../../utils/NumberUtils';

import {
  ProposalModel,
  ProposalStatuses,
  VoteOption,
  BroadCastResult,
} from '../../models/Transaction';
import { walletService } from '../../service/WalletService';
import { secretStoreService } from '../../service/storage/SecretStoreService';
import ModalPopup from '../../components/ModalPopup/ModalPopup';
import SuccessModalPopup from '../../components/SuccessModalPopup/SuccessModalPopup';
import ErrorModalPopup from '../../components/ErrorModalPopup/ErrorModalPopup';
import PasswordFormModal from '../../components/PasswordForm/PasswordFormModal';
import { detectConditionsError, LEDGER_WALLET_TYPE } from '../../service/LedgerService';
import { DEFAULT_CLIENT_MEMO } from '../../config/StaticConfig';
import { AnalyticsService } from '../../service/analytics/AnalyticsService';
import { useLedgerStatus } from '../../hooks/useLedgerStatus';
import { ledgerNotification } from '../../components/LedgerNotification/LedgerNotification';
import { TransactionUtils } from '../../utils/TransactionUtils';
import { renderExplorerUrl } from '../../models/Explorer';
import { middleEllipsis } from '../../utils/utils';

import { ProposalView } from './components/ProposalView';
import { VotingHistory } from './components/VotingHistory';

const { Header, Content, Footer } = Layout;
const { TabPane } = Tabs;

const IconText = ({ icon, text }) => (
  <Space>
    {React.createElement(icon)}
    {text}
  </Space>
);

const GovernancePage = () => {
  const [form] = Form.useForm();
  const [voteOption, setVoteOption] = useState<VoteOption>(VoteOption.VOTE_OPTION_ABSTAIN);
  const [broadcastResult, setBroadcastResult] = useState<BroadCastResult>({});
  // const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState('confirmation');
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [inputPasswordVisible, setInputPasswordVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [isProposalVisible, setIsProposalVisible] = useState(false);
  const [isProposalSuccessModalVisible, setProposalSuccessModalVisible] = useState(false);
  const [decryptedPhrase, setDecryptedPhrase] = useState('');
  const [errorMessages, setErrorMessages] = useState([]);
  const [proposal, setProposal] = useState<ProposalModel>();

  const numWithCommas = (x: string) => {
    if (x) {
      return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    return x;
  };

  const initialFiguresStates = {
    yes: {
      vote: '',
      rate: '',
    },
    no: {
      vote: '',
      rate: '',
    },
    noWithVeto: {
      vote: '',
      rate: '',
    },
    abstain: {
      vote: '',
      rate: '',
    },
  };
  const [ledgerIsExpertMode, setLedgerIsExpertMode] = useRecoilState(ledgerIsExpertModeState);
  const [proposalFigures, setProposalFigures] = useState(initialFiguresStates);
  const [userAsset, setUserAsset] = useRecoilState(walletAssetState);
  const [proposalList, setProposalList] = useState<ProposalModel[]>();
  const [isConfirmationModalVisible, setIsVisibleConfirmationModal] = useState(false);
  const currentSession = useRecoilValue(sessionState);
  const didMountRef = useRef(false);
  const [isLoadingTally, setIsLoadingTally] = useState(false);
  const minDeposit = '1000';
  const maxDeposit = '10001';

  const [createProposalHash, setCreateProposalHash] = useState('');
  const [initialDepositProposal, setInitialDeposit] = useState('0');
  const [isProposalModalVisible, setIsProposalModalVisible] = useState(false);
  const [isProposalErrorModalVisible, setProposalErrorModalVisible] = useState(false);
  const { isLedgerConnected } = useLedgerStatus({ asset: userAsset });
  const analyticsService = new AnalyticsService(currentSession);
  const [historyVisible, setHistoryVisible] = useState(false);
  const { Option } = Select;
  const [t] = useTranslation();

  const historyBtn = (
    <Button id="votingHistoryBtn" type="link" size="small" onClick={() => setHistoryVisible(true)}>
      <HistoryOutlined style={{ fontSize: '17px' }} /> {t('governance.votingHistoryBtn')}
    </Button>
  );

  const customMaxValidator = TransactionUtils.maxValidator(
    maxDeposit,
    t('governance.modal2.form.input.proposalDeposit.max.error', {
      maxDeposit: numWithCommas(maxDeposit)
        .concat(' ')
        .concat(userAsset?.symbol),
    }),
  );
  const customMaxValidator0 = TransactionUtils.maxValidator(
    getUIDynamicAmount(userAsset.balance, userAsset),
    t('governance.modal2.form.input.proposalDeposit.max2.error'),
  );
  const customMinValidator = TransactionUtils.minValidator(
    minDeposit,
    t('governance.modal2.form.input.proposalDeposit.min.error')
      .concat(' ')
      .concat(minDeposit)
      .concat(' ')
      .concat(userAsset.symbol)
      .concat(' ')
      .concat(t('governance.modal2.form.input.proposalDeposit.min.error2')),
  );

  const resetCreateProposalForm = () => {
    form.resetFields();
    const usersBalance = getUIDynamicAmount(userAsset.balance, userAsset);
    const userDeposit = Big(usersBalance).cmp(Big(minDeposit)) === 1 ? minDeposit : usersBalance;
    form.setFieldsValue({ initialDeposit: userDeposit });
    form.validateFields(['initialDeposit']);
  };

  const handleCancelProposalModal = () => {
    if (!confirmLoading) {
      setIsProposalModalVisible(false);
      resetCreateProposalForm();
    }
  };

  const handleCancelConfirmationModal = () => {
    setIsVisibleConfirmationModal(false);
  };

  const handleCloseProposalSuccessModal = () => {
    setProposalSuccessModalVisible(false);
  };

  const closeSuccessModal = () => {
    setIsSuccessModalVisible(false);
    setIsVisibleConfirmationModal(false);
  };

  const closeErrorModal = () => {
    setIsErrorModalVisible(false);
  };

  const closeProposalErrorModal = () => {
    setProposalErrorModalVisible(false);
  };

  const showConfirmationModal = () => {
    setInputPasswordVisible(false);
    setModalType('confirmation');
    setIsVisibleConfirmationModal(true);
  };

  const checkProposalType = (proposal: any) => {
    const proposal_initial_deposit = proposal?.content['@type']?.toLowerCase();
    let status = '';
    switch (true) {
      case proposal_initial_deposit.indexOf('textproposal') > -1:
        status = t('governance.modal2.form.input.proposalType.choice1');
        break;
      case proposal_initial_deposit.indexOf('parameterchange') > -1:
        status = t('governance.modal2.form.input.proposalType.choice3');
        break;
      case proposal_initial_deposit.indexOf('communitypoolspend') > -1:
        status = t('governance.modal2.form.input.proposalType.choice2');
        break;
      case proposal_initial_deposit.indexOf('cancelsoftwareupgrade') > -1:
        status = t('governance.modal2.form.input.proposalType.choice5');
        break;
      case proposal_initial_deposit.indexOf('softwareupgrade') > -1 &&
        proposal_initial_deposit.indexOf('cancelsoftwareupgrade') < 0:
        status = t('governance.modal2.form.input.proposalType.choice4');
        break;
      case proposal_initial_deposit.indexOf('upgrade') > -1 &&
        proposal_initial_deposit.indexOf('softwareupgrade') < 0 &&
        proposal_initial_deposit.indexOf('cancelsoftwareupgrade') < 0:
        status = t('governance.modal2.form.input.proposalType.choice6');
        break;
      case proposal_initial_deposit.indexOf('clientupdate') > -1:
        status = t('governance.modal2.form.input.proposalType.choice7');
        break;
      default:
        status = '';
        break;
    }
    return status;
  };

  const showPasswordInput = () => {
    // TODO: check if decryptedPhrase expired
    if ((decryptedPhrase && false) || currentSession.wallet.walletType === LEDGER_WALLET_TYPE) {
      if (!isLedgerConnected && currentSession.wallet.walletType === LEDGER_WALLET_TYPE) {
        ledgerNotification(currentSession.wallet, userAsset!);
      }
      if (modalType === 'create_proposal') {
        setIsProposalModalVisible(true);
      }
      if (modalType === 'confirmation') {
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
    setInputPasswordVisible(false);

    if (modalType === 'confirmation') {
      showConfirmationModal();
    }

    if (modalType === 'create_proposal') {
      setIsProposalModalVisible(true);
    }
  };

  const processProposalFigures = async (_proposal: ProposalModel) => {
    let currentProposalTally = _proposal.final_tally_result;

    // Reset previous state figures
    setProposalFigures(initialFiguresStates);

    // Load latest tally result if proposal is in voting period
    if (_proposal.status === ProposalStatuses.PROPOSAL_STATUS_VOTING_PERIOD) {
      setIsLoadingTally(true);
      const latestTally = await walletService.loadLatestProposalTally(_proposal.proposal_id);
      if (!latestTally) {
        // When not connected or couldn't load tally - Let it show that it couldn't load by spinning
        return;
      }
      currentProposalTally = latestTally;
      setIsLoadingTally(false);
    }

    const yesValue = new Big(currentProposalTally.yes);
    const noValue = new Big(currentProposalTally.no);
    const noWithVetoValue = new Big(currentProposalTally.no_with_veto);
    const abstainValue = new Big(currentProposalTally.abstain);
    const totalVotes = yesValue
      .plus(noValue)
      .plus(noWithVetoValue)
      .plus(abstainValue);
    // in percentage
    const yesRate = totalVotes.gt('0')
      ? yesValue
          .div(totalVotes)
          .times(100)
          .toFixed(2)
      : `n.a.`;

    const noRate = totalVotes.gt('0')
      ? noValue
          .div(totalVotes)
          .times(100)
          .toFixed(2)
      : `n.a.`;

    const noWithVetoRate = totalVotes.gt('0')
      ? noWithVetoValue
          .div(totalVotes)
          .times(100)
          .toFixed(2)
      : `n.a.`;

    const abstainRate = totalVotes.gt('0')
      ? abstainValue
          .div(totalVotes)
          .times(100)
          .toFixed(2)
      : `n.a.`;

    const baseUnitDenominator = 1_0000_0000;
    setProposalFigures({
      yes: {
        vote: yesValue.div(baseUnitDenominator).toFixed(),
        rate: yesRate,
      },
      no: {
        vote: noValue.div(baseUnitDenominator).toFixed(),
        rate: noRate,
      },
      noWithVeto: {
        vote: noWithVetoValue.div(baseUnitDenominator).toFixed(),
        rate: noWithVetoRate,
      },
      abstain: {
        vote: abstainValue.div(baseUnitDenominator).toFixed(),
        rate: abstainRate,
      },
    });
  };

  const onConfirm = async () => {
    if (!proposal) {
      return;
    }

    setConfirmLoading(true);
    try {
      const proposalID =
        proposal?.proposal_id !== null && proposal?.proposal_id !== undefined
          ? proposal?.proposal_id
          : '';
      const sendResult = await walletService.sendVote({
        voteOption,
        proposalID,
        memo: DEFAULT_CLIENT_MEMO,
        decryptedPhrase,
        asset: userAsset,
        walletType: currentSession.wallet.walletType,
      });

      // Update latest tally result
      await processProposalFigures(proposal);

      setBroadcastResult(sendResult);
      setIsVisibleConfirmationModal(false);
      setConfirmLoading(false);
      setInputPasswordVisible(false);
      setIsSuccessModalVisible(true);
    } catch (e) {
      if (currentSession.wallet.walletType === LEDGER_WALLET_TYPE) {
        setLedgerIsExpertMode(detectConditionsError(((e as unknown) as any).toString()));
      }
      setErrorMessages(((e as unknown) as any).message.split(': '));
      setIsVisibleConfirmationModal(false);
      setConfirmLoading(false);
      // setInputPasswordVisible(false);
      setIsErrorModalVisible(true);
      // eslint-disable-next-line no-console
      console.error('Error occurred while transfer', e);
    }
    setConfirmLoading(false);
  };

  const processStatusTag = status => {
    let statusColor;
    const statusMessage =
      status !== null && status !== undefined
        ? status.replace('PROPOSAL_STATUS', '').replaceAll('_', ' ')
        : '';
    switch (status) {
      case ProposalStatuses.PROPOSAL_STATUS_UNSPECIFIED:
        statusColor = 'default';
        break;
      case ProposalStatuses.PROPOSAL_STATUS_DEPOSIT_PERIOD:
        statusColor = 'processing';
        break;
      case ProposalStatuses.PROPOSAL_STATUS_VOTING_PERIOD:
        statusColor = 'processing';
        break;
      case ProposalStatuses.PROPOSAL_STATUS_PASSED:
        statusColor = 'success';
        break;
      case ProposalStatuses.PROPOSAL_STATUS_REJECTED:
        statusColor = 'error';
        break;
      case ProposalStatuses.PROPOSAL_STATUS_FAILED:
        statusColor = 'error';
        break;
      default:
        statusColor = 'default';
    }
    return (
      <Tag style={{ border: 'none', padding: '5px 14px' }} color={statusColor}>
        {statusMessage}
      </Tag>
    );
  };

  const processVoteTag = vote => {
    let voteColor;
    let voteMessage;
    switch (vote) {
      case VoteOption.VOTE_OPTION_YES:
        voteColor = 'success';
        voteMessage = `Yes - ${t('governance.voteOption.yes')}`;
        break;
      case VoteOption.VOTE_OPTION_NO:
        voteColor = 'error';
        voteMessage = `No - ${t('governance.voteOption.no')}`;
        break;
      case VoteOption.VOTE_OPTION_NO_WITH_VETO:
        voteColor = 'error';
        voteMessage = `No with Veto - ${t('governance.voteOption.noWithVeto')}`;
        break;
      case VoteOption.VOTE_OPTION_ABSTAIN:
        voteColor = 'default';
        voteMessage = `Abstain - ${t('governance.voteOption.abstain')}`;
        break;
      default:
        voteColor = 'default';
    }
    return (
      <Tag style={{ border: 'none', padding: '5px 14px' }} color={voteColor}>
        {voteMessage}
      </Tag>
    );
  };

  const onCreateProposalAction = async () => {
    setInputPasswordVisible(false);
    const { walletType } = currentSession.wallet;
    const { baseDenom, croDenom } = currentSession.wallet.config.network.coin;

    if (!decryptedPhrase && walletType !== LEDGER_WALLET_TYPE) {
      return;
    }

    try {
      if (
        Big(form?.getFieldValue('initialDeposit')).cmp(Big(minDeposit)) !== -1 &&
        Big(form?.getFieldValue('initialDeposit')).cmp(Big(maxDeposit)) !== 1
      ) {
        setConfirmLoading(true);
        const proposalType = form.getFieldValue('proposalType');
        let textProposal: BroadCastResult | null = null;
        if (proposalType === 'text_proposal') {
          setInitialDeposit(
            form?.getFieldValue('initialDeposit') + croDenom.replace('base', ' ').toUpperCase(),
          );
          textProposal = await walletService.sendTextProposalSubmitTx({
            description: form?.getFieldValue('proposalDescription'),
            title: form?.getFieldValue('proposalTitle'),
            asset: userAsset,
            initialDeposit: [
              {
                amount: getBaseScaledAmount(form?.getFieldValue('initialDeposit'), userAsset),
                denom: baseDenom,
              },
            ],
            proposer: userAsset?.address!,
            decryptedPhrase,
            walletType,
          });
          setCreateProposalHash(textProposal?.transactionHash || '');
        }

        const currentWalletAsset = await walletService.retrieveDefaultWalletAsset(currentSession);
        setUserAsset(currentWalletAsset);
        setIsVisibleConfirmationModal(false);
        setInputPasswordVisible(false);
        setConfirmLoading(false);
        setProposalSuccessModalVisible(true);
        setIsProposalModalVisible(false);
        resetCreateProposalForm();
      } else {
        // eslint-disable-next-line no-console
        console.error(
          'Error occurred during proposal creation - Initial Deposit not within the valid range',
        );
        setErrorMessages([t('governance.modal2.form.submit.error')]);
        setProposalErrorModalVisible(true);
      }
    } catch (e) {
      if (walletType === LEDGER_WALLET_TYPE) {
        setLedgerIsExpertMode(detectConditionsError(((e as unknown) as any).toString()));
      }
      // eslint-disable-next-line no-console
      console.error('Error occurred during proposal creation ', e);
      setIsVisibleConfirmationModal(false);
      setErrorMessages(((e as unknown) as any).message.split(': '));
      setIsProposalModalVisible(false);
      setConfirmLoading(false);
      setInputPasswordVisible(false);
      setProposalErrorModalVisible(true);
    }
  };

  const rightSideItem = item => {
    let code;
    switch (item?.status) {
      case ProposalStatuses.PROPOSAL_STATUS_DEPOSIT_PERIOD:
        code = [
          <Progress
            className="deposit-progress-list"
            type="circle"
            width={70}
            percent={percentageCalc(item)}
            status="normal"
            strokeColor={{
              from: '#00A68C',
              to: '#00A68C',
            }}
          />,
        ];
        break;
      case ProposalStatuses.PROPOSAL_STATUS_VOTING_PERIOD:
        code = [<></>];
        break;

      default:
        code = [
          <IconText
            icon={LikeOutlined}
            text={getUIVoteAmount(item.final_tally_result.yes, userAsset)}
            key="list-vertical-yes-o"
          />,
          <IconText
            icon={DislikeOutlined}
            text={getUIVoteAmount(
              Big(item.final_tally_result.no)
                .add(item.final_tally_result.no_with_veto)
                .toFixed(),
              userAsset,
            )}
            key="list-vertical-no-o"
          />,
        ];
        break;
    }
    return code;
  };

  const percentageCalc = (proposal: any) => {
    const depositCalc = proposal?.total_deposit
      .reduce((partialSum, a) => partialSum.plus(Big(a.amount)), Big(0))
      .toString();
    const totalDeposit = Big(getUIDynamicAmount(depositCalc, userAsset)).toString();
    const finalPercentage = Big(totalDeposit)
      .div(Big(maxDeposit.replace(',', '')))
      .times(100)
      .toFixed(2);
    return Big(finalPercentage).toNumber();
  };

  const fetchProposalList = async () => {
    const list: ProposalModel[] = await walletService.retrieveProposals(
      currentSession.wallet.config.network.chainId,
    );

    const latestProposalOnTop = list.reverse();
    setProposalList(latestProposalOnTop);
    return latestProposalOnTop;
  };

  const refreshProposal = async () => {
    const latestProposalOnTop = await fetchProposalList();
    setTimeout(() => {
      const currentProposalId = proposal?.proposal_id;
      const currentProposal = latestProposalOnTop?.filter(item => {
        return item.proposal_id === currentProposalId;
      })[0];

      setProposal(currentProposal);
      processProposalFigures(currentProposal!);
    }, 300);
  };

  useEffect(() => {
    fetchProposalList();

    if (!didMountRef.current) {
      const usersBalance = getUIDynamicAmount(userAsset.balance, userAsset);
      const userDeposit = Big(usersBalance).cmp(Big(minDeposit)) === 1 ? minDeposit : usersBalance;
      didMountRef.current = true;
      analyticsService.logPage('Governance');
      form.setFieldsValue({ initialDeposit: userDeposit });
      form.validateFields(['initialDeposit']);
    }

    // eslint-disable-next-line
  }, [currentSession, form, userAsset, proposal, proposalList, setModalType, modalType]);

  return (
    <Layout className="site-layout">
      {historyVisible ? (
        <></>
      ) : (
        <>
          {isProposalVisible ? (
            <>
              <Header className="site-layout-background proposal-details-header">
                <div className="top">{t('governance.proposalDetails')}</div>
                {proposal?.content.title}
              </Header>

              <a className="proposal-back-btn">
                <div
                  className="back-button"
                  onClick={() => setIsProposalVisible(false)}
                  style={{ fontSize: '16px' }}
                >
                  <ArrowLeftOutlined style={{ fontSize: '16px', color: '#1199fa' }} />{' '}
                  <span>
                    <>{t('governance.backToList')}</>
                  </span>
                </div>
              </a>

              <div className="top-proposal-container">
                <div className="item">
                  <div className="status">{processStatusTag(proposal?.status)}</div>
                </div>
              </div>
            </>
          ) : (
            <>
              <Header className="site-layout-background">{t('governance.title')}</Header>
              <div id="governance-description" className="header-description">
                {t('governance.description')}
              </div>
              {currentSession.wallet.walletType !== LEDGER_WALLET_TYPE ? (
                <Button
                  id="create-proposal-btn"
                  type="primary"
                  onClick={() => {
                    form.validateFields(['initialDeposit']);
                    setModalType('create_proposal');
                    showPasswordInput();
                  }}
                >
                  {t('governance.modal2.title')}
                </Button>
              ) : (
                <></>
              )}
            </>
          )}
        </>
      )}
      <Content>
        <ErrorModalPopup
          isModalVisible={isProposalErrorModalVisible}
          handleCancel={closeProposalErrorModal}
          handleOk={closeProposalErrorModal}
          title={t('general.errorModalPopup.title')}
          footer={[]}
        >
          <>
            <div className="description">
              {t('governance.error-modal2.info')}
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
            {/* <ul className="proposal-guidelines">
              <li  className="proposal-guideline"></li>
            </ul> */}
          </>
        </ErrorModalPopup>

        {/* CREATE PROPOSAL's SUCCESS MODAL */}
        <SuccessModalPopup
          isModalVisible={isProposalSuccessModalVisible}
          handleCancel={handleCloseProposalSuccessModal}
          handleOk={handleCloseProposalSuccessModal}
          title={t('general.successModalPopup.title')}
          button={null}
          footer={[
            <Button
              className="create-proposal-success-btn"
              key="submit"
              type="primary"
              onClick={handleCloseProposalSuccessModal}
            >
              {t('general.ok')}
            </Button>,
          ]}
        >
          <div className="create-proposal-success-modal">
            <div className="info">{t('governance.success-modal2.info')}</div>
            <ul>
              <li>
                <div className="left">{t('governance.modal2.form.input.proposalDeposit')}</div>
                <div className="right">{initialDepositProposal}</div>
              </li>
              {/* <li>
              <div className="left">
                {t('governance.success-modal2.proposal-id')}
              </div>
              <div className="right">

              </div>
            </li> */}
              <li>
                <div className="left">{t('home.transactions.table1.transactionHash')}</div>
                <div className="right">
                  <a
                    data-original={createProposalHash}
                    target="_blank"
                    rel="noreferrer"
                    href={`${renderExplorerUrl(
                      currentSession?.activeAsset?.config ?? currentSession?.wallet?.config,
                      'tx',
                    )}/${createProposalHash}`}
                  >
                    {middleEllipsis(createProposalHash, 7)}
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </SuccessModalPopup>

        {/* CREATE PROPOSAL MODAL */}
        <ModalPopup
          isModalVisible={isProposalModalVisible}
          handleCancel={handleCancelProposalModal}
          handleOk={() => {}}
          closable={!confirmLoading}
          confirmationLoading={confirmLoading}
          footer={[
            <Button
              key="submit"
              type="primary"
              loading={confirmLoading}
              onClick={() => {
                form.submit();
              }}
              disabled={
                !isLedgerConnected && currentSession.wallet.walletType === LEDGER_WALLET_TYPE
              }
            >
              {t('governance.modal2.button.submit')}
            </Button>,
            <Button key="back" type="link" onClick={handleCancelProposalModal}>
              {t('general.cancel')}
            </Button>,
          ]}
          okText={t('general.confirm')}
        >
          <>
            <Header className="create-proposal-header"> {t('governance.modal2.title')} </Header>

            <div className="instructions">
              <div className="header-instructions">{t('governance.modal2.instructions.head')}</div>
              <ul>
                <li>{t('governance.modal2.instructions.part1')}</li>
                <li>
                  {t('governance.modal2.instructions.part2')}{' '}
                  <a
                    href="https://github.com/crypto-org-chain/chain-main/discussions"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('governance.modal2.instructions.part2.github')}
                  </a>{' '}
                  {t('governance.modal2.instructions.part2.or')}{' '}
                  <a
                    href="https://discord.com/invite/5JTk2ppsY3"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('governance.modal2.instructions.part2.discord')}
                  </a>
                </li>
              </ul>
            </div>

            <Form
              className="create-proposal-form"
              form={form}
              name="create-proposal-form"
              layout="vertical"
              requiredMark={false}
              initialValues={{
                initialDeposit:
                  Big(getUIDynamicAmount(userAsset.balance, userAsset)).cmp(Big(minDeposit)) === 1
                    ? minDeposit
                    : getUIDynamicAmount(userAsset.balance, userAsset),
                proposalType: 'text_proposal',
              }}
              onFinish={() => {
                onCreateProposalAction();
              }}
            >
              <Form.Item
                name="proposalType"
                label={t('governance.modal2.form.dropdown')}
                rules={[
                  {
                    required: true,
                    message: `${t('governance.modal2.form.dropdown')} ${t('general.required')}`,
                  },
                ]}
                style={{ textAlign: 'left' }}
              >
                <Select placeholder={t('governance.modal2.form.input.proposalType.placeholder')}>
                  <Option key="text_proposal" value="text_proposal">
                    {t('governance.modal2.form.input.proposalType.choice1')}
                  </Option>
                  {/* 
                  <Option key="community_pool_spend" value="community_pool_spend">
                    {t('governance.modal2.form.input.proposalType.choice2')}
                  </Option>
                  <Option key="parameter_change" value="parameter_change">
                    {t('governance.modal2.form.input.proposalType.choice3')}
                  </Option>
                   */}
                </Select>
              </Form.Item>
              <Form.Item
                name="proposalTitle"
                label={t('governance.modal2.form.input.proposalTitle')}
                hasFeedback
                rules={[
                  {
                    required: true,
                    message: `${t('governance.modal2.form.input.proposalTitle')} ${t(
                      'general.required',
                    )}`,
                  },
                ]}
              >
                <Input placeholder={t('governance.modal2.form.input.proposalTitle.placeholder')} />
              </Form.Item>
              <Form.Item
                name="proposalDescription"
                label={t('governance.modal2.form.input.proposalDesc')}
                hasFeedback
                rules={[
                  {
                    required: true,
                    message: `${t('governance.modal2.form.input.proposalDesc')} ${t(
                      'general.required',
                    )}`,
                  },
                ]}
              >
                <Input placeholder={t('governance.modal2.form.input.proposalDesc.placeholder')} />
              </Form.Item>
              <Form.Item
                name="initialDeposit"
                validateFirst
                label={t('governance.modal2.form.input.proposalDeposit')}
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
                  customMaxValidator,
                  customMaxValidator0,
                  customMinValidator,
                ]}
              >
                <InputNumber
                  placeholder={`${t('governance.modal2.form.input.proposalDeposit.placeholder')} ${
                    userAsset.symbol
                  } ${t('governance.modal2.form.input.proposalDeposit.placeholder2')}`}
                  addonAfter={userAsset.symbol}
                />
              </Form.Item>
              <div className="note">
                {t('governance.modal2.form.proposalDeposit.warning')} {minDeposit}{' '}
                {userAsset.symbol}
              </div>

              <div className="avail-bal-container">
                <div className="avail-bal-txt">{t('governance.modal2.form.balance')}</div>
                <div className="avail-bal-val">
                  {getUIDynamicAmount(userAsset.balance, userAsset)} {userAsset.symbol}
                </div>
              </div>

              <div className="note warning">
                <InfoCircleOutlined className="icon" />{' '}
                <span className="txt">{t('governance.modal2.form.warning')}</span>
              </div>
            </Form>
          </>
        </ModalPopup>

        {isProposalVisible ? (
          <ProposalView
            props={{
              setInputPasswordVisible,
              setIsVisibleConfirmationModal,
              proposal,
              decryptedPhrase,
              isLoadingTally,
              proposalFigures,
              showPasswordInput,
              voteOption,
              setVoteOption,
              isProposalVisible,
              setIsProposalVisible,
              historyVisible,
              modalType,
              setModalType,
              confirmLoading,
              setConfirmLoading,
              setLedgerIsExpertMode,
              setErrorMessages,
              setIsErrorModalVisible,
              refreshProposal,
              // setProposal
              proposalList,
              setProposalList,
            }}
          />
        ) : (
          <>
            {historyVisible ? (
              <VotingHistory
                setHistoryVisible={setHistoryVisible}
                proposalList={proposalList}
                setProposal={setProposal}
                setIsProposalVisible={setIsProposalVisible}
              />
            ) : (
              <Tabs defaultActiveKey="1" tabBarExtraContent={historyBtn}>
                <TabPane tab={t('governance.tab1')} key="1">
                  <div className="site-layout-background governance-content">
                    <div className="container">
                      <List
                        dataSource={proposalList}
                        renderItem={(item: ProposalModel) => (
                          <List.Item
                            key={item.proposal_id}
                            actions={rightSideItem(item)}
                            onClick={() => {
                              setProposal(item);
                              setIsProposalVisible(true);
                              processProposalFigures(item);
                            }}
                          >
                            <List.Item.Meta
                              title={
                                <>
                                  {processStatusTag(item.status)} #{item.proposal_id}{' '}
                                  <a>{item.content.title}</a>
                                </>
                              }
                              description={
                                <>
                                  <div className="proposal-type">{checkProposalType(item)}</div>
                                  {item.status ===
                                  ProposalStatuses.PROPOSAL_STATUS_DEPOSIT_PERIOD ? (
                                    <span className="time-container">
                                      <FieldTimeOutlined />{' '}
                                      <span className="time-area">
                                        <span className="time-label">
                                          {' '}
                                          {t('governance.start')}:{' '}
                                        </span>
                                        <span className="time">
                                          {moment(item.submit_time).format('DD/MM/YYYY')}
                                        </span>
                                      </span>{' '}
                                      {' - '}{' '}
                                      <span className="time-area">
                                        <span className="time-label">{t('governance.end')}: </span>
                                        <span className="time">
                                          {moment(item.deposit_end_time).format('DD/MM/YYYY')}
                                        </span>
                                      </span>
                                    </span>
                                  ) : (
                                    <span className="time-container">
                                      <FieldTimeOutlined />{' '}
                                      <span className="time-area">
                                        <span className="time-label">
                                          {' '}
                                          {t('governance.start')}:{' '}
                                        </span>
                                        <span className="time">
                                          {moment(item.voting_start_time).format('DD/MM/YYYY')}
                                        </span>
                                      </span>{' '}
                                      {' - '}{' '}
                                      <span className="time-area">
                                        <span className="time-label">{t('governance.end')}: </span>
                                        <span className="time">
                                          {moment(item.voting_end_time).format('DD/MM/YYYY')}
                                        </span>
                                      </span>
                                    </span>
                                  )}
                                </>
                              }
                            />
                          </List.Item>
                        )}
                        pagination={{
                          pageSize: 10,
                        }}
                      />
                    </div>
                  </div>
                </TabPane>
                <TabPane tab={t('governance.tab2')} key="2">
                  <div className="site-layout-background governance-content">
                    <div className="container">
                      <List
                        dataSource={proposalList?.filter(item => {
                          return item.status === ProposalStatuses.PROPOSAL_STATUS_VOTING_PERIOD;
                        })}
                        renderItem={item => (
                          <List.Item
                            key={item.proposal_id}
                            actions={
                              item.status === ProposalStatuses.PROPOSAL_STATUS_VOTING_PERIOD
                                ? []
                                : [
                                    <IconText
                                      icon={LikeOutlined}
                                      text={getUIVoteAmount(item.final_tally_result.yes, userAsset)}
                                      key="list-vertical-yes-o"
                                    />,
                                    <IconText
                                      icon={DislikeOutlined}
                                      text={getUIVoteAmount(
                                        Big(item.final_tally_result.no)
                                          .add(item.final_tally_result.no_with_veto)
                                          .toFixed(),
                                        userAsset,
                                      )}
                                      key="list-vertical-no-o"
                                    />,
                                  ]
                            }
                            onClick={() => {
                              setProposal(item);
                              setIsProposalVisible(true);
                              processProposalFigures(item);
                            }}
                          >
                            <List.Item.Meta
                              title={
                                <>
                                  {processStatusTag(item.status)} #{item.proposal_id}{' '}
                                  <a>{item.content.title}</a>
                                </>
                              }
                              description={
                                <>
                                  <div className="proposal-type">{checkProposalType(item)}</div>
                                  <span className="time-container">
                                    <FieldTimeOutlined />{' '}
                                    <span className="time-area">
                                      <span className="time-label"> {t('governance.start')}: </span>
                                      <span className="time">
                                        {moment(item.voting_start_time).format('DD/MM/YYYY')}
                                      </span>
                                    </span>{' '}
                                    {' - '}{' '}
                                    <span className="time-area">
                                      <span className="time-label">{t('governance.end')}: </span>
                                      <span className="time">
                                        {moment(item.voting_end_time).format('DD/MM/YYYY')}
                                      </span>
                                    </span>
                                  </span>
                                </>
                              }
                            />
                          </List.Item>
                        )}
                        pagination={{
                          pageSize: 10,
                        }}
                      />
                    </div>
                  </div>
                </TabPane>

                <TabPane tab={t('governance.tab3')} key="3">
                  <div className="site-layout-background governance-content">
                    <div className="container">
                      <List
                        dataSource={proposalList?.filter(item => {
                          return item.status === ProposalStatuses.PROPOSAL_STATUS_DEPOSIT_PERIOD;
                        })}
                        renderItem={item => (
                          <List.Item
                            key={item.proposal_id}
                            actions={rightSideItem(item)}
                            onClick={() => {
                              setProposal(item);
                              setIsProposalVisible(true);
                              processProposalFigures(item);
                            }}
                          >
                            <List.Item.Meta
                              title={
                                <>
                                  {processStatusTag(item.status)} #{item.proposal_id}{' '}
                                  <a>{item.content.title}</a>
                                </>
                              }
                              description={
                                <>
                                  <div className="proposal-type">{checkProposalType(item)}</div>
                                  <span className="time-container">
                                    <FieldTimeOutlined />{' '}
                                    <span className="time-area">
                                      <span className="time-label"> {t('governance.start')}: </span>
                                      <span className="time">
                                        {moment(item.submit_time).format('DD/MM/YYYY')}
                                      </span>
                                    </span>{' '}
                                    {' - '}{' '}
                                    <span className="time-area">
                                      <span className="time-label">{t('governance.end')}: </span>
                                      <span className="time">
                                        {moment(item.deposit_end_time).format('DD/MM/YYYY')}
                                      </span>
                                    </span>
                                  </span>
                                </>
                              }
                            />
                          </List.Item>
                        )}
                        pagination={{
                          pageSize: 10,
                        }}
                      />
                    </div>
                  </div>
                </TabPane>

                <TabPane tab={t('governance.tab4')} key="4">
                  <div className="site-layout-background governance-content">
                    <div className="container">
                      <List
                        dataSource={proposalList?.filter(item => {
                          return item.status === ProposalStatuses.PROPOSAL_STATUS_PASSED;
                        })}
                        renderItem={item => (
                          <List.Item
                            key={item.proposal_id}
                            actions={[]}
                            onClick={() => {
                              setProposal(item);
                              setIsProposalVisible(true);
                              processProposalFigures(item);
                            }}
                          >
                            <List.Item.Meta
                              title={
                                <>
                                  {processStatusTag(item.status)} #{item.proposal_id}{' '}
                                  <a>{item.content.title}</a>
                                </>
                              }
                              description={
                                <>
                                  <div className="proposal-type">{checkProposalType(item)}</div>

                                  <span className="time-container">
                                    <FieldTimeOutlined />{' '}
                                    <span className="time-area">
                                      <span className="time-label"> {t('governance.start')}: </span>
                                      <span className="time">
                                        {moment(item.voting_start_time).format('DD/MM/YYYY')}
                                      </span>
                                    </span>{' '}
                                    {' - '}{' '}
                                    <span className="time-area">
                                      <span className="time-label">{t('governance.end')}: </span>
                                      <span className="time">
                                        {moment(item.voting_end_time).format('DD/MM/YYYY')}
                                      </span>
                                    </span>
                                  </span>
                                </>
                              }
                            />
                          </List.Item>
                        )}
                        pagination={{
                          pageSize: 10,
                        }}
                      />
                    </div>
                  </div>
                </TabPane>
                <TabPane tab={t('governance.tab5')} key="5">
                  <div className="site-layout-background governance-content">
                    <div className="container">
                      <List
                        dataSource={proposalList?.filter(item => {
                          return item.status === ProposalStatuses.PROPOSAL_STATUS_FAILED;
                        })}
                        renderItem={item => (
                          <List.Item
                            key={item.proposal_id}
                            actions={[]}
                            onClick={() => {
                              setProposal(item);
                              setIsProposalVisible(true);
                              processProposalFigures(item);
                            }}
                          >
                            <List.Item.Meta
                              title={
                                <>
                                  {processStatusTag(item.status)} #{item.proposal_id}{' '}
                                  <a>{item.content.title}</a>
                                </>
                              }
                              description={
                                <>
                                  <div className="proposal-type">{checkProposalType(item)}</div>

                                  <span className="time-container">
                                    <FieldTimeOutlined />{' '}
                                    <span className="time-area">
                                      <span className="time-label"> {t('governance.start')}: </span>
                                      <span className="time">
                                        {moment(item.voting_start_time).format('DD/MM/YYYY')}
                                      </span>
                                    </span>{' '}
                                    {' - '}{' '}
                                    <span className="time-area">
                                      <span className="time-label">{t('governance.end')}: </span>
                                      <span className="time">
                                        {moment(item.voting_end_time).format('DD/MM/YYYY')}
                                      </span>
                                    </span>
                                  </span>
                                </>
                              }
                            />
                          </List.Item>
                        )}
                        pagination={{
                          pageSize: 10,
                        }}
                      />
                    </div>
                  </div>
                </TabPane>
                <TabPane tab={t('governance.tab6')} key="6">
                  <div className="site-layout-background governance-content">
                    <div className="container">
                      <List
                        dataSource={proposalList?.filter(item => {
                          return item.status === ProposalStatuses.PROPOSAL_STATUS_REJECTED;
                        })}
                        renderItem={item => (
                          <List.Item
                            key={item.proposal_id}
                            actions={[]}
                            onClick={() => {
                              setProposal(item);
                              setIsProposalVisible(true);
                              processProposalFigures(item);
                            }}
                          >
                            <List.Item.Meta
                              title={
                                <>
                                  {processStatusTag(item.status)} #{item.proposal_id}{' '}
                                  <a>{item.content.title}</a>
                                </>
                              }
                              description={
                                <>
                                  <div className="proposal-type">{checkProposalType(item)}</div>

                                  <span className="time-container">
                                    <FieldTimeOutlined />{' '}
                                    <span className="time-area">
                                      <span className="time-label"> {t('governance.start')}: </span>
                                      <span className="time">
                                        {moment(item.voting_start_time).format('DD/MM/YYYY')}
                                      </span>
                                    </span>{' '}
                                    {' - '}{' '}
                                    <span className="time-area">
                                      <span className="time-label">{t('governance.end')}: </span>
                                      <span className="time">
                                        {moment(item.voting_end_time).format('DD/MM/YYYY')}
                                      </span>
                                    </span>
                                  </span>
                                </>
                              }
                            />
                          </List.Item>
                        )}
                        pagination={{
                          pageSize: 10,
                        }}
                      />
                    </div>
                  </div>
                </TabPane>
              </Tabs>
            )}
          </>
        )}
      </Content>
      <Footer />

      <ModalPopup
        isModalVisible={isConfirmationModalVisible}
        handleCancel={handleCancelConfirmationModal}
        handleOk={() => {}}
        footer={[
          <Button
            key="submit"
            type="primary"
            loading={confirmLoading}
            disabled={!isLedgerConnected && currentSession.wallet.walletType === LEDGER_WALLET_TYPE}
            onClick={onConfirm}
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
          <div className="title">{t('governance.modal1.title')}</div>
          <div className="description">{t('governance.modal1.description')}</div>
          <div className="item">
            <div className="label">{t('governance.modal1.label1')}</div>
            <div className="address">{`${currentSession.wallet.address}`}</div>
          </div>
          <div className="item">
            <div className="label">{t('governance.modal1.label2')}</div>
            <div className="address">{`#${proposal?.proposal_id} ${proposal?.content.title}`}</div>
          </div>
          <div className="item">
            <div className="label">{t('governance.modal1.label3')}</div>
            <div>{processVoteTag(voteOption)}</div>
          </div>
        </>
      </ModalPopup>
      <SuccessModalPopup
        isModalVisible={isSuccessModalVisible}
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
            <div className="description">{t('general.successModalPopup.vote.description')}</div>
          )}
          {/* <div className="description">{broadcastResult.transactionHash ?? ''}</div> */}
        </>
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
            {ledgerIsExpertMode ? <div>{t('general.errorModalPopup.ledgerExportMode')}</div> : ''}
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
  );
};

export default GovernancePage;
