import React, { useEffect, useState, useRef } from 'react';

import { Layout, Button, Table } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

import moment from 'moment';

import { walletService } from '../../../service/WalletService';
import { ProposalModel } from '../../../models/Transaction';
// import { useTranslation } from 'react-i18next';

import '../governance.less';
import 'antd/dist/antd.css';

const {
  Header,
  // Content,
  // Footer
} = Layout;

// interface DataType {
//   index: string;
//   proposal: string;
//   vote: string;
//   vote_date: string;
// }

export const VotingHistory = (props: {
  setHistoryVisible: React.Dispatch<React.SetStateAction<any>>;
  proposalList: ProposalModel[];
}) => {
  // const [t] = useTranslation();

  // const currentSession = useRecoilValue(sessionState);
  const didMountRef = useRef(false);
  const [votingHistoryData, SetVotingHistory] = useState([]);

  const [tableData, SetTableData] = useState([]);

  const columnsData = [
    {
      title: '#',
      dataIndex: 'index',
      key: 'index',
      render: txt => '#'.concat(txt),
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
      render: txt => checkVoteStatus(txt),
    },
    {
      title: 'Voted On',
      dataIndex: 'vote_date',
      key: 'vote_date',
      sorter: (a, b) =>
        parseInt(moment(a.vote_date).format('YYYYMMDD'), 10) -
        parseInt(moment(b.vote_date).format('YYYYMMDD'), 10),
    },
  ];

  const checkVoteStatus = vote => {
    let status = '';
    switch (vote) {
      case 'VOTE_OPTION_YES':
        status = 'Yes';
        break;
      case 'VOTE_OPTION_NO':
        status = 'No';
        break;
      case 'VOTE_OPTION_NO_WITH_VETO':
        status = 'No';
        break;
      case 'VOTE_OPTION_ABSTAIN':
        status = 'No';
        break;
      default:
        status = ' ';
        break;
    }
    return status;
  };

  const fetchVotingHistory = async () => {
    const votingHistory = await walletService
      .fetchAccountVotingHistory('tcro1ydyw9gzstgk9atua4w3zrkplq67t85hnfhw8ku')
      .then(abc => {
        console.log('abc0 ', abc);
        return abc;
      });

    SetVotingHistory(votingHistory);

    const curData = votingHistory?.map((elem: any, idx) => {
      const proposal_id = elem?.data?.proposalId;
      const option = elem?.data?.option;
      const contentTitle = props?.proposalList?.find(val => val.proposal_id === proposal_id)
        ?.content.title;
      console.log('contentTitle ', contentTitle);
      return {
        index: idx + 1,
        proposal: contentTitle,
        vote: option,
        vote_date: moment(elem.blockTime).format('DD/MM/YYYY - HH:mm:ss'),
      };
    });
    // eslint-disable-next-line
    console.log('curData ', curData);

    SetTableData(curData);
  };

  useEffect(() => {
    if (!didMountRef.current) {
      fetchVotingHistory();
      didMountRef.current = true;
    }
  }, [votingHistoryData, SetVotingHistory]);

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
