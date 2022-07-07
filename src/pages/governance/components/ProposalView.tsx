import React, { useState, useEffect, useRef } from 'react';
import moment from 'moment';
import Big from 'big.js';
import '../governance.less';
import 'antd/dist/antd.css';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Layout, Radio, Button, Card, Progress, Tag, Spin } from 'antd';
import { ArrowLeftOutlined, LoadingOutlined } from '@ant-design/icons';
import { useRecoilValue, useRecoilState } from 'recoil';
import { useTranslation } from 'react-i18next';

import { 
  sessionState, 
  walletAssetState 
} from '../../../recoil/atom';

import { ProposalModel, ProposalStatuses, VoteOption } from '../../../models/Transaction';
import { walletService } from '../../../service/WalletService';
import { AnalyticsService } from '../../../service/analytics/AnalyticsService';
import { getUIDynamicAmount } from '../../../utils/NumberUtils';


const { Content, Sider } = Layout;

export const ProposalView = (props: any) => {
  // const [form] = Form.useForm();

  const allProps = props?.props;
  const finalAmount = '10,000';
  const [proposalList, setProposalList] = useState<ProposalModel[]>();
  const [proposalStatus, setProposposalStatus] = useState(allProps?.proposal?.status);
  const currentSession = useRecoilValue(sessionState);
  const [userAsset, setUserAsset] = useRecoilState(walletAssetState);

  const [totalDepositValue, setTotalDeposit] = useState('0');
  const [totalDepositPercentageValue, setTotalDepositPercentageValue] = useState('0');

  const didMountRef = useRef(false);

  const analyticsService = new AnalyticsService(currentSession);

  const [t] = useTranslation();

  const onRadioChange = e => {
    allProps.setVoteOption(e.target.value);
  };

  const onVote = async () => {
    allProps.setModalType('confirmation');
    allProps.showPasswordInput();
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

  function numWithCommas(x:StringConstructor) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  const totalDeposit = () => {
    const depositCalc = (allProps?.proposal?.total_deposit.reduce((partialSum, a) => partialSum.plus(Big(a.amount)), Big(0))).toString();
    const totalDeposit = Big(getUIDynamicAmount(depositCalc, userAsset)).toString();
    setTotalDeposit(totalDeposit);
  };


  const totalDepositPercentage = () => {
    const finalPercentage = (Big(totalDepositValue).div(Big((finalAmount.replace(',',''))))).times(100).toString()
    setTotalDepositPercentageValue(finalPercentage);
  };

  const remainingDays = () => {
    const submitTime = moment(allProps?.proposal?.submit_time);
    const endDepositTime = moment(allProps?.proposal?.deposit_end_time);
    const duration = moment.duration(endDepositTime.diff(submitTime));
    const days = duration.asDays();
    return days.toString();
  };


  const submitProposalDeposit = () => {
    

    // try{
    //   const proposalDeposit = await walletService.sendProposalDepositTx({

    //   });
    // }catch(e){

    // }

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

    setUserAsset(userAsset);

    setProposposalStatus(allProps?.proposal?.status);
    totalDeposit();
    totalDepositPercentage();

    console.log('remainingDays ',remainingDays(), userAsset);

    // eslint-disable-next-line
  }, [proposalList, setProposalList]);

  return (
    <div className="site-layout-background governance-content">
      <div className="container">
        <Layout className="proposal-detail">
          <Content>
            <a>
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
            </a>
            <div className="title">
              {allProps.proposal?.content.title} #ID-{allProps.proposal?.proposal_id}
            </div>
            <div className="item">
              <div className="status">{processStatusTag(allProps.proposal?.status)}</div>
            </div>
            <div className="item">
            {(proposalStatus  === "PROPOSAL_STATUS_DEPOSIT_PERIOD") ? (
              <div className="date">
                <div className="date-container">
                <div className="date-area date-start">
                  <div className="txt">
                  {t('governance.start')}:{' '}
                  </div>
                  <div className="date">
                  {moment(allProps.proposal?.submit_time).format('DD/MM/YYYY, h:mm A')}
                  </div>
                
                 <br />
                </div>
                <div className="date-area date-end">
                <div className="txt">
                  {t('governance.end')}:{' '}
                  </div>
                  <div className="date">
                  {moment(allProps.proposal?.deposit_end_time).format('DD/MM/YYYY, h:mm A')}
                  </div>
                
                </div>
                </div>
              </div>
            ) : (
                <div className="date">
                  {t('governance.start')}:{' '}
                  {moment(allProps.proposal?.voting_start_time).format('DD/MM/YYYY, h:mm A')} <br />
                  {t('governance.end')}:{' '}
                  {moment(allProps.proposal?.voting_end_time).format('DD/MM/YYYY, h:mm A')}
                </div>
            )}
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




          <Sider width={(proposalStatus  === "PROPOSAL_STATUS_DEPOSIT_PERIOD") ? "400px" : "300px"  }>
            <Spin
              spinning={allProps.isLoadingTally}
              indicator={<LoadingOutlined />}
              tip="Loading latest results"
            >

              {(proposalStatus  === "PROPOSAL_STATUS_DEPOSIT_PERIOD") ? (<>
                <Card title={numWithCommas(totalDepositValue).concat(' ').concat(userAsset?.symbol).concat(' ').concat(t('governance.proposalView.deposited.header')).concat(' ').concat(userAsset?.symbol)}>
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
                        {totalDepositPercentageValue}%{' '}{t('governance.proposalView.deposited.cro')}{' '}{finalAmount}{' '}{userAsset?.symbol} 
                      </span>
                      <span className="right">
                        {(remainingDays())}{' '}{t('governance.proposalView.deposited.days')}
                      </span>
                    </div>



                    <Button type="primary" disabled={!allProps.voteOption} onClick={submitProposalDeposit}>
                      {t('governance.tab3')}
                    </Button>

                </Card>
              
              </>) : (

            
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




        </Layout>
      </div>
    </div>
  );
};
