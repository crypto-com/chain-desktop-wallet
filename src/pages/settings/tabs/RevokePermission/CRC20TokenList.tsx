import { Contract, ethers } from 'ethers';
import { getAddress } from 'ethers/lib/utils';
import { Log } from '@ethersproject/abstract-provider';
import React, { useCallback, useEffect, useState } from 'react';
import { Spin, Table } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import { InfoCircleOutlined } from '@ant-design/icons';
import CRC20TokenContract from '../../../../service/signers/abi/TokenContractABI.json';
import { getCRC20TokenData, toFloat, parsePadZero32Value } from './utils';
import { Amount, RiskExposure, TokenBalance, TokenSpender } from './TableCells';
import { CRC20TokenData, TokenDataWithApproval } from './types';
import { useConfirmModal } from '../../../../components/ConfirmModal/useConfirmModal';
import { usePasswordModal } from '../../../../components/PasswordForm/PasswordFormModal';

interface Props {
  filterUnverifiedTokens: boolean;
  filterZeroBalances: boolean;
  transferEvents: Log[];
  approvalEvents: Log[];
  inputAddress?: string;
  nodeURL: string;
  indexingURL: string;
  explorerURL: string,
  onError: (error: Error) => void;
}

function CRC20TokenList({
  filterUnverifiedTokens,
  filterZeroBalances,
  transferEvents,
  approvalEvents,
  inputAddress,
  nodeURL,
  indexingURL,
  explorerURL,
  onError,
}: Props) {
  const [tokens, setTokens] = useState<CRC20TokenData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [flatternedApprovalledData, setFlatternedApprovalledData] = useState<
    TokenDataWithApproval[]
  >([]);

  const { showWithConfig: showConfirmModal, dismiss: dismissConfirmModal } = useConfirmModal();
  const { show: showPasswordModal } = usePasswordModal();

  const loadData = useCallback(async () => {
    if (!inputAddress) return;

    setLoading(true);

    const tokenContracts = getContracts([...approvalEvents, ...transferEvents]);

    const unsortedTokens: CRC20TokenData[] = await Promise.all(
      tokenContracts.map(async contract => {
        const approvals = filterDuplicatedApprovalsEvents(contract);

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

    const sortedTokens = unsortedTokens
      .filter(token => token !== undefined)
      .filter(hasBalanceOrApprovals)
      .sort((a, b) => b.balance.localeCompare(a.balance));

    const approvals = sortedTokens.reduce<TokenDataWithApproval[]>((acc, token) => {
      const tokensWithApprovalData: TokenDataWithApproval[] = [];
      const map = new Map<string, Log>();
      token.approvals.forEach((t, idx) => {
        const spender = t.topics[2];
        if (!map.has(spender)) {
          map.set(spender, t);

          const rowSpan = idx === 0 ? token.approvals.length : 0;
          console.log('rowSpan: ', rowSpan, token.symbol, t);

          tokensWithApprovalData.push({
            token,
            approval: {
              spender,
              readableSpenderName: '',
              amount: t.data === '0x' ? ethers.BigNumber.from(0) : ethers.BigNumber.from(t.data),
              riskExposure: '',
            },
            rowSpan,
          });
        }
      });

      acc.push(...tokensWithApprovalData);

      return acc;
    }, []);

    setFlatternedApprovalledData(approvals);
    setLoading(false);
  }, [inputAddress, approvalEvents, transferEvents]);

  const fetch = useCallback(async () => {
    try {
      await loadData();
    } catch (error) {
      onError((error as unknown) as any);
    }
  }, [loadData]);

  useEffect(() => {
    fetch();
  }, [inputAddress, fetch]);

  const getContracts = (events: Log[]) => {
    const provider = new ethers.providers.JsonRpcProvider(nodeURL);

    const tokenContracts = events
      .filter((event, i) => i === events.findIndex(other => event.address === other.address))
      .map(event => new Contract(getAddress(event.address), CRC20TokenContract.abi, provider));

    return tokenContracts;
  };

  const filterDuplicatedApprovalsEvents = (contract: Contract) => {
    const tokenApprovals = approvalEvents.filter(
      approval => approval.address.toLowerCase() === contract.address.toLowerCase(),
    );
    const map = new Map<string, Log>();
    tokenApprovals.forEach(approval => {
      if (!map.has(approval.topics[2])) {
        map.set(approval.topics[2], approval);
      }
    });
    return Array.from(map.values());
  };

  const hasBalanceOrApprovals = (token: CRC20TokenData) =>
    token.approvals.length > 0 || toFloat(Number(token.balance), token.decimals) !== '0.000';

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Spin />
      </div>
    );
  }

  if (flatternedApprovalledData.length === 0) {
    return <div className="TokenList">No token balances</div>;
  }

  const columns: ColumnsType<TokenDataWithApproval> = [
    {
      title: 'Token/Balance',
      key: 'token',
      render: (data: TokenDataWithApproval) => <TokenBalance data={data} explorerURL={explorerURL} />,
      onCell: (data: TokenDataWithApproval, _) =>
        ({
          rowSpan: data.rowSpan,
        } as any),
    },
    {
      title: 'Approved Spender',
      key: 'spender',
      render: (data: TokenDataWithApproval) => {
        const spender = parsePadZero32Value(data.approval.spender);
        return <TokenSpender indexingURL={indexingURL} nodeURL={nodeURL} spender={spender} explorerURL={explorerURL} />;
      },
    },
    {
      title: 'Approved Amount',
      key: 'amount',
      render: (data: TokenDataWithApproval) => <Amount data={data} />,
    },
    {
      title: 'Risk Exposure',
      key: 'risk',
      render: (data: TokenDataWithApproval) => <RiskExposure data={data} />,
    },
    {
      title: '',
      key: 'action',
      render: (data: TokenDataWithApproval) => {
        return <a
          onClick={async () => {

            showPasswordModal({
              onSuccess: (password) => {
                showConfirmModal({
                  title: 'Confirm',
                  icon: <InfoCircleOutlined style={{ color: '#f27474', fontSize: '70px' }} />,
                  okText: 'Revoke Permission',
                  subTitle: `Are you sure you want to revoke permission?`,
                  onApprove: () => { },
                  onCancel: () => {
                    dismissConfirmModal()
                  },
                })
              },
              onCancel: () => {

              }
            })

          }}
          style={{ color: '#D9475A' }}
        >
          Revoke
        </a>
      },
    },
  ];

  return <Table columns={columns} size="middle" dataSource={flatternedApprovalledData} pagination={false} rowKey={(d) => `${d.token.contract.address}-${d.approval.spender}`} />;
}

export default CRC20TokenList;
