import React, { useEffect, useState } from 'react';

import { Layout, Button, Table } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

import { useRecoilValue } from 'recoil';

import { ProposalModel } from '../../../models/Transaction';
import { walletService } from '../../../service/WalletService';
import { sessionState } from '../../../recoil/atom';

// import { useTranslation } from 'react-i18next';

import '../governance.less';
import 'antd/dist/antd.css';

const {
  Header,
  // Content,
  // Footer
} = Layout;

interface DataType {
  index: string;
  proposal: string;
  vote: string;
  vote_date: string;
}

export const VotingHistory = (props: {
  setHistoryVisible: React.Dispatch<React.SetStateAction<any>>;
}) => {
  // const [t] = useTranslation();

  const currentSession = useRecoilValue(sessionState);

  const [proposalList, setProposalList] = useState<ProposalModel[]>();
  // const [votingHistoryData, SetVotingHistory] = useState([]);

  const tableData: DataType[] = [
    {
      index: '1',
      proposal: 'Decrease the minimum deposit amount for governance proposals',
      vote: 'Yes',
      vote_date: '12/07/2020 01:12:48',
    },
    {
      index: '2',
      proposal: 'Draco II - Phase 2 - Crypto.org Chain with native token issuance',
      vote: 'No',
      vote_date: '03/05/2021 16:32:08',
    },
    {
      index: '3',
      proposal: 'Draco II - Phase 2 - Crypto.org Chain with native token issuance',
      vote: 'No',
      vote_date: '03/05/2021 16:32:08',
    },
  ];

  const columnsData = [
    {
      title: '#',
      dataIndex: 'index',
      key: 'index',
    },
    {
      title: 'Proposal',
      dataIndex: 'proposal',
      key: 'proposal',
    },
    {
      title: 'Your Vote',
      dataIndex: 'vote',
      key: 'vote',
      filters: [
        { text: 'Yes', value: 'yes' },
        { text: 'No', value: 'no' },
      ],
      sorter: (a, b) => a.vote.localeCompare(b.vote),
      onFilter: (value: string, record) => record.vote.toLowerCase().indexOf(value) > -1,
    },
    {
      title: 'Voted On',
      dataIndex: 'vote_date',
      key: 'vote_date',
    },
  ];

  // const []

  useEffect(() => {
    const fetchProposalList = async () => {
      const list: ProposalModel[] = await walletService.retrieveProposals(
        currentSession.wallet.config.network.chainId,
      );

      // eslint-disable-next-line
      console.log('fetchProposalList ', list);

      setProposalList(list);
      return list;
    };

    const fetchVotingHistory = async () => {
      const votingHistory = await walletService.fetchAccountVotingHistory(
        currentSession.wallet.address,
      );
      // eslint-disable-next-line
      console.log('votingHistory ', votingHistory, currentSession.wallet);
    };

    // proposalList?.map((elem, idx) => {

    // });

    // eslint-disable-next-line
    console.log('fetchProposalList 00 ', fetchVotingHistory(), fetchProposalList());
  }, [proposalList, setProposalList]);

  return (
    <div id="voting-history-section">
      <Button
        id="votingHistoryBtn"
        type="link"
        size="large"
        onClick={() => props.setHistoryVisible(false)}
      >
        <ArrowLeftOutlined style={{ fontSize: '17px', color: '#1199fa', marginRight: '6px' }} />{' '}
        Back
      </Button>
      <Header className="site-layout-background">Voting History</Header>
      <div className="header-description">Below is your voting history</div>

      <Table
        className="voting-history-table"
        dataSource={tableData}
        columns={columnsData}
        rowKey={record => record.index}
        pagination={false}
      />
    </div>
  );
};
