import React, { useEffect, useRef, useState } from 'react';
import './home.less';
import 'antd/dist/antd.css';
import { Layout, Table, Tabs, Tag, Typography } from 'antd';
import { useRecoilState, useRecoilValue } from 'recoil';
import {
  scaledAmount,
  scaledBalance,
  scaledStakingBalance,
  UserAsset,
} from '../../models/UserAsset';
import { sessionState, walletAssetState } from '../../recoil/atom';
import { walletService } from '../../service/WalletService';
import {
  StakingTransactionData,
  TransactionDirection,
  TransactionStatus,
  TransferTransactionData,
} from '../../models/Transaction';
import { Session } from '../../models/Session';

const { Text } = Typography;

// import {ReactComponent as HomeIcon} from '../../assets/icon-home-white.svg';

const { Header, Content, Footer } = Layout;
const { TabPane } = Tabs;

const middleEllipsis = (str: string) => {
  return `${str.substr(0, 12)}...${str.substr(str.length - 12, str.length)}`;
};

interface StakingTabularData {
  key: string;
  stakedAmount: string;
  validatorAddress: string;
  delegatorAddress: string;
}

interface TransferTabularData {
  key: string;
  transactionHash: string;
  recipientAddress: string;
  amount: string;
  time: string;
  direction: TransactionDirection;
  status: TransactionStatus;
}

function convertDelegations(allDelegations: StakingTransactionData[], currentAsset: UserAsset) {
  return allDelegations.map(dlg => {
    const stakedAmount = scaledAmount(dlg.stakedAmount, currentAsset.decimals).toString();
    const data: StakingTabularData = {
      key: dlg.validatorAddress + dlg.stakedAmount,
      delegatorAddress: dlg.delegatorAddress,
      validatorAddress: dlg.validatorAddress,
      stakedAmount: `${stakedAmount} ${currentAsset.symbol}`,
    };
    return data;
  });
}

function convertTransfers(
  allTransfers: TransferTransactionData[],
  currentAsset: UserAsset,
  sessionData: Session,
) {
  const { address } = sessionData.wallet;
  function getDirection(from: string, to: string): TransactionDirection {
    if (address === from && address === to) {
      return TransactionDirection.SELF;
    }
    if (address === from) {
      return TransactionDirection.OUTGOING;
    }
    return TransactionDirection.INCOMING;
  }
  return allTransfers.map(transfer => {
    const transferAmount = scaledAmount(transfer.amount, currentAsset.decimals).toString();
    const data: TransferTabularData = {
      key: transfer.hash + transfer.receiverAddress + transfer.amount,
      recipientAddress: transfer.receiverAddress,
      transactionHash: transfer.hash,
      time: new Date(transfer.date).toLocaleString(),
      amount: `${transferAmount}  ${currentAsset.symbol}`,
      direction: getDirection(transfer.senderAddress, transfer.receiverAddress),
      status: transfer.status,
    };
    return data;
  });
}

function HomePage() {
  const currentSession = useRecoilValue(sessionState);
  const [delegations, setDelegations] = useState<StakingTabularData[]>([]);
  const [transfers, setTransfers] = useState<TransferTabularData[]>([]);
  const [userAsset, setUserAsset] = useRecoilState(walletAssetState);
  const didMountRef = useRef(false);

  useEffect(() => {
    let unmounted = false;

    const syncAssetData = async () => {
      const sessionData = await walletService.retrieveCurrentSession();
      const currentAsset = await walletService.retrieveDefaultWalletAsset(sessionData);
      const allDelegations: StakingTransactionData[] = await walletService.retrieveAllDelegations(
        sessionData.wallet.identifier,
      );
      const allTransfers: TransferTransactionData[] = await walletService.retrieveAllTransfers(
        sessionData.wallet.identifier,
      );

      const stakingTabularData = convertDelegations(allDelegations, currentAsset);
      const transferTabularData = convertTransfers(allTransfers, currentAsset, sessionData);

      if (!unmounted) {
        setDelegations(stakingTabularData);
        setTransfers(transferTabularData);
        setUserAsset(currentAsset);
      }
    };

    if (!didMountRef.current) {
      syncAssetData();
      didMountRef.current = true;
    }

    return () => {
      unmounted = true;
    };
  }, [delegations, setUserAsset]);

  const StakingColumns = [
    {
      title: 'Validator Address',
      dataIndex: 'validatorAddress',
      key: 'validatorAddress',
      render: text => (
        <a
          target="_blank"
          rel="noreferrer"
          href={`${currentSession.wallet.config.explorerUrl}/validator/${text}`}
        >
          {text}
        </a>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'stakedAmount',
      key: 'stakedAmount',
    },
    {
      title: 'Delegator Address',
      dataIndex: 'delegatorAddress',
      key: 'delegatorAddress',
      render: text => <a>{text}</a>,
    },
  ];

  const TransactionColumns = [
    {
      title: 'Transaction Hash',
      dataIndex: 'transactionHash',
      key: 'transactionHash',
      render: text => (
        <a
          data-original={text}
          target="_blank"
          rel="noreferrer"
          href={`${currentSession.wallet.config.explorerUrl}/tx/${text}`}
        >
          {middleEllipsis(text)}
        </a>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (text, record: TransferTabularData) => {
        const color = record.direction === TransactionDirection.OUTGOING ? 'danger' : 'success';
        const sign = record.direction === TransactionDirection.OUTGOING ? '-' : '+';

        return (
          <Text type={color}>
            {sign}
            {text}
          </Text>
        );
      },
    },
    {
      title: 'Recipient',
      dataIndex: 'recipientAddress',
      key: 'recipientAddress',
      render: text => <div data-original={text}>{middleEllipsis(text)}</div>,
    },
    {
      title: 'Time',
      dataIndex: 'time',
      key: 'time',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (text, record: TransferTabularData) => {
        // const color = record.direction === TransactionDirection.OUTGOING ? 'danger' : 'success';
        // const sign = record.direction === TransactionDirection.OUTGOING ? '-' : '+';
        let statusColor;
        if (record.status === TransactionStatus.SUCCESS) {
          statusColor = 'success';
        } else if (record.status === TransactionStatus.FAILED) {
          statusColor = 'error';
        } else {
          statusColor = 'processing';
        }

        return <Tag color={statusColor}>{record.status.toString()}</Tag>;
      },
    },
  ];

  return (
    <Layout className="site-layout">
      <Header className="site-layout-background">Welcome Back!</Header>
      <Content>
        <div className="site-layout-background balance-container">
          <div className="balance">
            <div className="title">TOTAL BALANCE</div>
            <div className="quantity">
              {scaledBalance(userAsset)} {userAsset?.symbol}
            </div>
          </div>
          <div className="balance">
            <div className="title">STAKED BALANCE</div>
            <div className="quantity">
              {scaledStakingBalance(userAsset)} {userAsset?.symbol}
            </div>
          </div>
        </div>
        <Tabs defaultActiveKey="1">
          <TabPane tab="Transactions" key="1">
            <Table columns={TransactionColumns} dataSource={transfers} />
          </TabPane>
          <TabPane tab="Delegations" key="2">
            <Table columns={StakingColumns} dataSource={delegations} />
          </TabPane>
        </Tabs>
      </Content>
      <Footer />
    </Layout>
  );
}

export default HomePage;
