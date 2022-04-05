import React, { useState, useEffect, useRef } from 'react';
import moment from 'moment';
import './governance.less';
import 'antd/dist/antd.css';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Layout, Tabs, List, Space, Radio, Button, Card, Progress, Tag, Spin } from 'antd';
import Big from 'big.js';
import {
  DislikeOutlined,
  LikeOutlined,
  ArrowLeftOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useTranslation } from 'react-i18next';
import { ledgerIsExpertModeState, sessionState, walletAssetState } from '../../recoil/atom';

import { getUIVoteAmount } from '../../utils/NumberUtils';
import {
  ProposalModel,
  ProposalStatuses,
  VoteOption,
  BroadCastResult,
} from '../../models/Transaction';
import { walletService } from '../../service/WalletService';
import { secretStoreService } from '../../storage/SecretStoreService';
import ModalPopup from '../../components/ModalPopup/ModalPopup';
import SuccessModalPopup from '../../components/SuccessModalPopup/SuccessModalPopup';
import ErrorModalPopup from '../../components/ErrorModalPopup/ErrorModalPopup';
import PasswordFormModal from '../../components/PasswordForm/PasswordFormModal';
import { detectConditionsError, LEDGER_WALLET_TYPE } from '../../service/LedgerService';
import { DEFAULT_CLIENT_MEMO } from '../../config/StaticConfig';
import { AnalyticsService } from '../../service/analytics/AnalyticsService';
import { useLedgerStatus } from '../../hooks/useLedgerStatus';
import { ledgerNotification } from '../../components/LedgerNotification/LedgerNotification';

const { Header, Content, Footer, Sider } = Layout;
const { TabPane } = Tabs;

const IconText = ({ icon, text }) => (
  <Space>
    {React.createElement(icon)}
    {text}
  </Space>
);

const GovernancePage = () => {
  // const [form] = Form.useForm();
  const [voteOption, setVoteOption] = useState<VoteOption>(VoteOption.VOTE_OPTION_ABSTAIN);
  const [broadcastResult, setBroadcastResult] = useState<BroadCastResult>({});
  // const [isModalVisible, setIsModalVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [inputPasswordVisible, setInputPasswordVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [isProposalVisible, setIsProposalVisible] = useState(false);
  const [decryptedPhrase, setDecryptedPhrase] = useState('');
  const [errorMessages, setErrorMessages] = useState([]);
  const [proposal, setProposal] = useState<ProposalModel>();
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
  const [proposalList, setProposalList] = useState<ProposalModel[]>();
  const [isConfirmationModalVisible, setIsVisibleConfirmationModal] = useState(false);
  const currentSession = useRecoilValue(sessionState);
  const userAsset = useRecoilValue(walletAssetState);
  const didMountRef = useRef(false);
  const [isLoadingTally, setIsLoadingTally] = useState(false);

  const { isLedgerConnected } = useLedgerStatus({ asset: userAsset });

  const analyticsService = new AnalyticsService(currentSession);

  const [t] = useTranslation();

  const handleCancelConfirmationModal = () => {
    setIsVisibleConfirmationModal(false);
  };

  const closeSuccessModal = () => {
    setIsSuccessModalVisible(false);
    setIsVisibleConfirmationModal(false);
  };

  const closeErrorModal = () => {
    setIsErrorModalVisible(false);
  };

  const showConfirmationModal = () => {
    setInputPasswordVisible(false);
    setIsVisibleConfirmationModal(true);
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

  const onWalletDecryptFinish = async (password: string) => {
    const phraseDecrypted = await secretStoreService.decryptPhrase(
      password,
      currentSession.wallet.identifier,
    );
    setDecryptedPhrase(phraseDecrypted);
    showConfirmationModal();
  };

  const onRadioChange = e => {
    setVoteOption(e.target.value);
  };

  const onVote = async () => {
    showPasswordInput();
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
      console.log('Error occurred while transfer', e);
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

  useEffect(() => {
    const fetchProposalList = async () => {
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

    // eslint-disable-next-line
  }, [proposalList, setProposalList]);

  return (
    <Layout className="site-layout">
      <Header className="site-layout-background">{t('governance.title')}</Header>
      <div className="header-description">{t('governance.description')}</div>
      <Content>
        {isProposalVisible ? (
          <div className="site-layout-background governance-content">
            <div className="container">
              <Layout className="proposal-detail">
                <Content>
                  <a>
                    <div
                      className="back-button"
                      onClick={() => setIsProposalVisible(false)}
                      style={{ fontSize: '16px' }}
                    >
                      <ArrowLeftOutlined style={{ fontSize: '16px', color: '#1199fa' }} />{' '}
                      {t('governance.backToList')}
                    </div>
                  </a>
                  <div className="title">
                    {proposal?.content.title} #ID-{proposal?.proposal_id}
                  </div>
                  <div className="item">
                    <div className="status">{processStatusTag(proposal?.status)}</div>
                  </div>
                  <div className="item">
                    <div className="date">
                      {t('governance.start')}:{' '}
                      {moment(proposal?.voting_start_time).format('DD/MM/YYYY, h:mm A')} <br />
                      {t('governance.end')}:{' '}
                      {moment(proposal?.voting_end_time).format('DD/MM/YYYY, h:mm A')}
                    </div>
                  </div>

                  <div className="description">
                    {proposal?.content.description.split('\\n').map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                  <div className="item">
                    {proposal?.status === ProposalStatuses.PROPOSAL_STATUS_VOTING_PERIOD ? (
                      <Card
                        title={t('governance.castVote')}
                        style={{
                          maxWidth: '500px',
                        }}
                      >
                        <Radio.Group onChange={onRadioChange} value={voteOption}>
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
                        <Button type="primary" disabled={!voteOption} onClick={onVote}>
                          {t('governance.sendVote')}
                        </Button>
                        {/* </div> */}
                      </Card>
                    ) : (
                      ''
                    )}
                  </div>
                </Content>
                <Sider width="300px">
                  <Spin
                    spinning={isLoadingTally}
                    indicator={<LoadingOutlined />}
                    tip="Loading latest results"
                  >
                    <Card title={t('governance.result')} style={{ padding: '4px' }}>
                      <div className="vote-result-section">
                        Yes - {t('governance.voteOption.yes')}
                        <br />
                        {/* Vote: {proposalFigures.yes.vote} */}
                        <Progress
                          percent={parseFloat(proposalFigures.yes.rate)}
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
                          percent={parseFloat(proposalFigures.no.rate)}
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
                          percent={parseFloat(proposalFigures.noWithVeto.rate)}
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
                          percent={parseFloat(proposalFigures.abstain.rate)}
                          strokeColor={{
                            from: '#dbdddc',
                            to: '#b1b3b3',
                          }}
                          size="small"
                          status="normal"
                        />
                      </div>
                    </Card>
                  </Spin>
                </Sider>
              </Layout>
            </div>
          </div>
        ) : (
          <Tabs defaultActiveKey="1">
            <TabPane tab={t('governance.tab1')} key="1">
              <div className="site-layout-background governance-content">
                <div className="container">
                  <List
                    dataSource={proposalList}
                    renderItem={(item: ProposalModel) => (
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
                            <span>
                              {t('governance.start')}:{' '}
                              {moment(item.voting_start_time).format('DD/MM/YYYY')}{' '}
                              {t('governance.end')}:{' '}
                              {moment(item.voting_end_time).format('DD/MM/YYYY')}
                            </span>
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
                            <span>
                              {t('governance.start')}:{' '}
                              {moment(item.voting_start_time).format('DD/MM/YYYY')}{' '}
                              {t('governance.end')}:{' '}
                              {moment(item.voting_end_time).format('DD/MM/YYYY')}
                            </span>
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
                            <span>
                              {t('governance.start')}:{' '}
                              {moment(item.voting_start_time).format('DD/MM/YYYY')}{' '}
                              {t('governance.end')}:{' '}
                              {moment(item.voting_end_time).format('DD/MM/YYYY')}
                            </span>
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
                            <span>
                              {t('governance.start')}:{' '}
                              {moment(item.voting_start_time).format('DD/MM/YYYY')}{' '}
                              {t('governance.end')}:{' '}
                              {moment(item.voting_end_time).format('DD/MM/YYYY')}
                            </span>
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
                            <span>
                              {t('governance.start')}:{' '}
                              {moment(item.voting_start_time).format('DD/MM/YYYY')}{' '}
                              {t('governance.end')}:{' '}
                              {moment(item.voting_end_time).format('DD/MM/YYYY')}
                            </span>
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
      </Content>
      <Footer />
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
    </Layout>
  );
};

export default GovernancePage;
