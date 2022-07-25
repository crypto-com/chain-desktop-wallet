import React, { useEffect, useState, useRef } from 'react';
import { useRecoilValue } from 'recoil';
import { Layout, Button, Table, Tag, Spin } from 'antd';
import { ArrowLeftOutlined, LoadingOutlined } from '@ant-design/icons';
import moment from 'moment';
import { useTranslation } from 'react-i18next';

import { walletService } from '../../../service/WalletService';
import { sessionState } from '../../../recoil/atom';

import '../governance.less';
import 'antd/dist/antd.css';

const { Header } = Layout;

enum sortOrder {
  asc = 'ascend',
  desc = 'descend',
}

export const VotingHistory = (props: any) => {
  const [t] = useTranslation();
  const currentSession = useRecoilValue(sessionState);
  const didMountRef = useRef(false);
  const [tableData, SetTableData] = useState([]);
  const [loadingTableData, SetLoadingTableData] = useState(true);

  const columns: any = [
    {
      title: ' ',
      dataIndex: 'index',
      key: 'index',
      render: txt => '#'.concat(txt),
    },
    {
      title: t('governance.voteHistory.table.column1'), // Proposal
      dataIndex: 'proposal',
      key: 'proposal',
      render: elem => (
        <>
          <Button
            type="link"
            onClick={() => {
              props.setProposal(elem);
              props.setIsProposalVisible(true);
            }}
          >
            <span className="proposalNo">#{elem.proposal_id}</span>{' '}
            <span className="proposalTitle">{elem.content.title}</span>
          </Button>
        </>
      ),
    },
    {
      title: t('governance.voteHistory.table.column2'), // Your Vote
      dataIndex: 'vote',
      key: 'vote',
      filters: [
        { text: 'Yes', value: 'yes' },
        { text: 'No', value: 'no' },
        { text: 'Abstained', value: 'abstain' },
      ],
      sorter: (a, b) => a.vote.localeCompare(b.vote),
      onFilter: (value: string, record) =>
        record.vote
          .toLowerCase()
          .split('_')
          .indexOf(value) > -1,
      render: txt => checkVoteStatus(txt),
    },
    {
      title: t('governance.voteHistory.table.column3'), // Voted On
      dataIndex: 'vote_date',
      key: 'vote_date',
      sorter: (a, b) =>
        parseInt(moment(a.vote_date).format('YYYYMMDD'), 10) -
        parseInt(moment(b.vote_date).format('YYYYMMDD'), 10),
      defaultSortOrder: sortOrder.desc,
    },
  ];

  const checkVoteStatus = vote => {
    let status;
    let statusColor;
    switch (vote) {
      case 'VOTE_OPTION_YES':
        status = 'Yes';
        statusColor = 'success';
        break;
      case 'VOTE_OPTION_NO':
        status = 'No';
        statusColor = 'error';
        break;
      case 'VOTE_OPTION_NO_WITH_VETO':
        status = 'No';
        statusColor = 'error';
        break;
      case 'VOTE_OPTION_ABSTAIN':
        status = '--';
        statusColor = 'default';
        break;
      default:
        status = '--';
        statusColor = 'default';
        break;
    }
    return (
      <Tag style={{ border: 'none', padding: '5px 14px' }} color={statusColor}>
        {status}
      </Tag>
    );
  };

  const fetchVotingHistory = async () => {
    const votingHistory: any = await walletService.fetchAccountVotingHistory(
      currentSession.wallet.address,
    );

    const curData: any = votingHistory?.map((elem: any, idx) => {
      const proposal_id = elem?.data?.proposalId;
      const option = elem?.data?.option;
      const contentTitle = props?.proposalList?.find(val => val.proposal_id === proposal_id);
      return {
        index: idx + 1,
        proposal: contentTitle,
        vote: option,
        vote_date: moment(elem.blockTime).format('DD/MM/YYYY - HH:mm:ss'),
      };
    });

    SetTableData(curData);
    setTimeout(() => SetLoadingTableData(false), 500);
  };

  useEffect(() => {
    if (!didMountRef.current) {
      fetchVotingHistory();
      didMountRef.current = true;
    }
  }, [currentSession, loadingTableData, SetLoadingTableData, tableData, SetTableData]);

  return (
    <div id="voting-history-section">
      <Button
        id="votingHistoryBtn"
        type="link"
        size="large"
        onClick={() => props.setHistoryVisible(false)}
      >
        <ArrowLeftOutlined style={{ fontSize: '17px', color: '#1199fa', marginRight: '6px' }} />{' '}
        {t('governance.voteHistory.backBtn')}
      </Button>
      <Header className="voting-history-title">{t('governance.voteHistory.title')}</Header>
      <div className="header-description">{t('governance.voteHistory.description')}</div>

      <Table
        locale={{
          triggerDesc: t('general.table.triggerDesc'),
          triggerAsc: t('general.table.triggerAsc'),
          cancelSort: t('general.table.cancelSort'),
        }}
        className="voting-history-table"
        dataSource={tableData}
        columns={columns}
        rowKey={(record: any) => record.index}
        pagination={false}
        loading={{
          indicator: <Spin indicator={<LoadingOutlined style={{ fontSize: 36 }} spin />} />,
          spinning: loadingTableData,
        }}
      />
    </div>
  );
};
