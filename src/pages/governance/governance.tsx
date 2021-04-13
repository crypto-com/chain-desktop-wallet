import React, { useState, useEffect, useRef } from 'react';
import moment from 'moment';
import './governance.less';
import 'antd/dist/antd.css';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Layout, Tabs, List, Space, Radio, Button, Card, Progress, Tag } from 'antd';
import Big from 'big.js';
import { DislikeOutlined, LikeOutlined, StarOutlined } from '@ant-design/icons';

import { useRecoilValue } from 'recoil';
import { sessionState } from '../../recoil/atom';

import { ProposalModel, ProposalStatuses } from '../../models/Transaction';
import { walletService } from '../../service/WalletService';
import ModalPopup from '../../components/ModalPopup/ModalPopup';

const { Header, Content, Footer } = Layout;
const { TabPane } = Tabs;

const IconText = ({ icon, text }) => (
  <Space>
    {React.createElement(icon)}
    {text}
  </Space>
);

const GovernancePage = () => {
  const [voteOption, setVoteOption] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [proposal, setProposal] = useState<ProposalModel>();
  const [proposalFigures, setProposalFigures] = useState({
    yes: '',
    no: '',
  });
  const [proposalList, setProposalList] = useState<ProposalModel[]>();
  const currentSession = useRecoilValue(sessionState);
  const didMountRef = useRef(false);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const onRadioChange = e => {
    setVoteOption(e.target.value);
  };

  const processProposalFigures = _proposal => {
    const yesValue = new Big(_proposal.final_tally_result.yes);
    const noValue = new Big(_proposal.final_tally_result.no);
    const noWithVetoValue = new Big(_proposal.final_tally_result.no_with_veto);
    const abstain = new Big(_proposal.final_tally_result.abstain);
    const totalVotes = yesValue
      .plus(noValue)
      .plus(noWithVetoValue)
      .plus(abstain);
    // in percentage
    const yesRate = totalVotes.gt('0')
      ? yesValue
          .div(totalVotes)
          .times(100)
          .toPrecision(2)
      : `n.a.`;
    const noRate = totalVotes.gt('0')
      ? noValue
          .plus(noWithVetoValue)
          .div(totalVotes)
          .times(100)
          .toPrecision(2)
      : `n.a.`;
    setProposalFigures({
      yes: yesRate,
      no: noRate,
    });
  };

  const processTag = status => {
    let statusColor;
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
    // if (status === ProposalStatuses.PROPOSAL_STATUS_UNSPECIFIED) {
    //   statusColor = 'success';
    // } else if (status === ProposalStatuses.PROPOSAL_STATUS_UNSPECIFIED) {
    //   statusColor = 'error';
    // } else {
    //   statusColor = 'processing';
    // }

    return (
      <Tag style={{ border: 'none', padding: '5px 14px' }} color={statusColor}>
        {status.toString()}
      </Tag>
    );
  };

  useEffect(() => {
    const fetchProposalList = async () => {
      const list = await walletService.retrieveProposals(
        currentSession.wallet.config.network.chainId,
      );
      setProposalList(list);
    };

    if (!didMountRef.current) {
      fetchProposalList();
      didMountRef.current = true;
    }
    // eslint-disable-next-line
  }, [proposalList, setProposalList]);

  return (
    <Layout className="site-layout">
      <Header className="site-layout-background">Governance</Header>
      <div className="header-description">You may see all proposals and cast your votes here.</div>
      <Content>
        <Tabs defaultActiveKey="1">
          <TabPane tab="All" key="1">
            <div className="site-layout-background governance-content">
              <div className="container">
                <List
                  dataSource={proposalList}
                  renderItem={item => (
                    <List.Item
                      key={item.proposal_id}
                      actions={[
                        <IconText icon={StarOutlined} text="156" key="list-vertical-star-o" />,
                        <IconText icon={LikeOutlined} text="156" key="list-vertical-yes-o" />,
                        <IconText icon={DislikeOutlined} text="2" key="list-vertical-no-o" />,
                      ]}
                      onClick={() => {
                        console.log(item);
                        showModal();
                        setProposal(item);
                        processProposalFigures(item);
                      }}
                    >
                      <List.Item.Meta
                        title={
                          <>
                            {processTag(item.status)} - <a>{item.content.title}</a>
                          </>
                        }
                        description={
                          <span>
                            Start {moment(item.voting_start_time).format('DD/MM/YYYY')} End{' '}
                            {moment(item.voting_end_time).format('DD/MM/YYYY')}
                          </span>
                        }
                      />
                      {/* <div>{item.status}</div> */}
                    </List.Item>
                  )}
                  pagination={{
                    onChange: page => {
                      console.log(page);
                    },
                    pageSize: 10,
                  }}
                >
                  {/* {this.state.loading && this.state.hasMore && (
                    <div className="demo-loading-container">
                      <Spin />
                    </div>
                  )} */}
                </List>
              </div>
            </div>
          </TabPane>
          <TabPane tab="Active" key="2">
            <div className="site-layout-background governance-content">
              <div className="container">hi</div>
            </div>
          </TabPane>
        </Tabs>
      </Content>
      <Footer />
      <ModalPopup
        isModalVisible={isModalVisible}
        handleCancel={handleCancel}
        handleOk={handleOk}
        okText="Confirm"
        footer={[]}
        className="proposal-modal"
      >
        <>
          <div className="title">{proposal?.content.title}</div>
          <div className="status">{processTag(proposal?.status)}</div>
          <div className="date">
            Start {moment(proposal?.voting_start_time).format('DD/MM/YYYY, h:mm A')}
            End {moment(proposal?.voting_end_time).format('DD/MM/YYYY, h:mm A')}
          </div>
          <div className="result">
            <Card title="Current results">
              <div>
                Yes - Support
                <Progress percent={parseFloat(proposalFigures.yes)} size="small" status="normal" />
              </div>
              <div>
                No - Do not support
                <Progress
                  percent={parseFloat(proposalFigures.no)}
                  strokeColor={{
                    from: '#f27474',
                    to: '#f27474',
                  }}
                  size="small"
                  status="normal"
                />
              </div>
              {/* <div>
                No with Veto
                {proposal?.final_tally_result.no_with_veto}
              </div> */}
              {/* <div>
                Abstain
                {proposal?.final_tally_result.abstain}
              </div> */}
            </Card>
          </div>
          <div className="description">{proposal?.content.description}</div>
          <div className="item">
            {/* <div className="label">Delete Wallet Address</div> */}
            <Card title="Cast your vote">
              <Radio.Group onChange={onRadioChange} value={voteOption} buttonStyle="solid">
                <Radio.Button value="yes">Yes - Support</Radio.Button>
                <Radio.Button value="no">No - Do not Support</Radio.Button>
                <Radio.Button value="no_with_veto">Option C</Radio.Button>
              </Radio.Group>
              <div className="item">
                <Button type="primary">Vote</Button>
              </div>
            </Card>
          </div>
        </>
      </ModalPopup>
    </Layout>
  );
};

export default GovernancePage;
