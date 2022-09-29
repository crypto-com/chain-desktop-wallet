import { Log } from '@ethersproject/abstract-provider';
import { message, Spin, Table } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import { Contract, ethers } from 'ethers';
import { getAddress } from 'ethers/lib/utils';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRecoilValue } from 'recoil';
import { TransactionConfig } from 'web3-core';
import { usePasswordModal } from '../../../../components/PasswordForm/PasswordFormModal';
import { UserAsset } from '../../../../models/UserAsset';
import { allMarketState, sessionState } from '../../../../recoil/atom';
import { CronosClient } from '../../../../service/cronos/CronosClient';
import CRC20TokenContract from '../../../../service/signers/abi/TokenContractABI.json';
import { EvmTransactionSigner, evmTransactionSigner } from '../../../../service/signers/EvmTransactionSigner';
import { EVMContractCallUnsigned } from '../../../../service/signers/TransactionSupported';
import { TransactionPrepareService } from '../../../../service/TransactionPrepareService';
import { walletService } from '../../../../service/WalletService';
import { secretStoreService } from '../../../../service/storage/SecretStoreService';
import RequestConfirmation from '../../../dapp/components/RequestConfirmation/RequestConfirmation';
import { DappBrowserIPC } from '../../../dapp/types';
import { ConfirmModal } from './ConfirmModal';
import { Amount, RiskExposure, TokenBalance, TokenSpender } from './TableCells';
import { CRC20TokenData, TokenDataWithApproval } from './types';
import { getCRC20TokenData, getGasPrice, parsePadZero32Value, toFloat } from './utils';
import { CronosMainnetChainConfig } from '../../../../config/DAppChainConfig';

interface Props {
  transferEvents: Log[];
  approvalEvents: Log[];
  inputAddress?: string;
  nodeURL: string;
  indexingURL: string;
  explorerURL: string;
  cronosAsset: UserAsset;
  onRevokeSuccess: () => void;
  onError: (error: Error) => void;
}

const CRC20TokenList = ({
  transferEvents,
  cronosAsset,
  approvalEvents,
  inputAddress,
  nodeURL,
  indexingURL,
  explorerURL,
  onRevokeSuccess,
  onError,
}: Props) => {
  const [txEvent, setTxEvent] = useState<DappBrowserIPC.TokenApprovalEvent>();
  const [requestConfirmationVisible, setRequestConfirmationVisible] = useState(false);
  const allMarketData = useRecoilValue(allMarketState);
  const currentSession = useRecoilValue(sessionState);

  const [loading, setLoading] = useState<boolean>(true);
  const [flatternedApprovalledData, setFlatternedApprovalledData] = useState<
  TokenDataWithApproval[]
  >([]);
  const [t] = useTranslation();

  const { show: showPasswordModal } = usePasswordModal();
  const [decryptedPhrase, setDecryptedPhrase] = useState('');
  const [selectedData, setSelectedData] = useState<TokenDataWithApproval>();
  const [isTokenApprovalLoading, setIsTokenApprovalLoading] = useState(false);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const transactionPrepareService = new TransactionPrepareService(walletService.storageService);

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
        const spender = parsePadZero32Value(t.topics[2]);
        if (!map.has(spender)) {
          map.set(spender, t);

          const rowSpan = idx === 0 ? token.approvals.length : 0;

          tokensWithApprovalData.push({
            token,
            approval: {
              spender,
              tx: t.transactionHash,
              timeStamp: (t as any).timeStamp,
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
      const spender = approval.topics[2];
      const lastApproval = map.get(spender);
      if (!lastApproval) {
        map.set(spender, approval);
      } else if (ethers.BigNumber.from(approval.blockNumber).gt(lastApproval.blockNumber)) {
        map.set(spender, approval);
      }
    });

    const filterZeroApprovals = (log: Log) => {
      const approval =
        log.data === '0x' ? ethers.BigNumber.from(0) : ethers.BigNumber.from(log.data);

      return approval.gt(ethers.BigNumber.from(0));
    };

    return Array.from(map.values()).filter(filterZeroApprovals);
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
          minHeight: '200px',
        }}
      >
        <Spin style={{ left: 'auto' }} />
      </div>
    );
  }

  if (flatternedApprovalledData.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px',
          color: '#777777',
        }}
      >
        {t('settings.noApproval')}
      </div>
    );
  }

  const columns: ColumnsType<TokenDataWithApproval> = [
    {
      title: t('settings.revoke.token'),
      key: 'token',
      render: (data: TokenDataWithApproval) => (
        <TokenBalance data={data} explorerURL={explorerURL} />
      ),
      onCell: (data: TokenDataWithApproval) =>
        ({
          rowSpan: data.rowSpan,
        } as any),
    },
    {
      title: t('settings.revoke.spender'),
      key: 'spender',
      render: (data: TokenDataWithApproval) => {
        return (
          <TokenSpender
            indexingURL={indexingURL}
            nodeURL={nodeURL}
            spender={data.approval.spender}
            explorerURL={explorerURL}
          />
        );
      },
    },
    {
      title: t('settings.revoke.amount'),
      key: 'amount',
      render: (data: TokenDataWithApproval) => <Amount data={data} explorerURL={explorerURL} />,
    },
    {
      title: t('settings.revoke.risk'),
      key: 'risk',
      render: (data: TokenDataWithApproval) => <RiskExposure data={data} />,
    },
    {
      title: t('home.transactions.table1.time'),
      key: 'approval.timeStamp',
      render: (data: TokenDataWithApproval) => {
        return new Date(Number(data.approval.timeStamp) * 1000).toLocaleString();
      },
    },
    {
      title: '',
      key: 'action',
      render: (data: TokenDataWithApproval) => {
        return (
          <a
            onClick={async () => {
              showPasswordModal({
                onSuccess: async password => {
                  const phraseDecrypted = await secretStoreService.decryptPhrase(
                    password,
                    currentSession.wallet.identifier,
                  );
                  setDecryptedPhrase(phraseDecrypted);
                  setSelectedData({ ...data });
                },
                onCancel: () => {},
              });
            }}
            style={{ color: '#D9475A' }}
          >
            {t('settings.revoke')}
          </a>
        );
      },
    },
  ];

  return (
    <div>
      {txEvent && requestConfirmationVisible && (
        <RequestConfirmation
          event={txEvent}
          cronosAsset={cronosAsset}
          allMarketData={allMarketData}
          currentSession={currentSession}
          wallet={currentSession.wallet}
          visible
          isConfirming={isConfirmLoading}
          onConfirm={async ({ gasLimit: _gasLimit, gasPrice: _gasPrice, event }) => {
            setRequestConfirmationVisible(false);

            if (event.name !== 'tokenApproval' || !cronosAsset.config?.nodeUrl) {
              return;
            }

            try {
              const prepareTXConfig: TransactionConfig = {
                from: event.object.from,
                to: event.object.to,
              };

              const prepareTxInfo = await transactionPrepareService.prepareEVMTransaction(
                cronosAsset!,
                prepareTXConfig,
              );

              const data = evmTransactionSigner.encodeTokenApprovalABI(
                event.object.spender,
                ethers.BigNumber.from(event.object.amount),
              );

              const txConfig: EVMContractCallUnsigned = {
                from: event.object.from,
                contractAddress: event.object.to,
                data,
                gasLimit: `0x${_gasLimit.toString(16)}`,
                gasPrice: `0x${_gasPrice.toString(16)}`,
                nonce: prepareTxInfo.nonce,
              };

              await EvmTransactionSigner.sendContractCallTransaction(
                {
                  chainConfig: CronosMainnetChainConfig,
                  transaction: txConfig,
                  mnemonic: decryptedPhrase
                }
              );

              setIsConfirmLoading(false);
              setIsTokenApprovalLoading(false);
              setTxEvent(undefined);
              setSelectedData(undefined);
              message.success('Revoke success');

              onRevokeSuccess();
            } catch (error) {
              message.error(((error as unknown) as any).toString());
              setIsConfirmLoading(false);
              setIsTokenApprovalLoading(false);
            }
          }}
          onCancel={() => {
            setIsConfirmLoading(false);
            setIsTokenApprovalLoading(false);
            setRequestConfirmationVisible(false);
          }}
        />
      )}
      {selectedData && (
        <ConfirmModal
          closable={!isTokenApprovalLoading}
          isLoading={isTokenApprovalLoading}
          onCancel={() => {
            setSelectedData(undefined);
            setIsTokenApprovalLoading(false);
          }}
          onConfirm={async () => {
            const data = selectedData;
            if (!cronosAsset.address) {
              return;
            }

            setIsTokenApprovalLoading(true);

            const tokenAddress = data.token.contract.address;
            // eslint-disable-next-line prefer-destructuring
            const spender = data.approval.spender;
            const from = cronosAsset.address;

            const client = new CronosClient(nodeURL, indexingURL);

            const abi = evmTransactionSigner.encodeTokenApprovalABI(spender, 0);

            const response = await client.getContractDataByAddress(tokenAddress);
            const { gasLimit, gasPrice } = await getGasPrice(cronosAsset, {
              from,
              to: tokenAddress,
              data: abi,
              value: '0x0',
            });

            const approvalEvent: DappBrowserIPC.TokenApprovalEvent = {
              name: 'tokenApproval',
              id: 12345,
              object: {
                amount: '0',
                chainConfig: CronosMainnetChainConfig,
                from,
                gas: gasLimit,
                gasPrice,
                spender,
                to: tokenAddress,
                tokenData: response.result,
              },
            };

            setTxEvent(approvalEvent);
            setRequestConfirmationVisible(true);
          }}
        />
      )}
      <Table
        columns={columns}
        size="middle"
        dataSource={flatternedApprovalledData}
        pagination={false}
        rowKey={d => `${d.token.contract.address}-${d.approval.spender}`}
      />
    </div>
  );
};

export default CRC20TokenList;
