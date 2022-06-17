import React, {
  useEffect,
  // useState
} from 'react';

// eslint-disable-next-line
// import type { TableProps } from 'antd';
import { Layout, Button, Table, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
// import type {
//   ColumnsType,
//   FilterValue,
//   // SorterResult
// } from 'antd/lib/table/interface';

// import { useTranslation } from 'react-i18next';

import '../governance.less';
import 'antd/dist/antd.css';

const {
  Header,
  // ,
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

  // const [filteredInfo, setFilteredInfo] = useState<Record<string, FilterValue | null>>({});
  // const [sortedInfo, setSortedInfo] = useState<SorterResult<DataType>>({});

  // const handleTableChange: TableProps<DataType>['onChange'] = (pagination, filters, sorter) => {
  //   setFilteredInfo(filters);
  //   setSortedInfo(sorter as SorterResult<DataType>);
  // };

  // const clearFilters = () => {
  //   setFilteredInfo({});
  // };

  const columns = [
    {
      title: '#',
      dataIndex: 'index',
      key: 'index',
      // sortOrder: sortedInfo.columnKey === 'index' ? sortedInfo.order : null,
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
      // filteredValue: filteredInfo.vote || null,
      // onFilter: (value: string, record) => (record.vote.toLowerCase().indexOf(value) > -1),
    },
    {
      title: 'Voted On',
      dataIndex: 'vote_date',
      key: 'vote_date',
    },
  ];

  // const tableColumns = columns.map(item => ({ ...item }));

  useEffect(() => {
    // tableColumns[0].fixed = true;
    // tableColumns[tableColumns.length - 1].fixed = 'right';
  });

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
      <Space style={{ marginBottom: 12 }}>
        <Button
          size="small"
          // onClick={clearFilters}
        >
          Clear filters
        </Button>
      </Space>
      <Table
        dataSource={tableData}
        columns={columns}
        // onChange={handleTableChange}
      />
    </div>
  );
};
