import React, { useState, useEffect, useRef } from 'react';
import moment from 'moment';
import './governance.less';
import 'antd/dist/antd.css';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Layout, Tabs, List, Space, Radio, Button, Card, Progress, Tag } from 'antd';
import Big from 'big.js';
import { DislikeOutlined, LikeOutlined } from '@ant-design/icons';

import { useRecoilValue } from 'recoil';
import { sessionState, walletAssetState } from '../../recoil/atom';

import {
  ProposalModel,
  ProposalStatuses,
  VoteOptions,
  BroadCastResult,
} from '../../models/Transaction';
import { walletService } from '../../service/WalletService';
import { secretStoreService } from '../../storage/SecretStoreService';
import ModalPopup from '../../components/ModalPopup/ModalPopup';
import PasswordFormModal from '../../components/PasswordForm/PasswordFormModal';
import { LEDGER_WALLET_TYPE } from '../../service/LedgerService';

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
  const [voteOption, setVoteOption] = useState<VoteOptions>(VoteOptions.ABSTAIN);
  const [broadcastResult, setBroadcastResult] = useState<BroadCastResult>({});
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [inputPasswordVisible, setInputPasswordVisible] = useState(false);
  const [decryptedPhrase, setDecryptedPhrase] = useState('');
  const [proposal, setProposal] = useState<ProposalModel>();
  const [proposalFigures, setProposalFigures] = useState({
    yes: {
      vote: '',
      rate: '',
    },
    no: {
      vote: '',
      rate: '',
    },
  });
  const [proposalList, setProposalList] = useState<ProposalModel[]>();
  const [isConfirmationModalVisible, setIsVisibleConfirmationModal] = useState(false);
  const currentSession = useRecoilValue(sessionState);
  const userAsset = useRecoilValue(walletAssetState);
  const didMountRef = useRef(false);

  console.log(userAsset);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleCancelConfirmationModal = () => {
    setIsVisibleConfirmationModal(false);
  };

  const showConfirmationModal = () => {
    setInputPasswordVisible(false);
    setIsVisibleConfirmationModal(true);
    // const networkFee =
    //   currentSession.wallet.config.fee !== undefined &&
    //   currentSession.wallet.config.fee.networkFee !== undefined
    //     ? currentSession.wallet.config.fee.networkFee
    //     : FIXED_DEFAULT_FEE;

    // const stakeInputAmount = adjustedTransactionAmount(
    //   form.getFieldValue('amount'),
    //   walletAsset,
    //   networkFee,
    // );

    // setFormValues({
    //   ...form.getFieldsValue(),
    //   // Replace scientific notation to plain string values
    //   amount: fromScientificNotation(stakeInputAmount),
    // });
    // setIsVisibleConfirmationModal(true);
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

  const onRadioChange = e => {
    setVoteOption(e.target.value);
  };

  const onVote = async () => {
    showPasswordInput();

    // await walletService.sendVote({
    //   voteOption,
    //   proposalID: proposal.proposal_id,
    //   memo: '',
    //   decryptedPhrase: '',
    //   asset: userAsset,
    //   walletType: currentSession.wallet.walletType
    // })
  };

  const onConfirm = async () => {
    setConfirmLoading(true);
    try {
      const sendResult = await walletService.sendVote({
        voteOption,
        proposalID: '1',
        memo: '',
        decryptedPhrase: '',
        // decryptedPhrase: decryptedPhrase,
        asset: userAsset,
        walletType: currentSession.wallet.walletType,
      });
      setBroadcastResult(sendResult);
      console.log(broadcastResult);
    } catch (e) {
      // setErrorMessages(e.message.split(': '));
      // setIsVisibleConfirmationModal(false);
      // setConfirmLoading(false);
      // setInputPasswordVisible(false);
      // setIsErrorTransferModalVisible(true);
      // eslint-disable-next-line no-console
      console.log('Error occurred while transfer', e);
    }
    setConfirmLoading(false);
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
      yes: {
        vote: yesValue.div(10000000).toFixed(),
        // vote: yesValue.toString(),
        rate: yesRate,
      },
      no: {
        vote: noValue
          .plus(noWithVetoValue)
          .div(10000000)
          .toFixed(),
        // vote: noValue.plus(noWithVetoValue).toString(),
        rate: noRate,
      },
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
        {status}
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
                        <IconText icon={LikeOutlined} text="156" key="list-vertical-yes-o" />,
                        <IconText icon={DislikeOutlined} text="2" key="list-vertical-no-o" />,
                      ]}
                      onClick={() => {
                        showModal();
                        setProposal(item);
                        processProposalFigures(item);
                      }}
                    >
                      <List.Item.Meta
                        title={
                          <>
                            {processTag(item.status)} <a>{item.content.title}</a>
                          </>
                        }
                        description={
                          <span>
                            Start: {moment(item.voting_start_time).format('DD/MM/YYYY')} End:{' '}
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
          <TabPane tab="Voting" key="2">
            <div className="site-layout-background governance-content">
              <div className="container">
                <List
                  dataSource={proposalList?.filter(item => {
                    return item.status === ProposalStatuses.PROPOSAL_STATUS_VOTING_PERIOD;
                  })}
                  renderItem={item => (
                    <List.Item
                      key={item.proposal_id}
                      actions={[
                        <IconText icon={LikeOutlined} text="156" key="list-vertical-yes-o" />,
                        <IconText icon={DislikeOutlined} text="2" key="list-vertical-no-o" />,
                      ]}
                      onClick={() => {
                        showModal();
                        setProposal(item);
                        processProposalFigures(item);
                      }}
                    >
                      <List.Item.Meta
                        title={
                          <>
                            {processTag(item.status)} <a>{item.content.title}</a>
                          </>
                        }
                        description={
                          <span>
                            Start: {moment(item.voting_start_time).format('DD/MM/YYYY')} End:{' '}
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
          <TabPane tab="Passed" key="3">
            <div className="site-layout-background governance-content">
              <div className="container">
                <List
                  dataSource={proposalList?.filter(item => {
                    return item.status === ProposalStatuses.PROPOSAL_STATUS_PASSED;
                  })}
                  renderItem={item => (
                    <List.Item
                      key={item.proposal_id}
                      actions={[
                        <IconText icon={LikeOutlined} text="156" key="list-vertical-yes-o" />,
                        <IconText icon={DislikeOutlined} text="2" key="list-vertical-no-o" />,
                      ]}
                      onClick={() => {
                        showModal();
                        setProposal(item);
                        processProposalFigures(item);
                      }}
                    >
                      <List.Item.Meta
                        title={
                          <>
                            {processTag(item.status)} <a>{item.content.title}</a>
                          </>
                        }
                        description={
                          <span>
                            Start: {moment(item.voting_start_time).format('DD/MM/YYYY')} End:{' '}
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
          <TabPane tab="Failed" key="4">
            <div className="site-layout-background governance-content">
              <div className="container">
                <List
                  dataSource={proposalList?.filter(item => {
                    return item.status === ProposalStatuses.PROPOSAL_STATUS_FAILED;
                  })}
                  renderItem={item => (
                    <List.Item
                      key={item.proposal_id}
                      actions={[
                        <IconText icon={LikeOutlined} text="156" key="list-vertical-yes-o" />,
                        <IconText icon={DislikeOutlined} text="2" key="list-vertical-no-o" />,
                      ]}
                      onClick={() => {
                        showModal();
                        setProposal(item);
                        processProposalFigures(item);
                      }}
                    >
                      <List.Item.Meta
                        title={
                          <>
                            {processTag(item.status)} <a>{item.content.title}</a>
                          </>
                        }
                        description={
                          <span>
                            Start: {moment(item.voting_start_time).format('DD/MM/YYYY')} End:{' '}
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
        <Layout>
          <Content>
            <div className="title">{proposal?.content.title}</div>
            <div className="item">
              <div className="status">{processTag(proposal?.status)}</div>
            </div>
            <div className="item">
              <div className="date">
                Start: {moment(proposal?.voting_start_time).format('DD/MM/YYYY, h:mm A')} <br />
                End: {moment(proposal?.voting_end_time).format('DD/MM/YYYY, h:mm A')}
              </div>
            </div>

            <div className="description">{proposal?.content.description}</div>
            <div className="item">
              {/* <div className="label">Delete Wallet Address</div> */}
              {proposal?.status === ProposalStatuses.PROPOSAL_STATUS_VOTING_PERIOD ? (
                <Card title="Cast your vote">
                  <Radio.Group onChange={onRadioChange} value={voteOption} buttonStyle="solid">
                    <Radio.Button value={VoteOptions.YES}>Yes - Support</Radio.Button>
                    <Radio.Button value={VoteOptions.NO}>No - Do not Support</Radio.Button>
                    <Radio.Button value={VoteOptions.NO_WITH_VETO}>
                      No with Veto - Do not Support with Veto
                    </Radio.Button>
                    <Radio.Button value={VoteOptions.ABSTAIN}>Abstain</Radio.Button>
                  </Radio.Group>
                  {/* <div className="item"> */}
                  <Button type="primary" disabled={!voteOption} onClick={onVote}>
                    Vote
                  </Button>
                  {/* </div> */}
                </Card>
              ) : (
                ''
              )}
            </div>
          </Content>
          <Sider>
            <Card title="Current results">
              <div>
                Yes - Support
                <br />
                {/* Vote: {proposalFigures.yes.vote} */}
                <Progress
                  percent={parseFloat(proposalFigures.yes.rate)}
                  size="small"
                  status="normal"
                />
              </div>
              <div>
                No - Do not support
                <br />
                {/* Vote:  {proposalFigures.no.vote} */}
                <Progress
                  percent={parseFloat(proposalFigures.no.rate)}
                  strokeColor={{
                    from: '#f27474',
                    to: '#f27474',
                  }}
                  size="small"
                  status="normal"
                />
              </div>
            </Card>
          </Sider>
        </Layout>
      </ModalPopup>
      <PasswordFormModal
        description="Input the app password decrypt wallet"
        okButtonText="Decrypt wallet"
        onCancel={() => {
          setInputPasswordVisible(false);
        }}
        onSuccess={onWalletDecryptFinish}
        onValidatePassword={async (password: string) => {
          const isValid = await secretStoreService.checkIfPasswordIsValid(password);
          return {
            valid: isValid,
            errMsg: !isValid ? 'The password provided is incorrect, Please try again' : '',
          };
        }}
        successText="Wallet decrypted successfully !"
        title="Provide app password"
        visible={inputPasswordVisible}
        successButtonText="Continue"
        confirmPassword={false}
      />
      <ModalPopup
        isModalVisible={isConfirmationModalVisible}
        handleCancel={handleCancelConfirmationModal}
        handleOk={handleOk}
        // confirmationLoading={confirmLoading}
        // button={
        //   <Button type="primary" htmlType="submit">
        //     Review
        //   </Button>
        // }
        footer={[
          <Button key="submit" type="primary" loading={confirmLoading} onClick={onConfirm}>
            Confirm
          </Button>,
          <Button key="back" type="link" onClick={handleCancelConfirmationModal}>
            Cancel
          </Button>,
        ]}
        okText="Confirm"
      >
        <>
          <div className="title">Confirm Vote Transaction</div>
          <div className="description">Please review the below information. </div>
          <div className="item">
            <div className="label">Sender Address</div>
            <div className="address">{`${currentSession.wallet.address}`}</div>
          </div>
          <div className="item">
            <div className="label">Vote to Proposal</div>
            <div className="address">{`[Proposal ID: ${proposal?.proposal_id}] ${proposal?.content.title}`}</div>
          </div>
          <div className="item">
            <div className="label">Vote</div>
            <div>{`${voteOption}`}</div>
          </div>
          {/* {formValues?.memo !== undefined &&
            formValues?.memo !== null &&
            formValues.memo !== '' ? (
              <div className="item">
                <div className="label">Memo</div>
                <div>{`${formValues?.memo}`}</div>
              </div>
            ) : (
              <div />
            )} */}
        </>
      </ModalPopup>
    </Layout>
  );
};

export default GovernancePage;
