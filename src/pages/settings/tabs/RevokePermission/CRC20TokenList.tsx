import { Contract, ethers } from 'ethers';
import { getAddress } from 'ethers/lib/utils';
import { Log } from '@ethersproject/abstract-provider';
import React, { useEffect, useState } from 'react';
import { Table } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import CRC20TokenContract from '../../../../service/signers/abi/TokenContractABI.json';
import { getCRC20TokenData, toFloat } from './utils';

export interface CRC20TokenData {
  contract: Contract;
  // icon: string
  symbol: string;
  decimals: number;
  balance: string;
  // totalSupply: string
  // verified: boolean
  approvals: Array<Log>;
}

interface TokenDataWithApproval {
  token: Omit<CRC20TokenData, 'approvals'>;
  approval: {
    spender: string;
    readableSpenderName: string;
    amount: string;
    riskExposure: string;
  };
  rowSpan: number;
}

interface Props {
  filterUnverifiedTokens: boolean;
  filterZeroBalances: boolean;
  transferEvents: Log[];
  approvalEvents: Log[];
  inputAddress?: string;
  nodeURL: string;
  indexingURL: string;
}

function CRC20TokenList({
  filterUnverifiedTokens,
  filterZeroBalances,
  transferEvents,
  approvalEvents,
  inputAddress,
  nodeURL,
  indexingURL,
}: Props) {
  const [tokens, setTokens] = useState<CRC20TokenData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [flatternedApprovalledData, setFlatternedApprovalledData] = useState<
    TokenDataWithApproval[]
  >([]);

  useEffect(() => {
    loadData();
  }, [inputAddress]);

  const loadData = async () => {
    if (!inputAddress) return;

    setLoading(true);

    const allEvents = [...approvalEvents, ...transferEvents];

    const provider = new ethers.providers.JsonRpcProvider(nodeURL);

    const tokenContracts = allEvents
      .filter((event, i) => i === allEvents.findIndex(other => event.address === other.address))
      .map(event => new Contract(getAddress(event.address), CRC20TokenContract.abi, provider));

    const unsortedTokens: CRC20TokenData[] = await Promise.all(
      tokenContracts.map(async contract => {
        const tokenApprovals = approvalEvents.filter(
          approval => approval.address.toLowerCase() === contract.address.toLowerCase(),
        );
        const map = new Map<string, Log>();
        tokenApprovals.forEach(approval => {
          if (!map.has(approval.topics[2])) {
            map.set(approval.topics[2], approval);
          }
        });
        const approvals = Array.from(map.values());

        const tokenData = await getCRC20TokenData(contract, inputAddress, nodeURL, indexingURL);
        return {
          contract,
          approvals,
          symbol: tokenData.symbol,
          balance: tokenData.balance,
          decimals: tokenData.decimals,
        };
      }),
    );

    const hasBalanceOrApprovals = (token: CRC20TokenData) =>
      token.approvals.length > 0 || toFloat(Number(token.balance), token.decimals) !== '0.000';

    const sortedTokens = unsortedTokens
      .filter(token => token !== undefined)
      .filter(hasBalanceOrApprovals)
      .sort((a, b) => a.balance.localeCompare(b.balance));

    console.log(sortedTokens);

    const approvals = sortedTokens.reduce<TokenDataWithApproval[]>((acc, token) => {
      const tokensWithApprovalData: TokenDataWithApproval[] = [];
      const map = new Map<string, Log>();
      token.approvals.forEach((t, idx) => {
        const spender = t.topics[2];
        if (!map.has(spender)) {
          map.set(spender, t);

          const rowSpan = idx === 0 ? token.approvals.length : 0;
          console.log('rowSpan: ', rowSpan, token.symbol);

          tokensWithApprovalData.push({
            token,
            approval: {
              spender,
              readableSpenderName: '',
              amount: t.topics[1],
              riskExposure: '',
            },
            rowSpan,
          });
        }
      });

      acc.push(...tokensWithApprovalData);

      return acc;
    }, []);

    console.log(approvals);

    setFlatternedApprovalledData(approvals);

    setLoading(false);
  };

  if (loading) {
    return <div>Loading</div>;
  }

  if (flatternedApprovalledData.length === 0) {
    return <div className="TokenList">No token balances</div>;
  }

  const columns: ColumnsType<TokenDataWithApproval> = [
    {
      title: 'Token/Balance',
      render: (data: TokenDataWithApproval) => {
        return <div>{data.token.symbol}</div>;
      },
      onCell: (data: TokenDataWithApproval, _) =>
        ({
          rowSpan: data.rowSpan,
        } as any),
    },
    {
      title: 'Approved Spender',
      render: (data: TokenDataWithApproval) => {
        return <div>{data.approval.spender}</div>;
      },
    },
  ];

  return <Table columns={columns} dataSource={flatternedApprovalledData} pagination={false} />;
}

export default CRC20TokenList;
