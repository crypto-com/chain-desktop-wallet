import React, { useEffect, useState } from 'react';
import './BridgeTransactionHistory.less';
import { useRecoilValue } from 'recoil';
import { Table, Tag, Tooltip } from 'antd';
import Big from 'big.js';
import { useTranslation } from 'react-i18next';

import { sessionState, walletAllAssetsState } from '../../../recoil/atom';
import {
  bech32ToEVMAddress,
  middleEllipsis,
  getCronosAsset,
  getAssetBySymbolAndChain,
} from '../../../utils/utils';

import { walletService } from '../../../service/WalletService';
import { BridgeService } from '../../../service/bridge/BridgeService';
import {
  BridgeTransaction,
  BridgeTransactionStatus,
} from '../../../service/bridge/contracts/BridgeModels';
import { renderExplorerUrl } from '../../../models/Explorer';

const BridgeTransactionHistory = () => {
  const session = useRecoilValue(sessionState);
  const walletAllAssets = useRecoilValue(walletAllAssetsState);

  const [allBridgeHistory, setAllBridgeHistory] = useState<BridgeTransferTabularData[]>([]);

  const [t] = useTranslation();

  // eslint-disable-next-line
  const cronosAsset = getCronosAsset(walletAllAssets);

  const bridgeService = new BridgeService(walletService.storageService);

  interface BridgeTransferTabularData {
    key: string;
    source: {
      address: string;
      transactionId: string;
      chain: string;
    };
    destination: {
      address: string;
      transactionId: string;
      chain: string;
    };
    amount: string;
    symbol: string;
    time: string;
    status: string;
  }

  const processStatusTag = (status: BridgeTransactionStatus) => {
    let statusColor;
    let statusMessage;
    switch (status) {
      case BridgeTransactionStatus.PENDING:
        statusColor = 'processing';
        statusMessage = 'PENDING';
        break;
      case BridgeTransactionStatus.FAILED:
        statusColor = 'error';
        statusMessage = 'FAILED';
        break;
      case BridgeTransactionStatus.CANCELLED:
        statusColor = 'default';
        statusMessage = 'CANCELLED';
        break;
      case BridgeTransactionStatus.CONFIRMED:
        statusColor = 'success';
        statusMessage = 'CONFIRMED';
        break;
      case BridgeTransactionStatus.REJECTED:
        statusColor = 'error';
        statusMessage = 'REJECTED';
        break;
      default:
        statusColor = 'default';
        statusMessage = '';
    }
    return (
      <Tag style={{ border: 'none', padding: '5px 14px' }} color={statusColor}>
        {statusMessage}
      </Tag>
    );
  };

  const convertBridgeTransfers = (allTransfers: BridgeTransaction[]) => {
    const isTestnet = bridgeService.checkIfTestnet(session.wallet.config.network);

    return allTransfers.map(transfer => {
      const data: BridgeTransferTabularData = {
        key:
          transfer.sourceTransactionId +
          transfer.sourceAddress +
          transfer.destinationTransactionId +
          transfer.destinationAddress +
          transfer.displayAmount +
          transfer.displayDenom,
        source: {
          address:
            transfer.sourceAddress.indexOf(isTestnet ? 'tcrc' : 'crc') === 0
              ? bech32ToEVMAddress(transfer.sourceAddress)
              : transfer.sourceAddress,
          transactionId: transfer.sourceTransactionId,
          chain: transfer.sourceChain,
        },
        destination: {
          address:
            transfer.destinationAddress.indexOf(isTestnet ? 'tcrc' : 'crc') === 0
              ? bech32ToEVMAddress(transfer.destinationAddress)
              : transfer.destinationAddress,
          transactionId: transfer.destinationTransactionId,
          chain: transfer.destinationChain,
        },
        amount: transfer.displayAmount,
        symbol: transfer.displayDenom,
        time: new Date(transfer.updatedAt).toLocaleString(),
        // direction: transfer.sourceChain,
        status: transfer.status,
      };
      return data;
    });
  };

  const HistoryColumns = [
    {
      title: t('bridge.transactionHistory.table.fromAddress'),
      // dataIndex: 'source',
      key: 'source',
      render: record => {
        const { source, symbol } = record;

        return (
          <>
            <a
              data-original={source.address}
              target="_blank"
              rel="noreferrer"
              href={`${renderExplorerUrl(
                getAssetBySymbolAndChain(
                  walletAllAssets,
                  symbol,
                  source.chain.split(/[^A-Za-z]/)[0],
                )?.config ?? session.wallet.config,
                'address',
              )}/${source.address}`}
            >
              {middleEllipsis(source.address, 6)}
            </a>
            <br />
            <Tooltip
              placement="right"
              title={
                <>
                  {t('bridge.transactionHistory.table.transactionHash')}{' '}
                  <a
                    data-original={source.transactionId}
                    target="_blank"
                    rel="noreferrer"
                    href={`${renderExplorerUrl(
                      getAssetBySymbolAndChain(
                        walletAllAssets,
                        symbol,
                        source.chain.split(/[^A-Za-z]/)[0],
                      )?.config ?? session.wallet.config,
                      'tx',
                    )}/${source.transactionId}`}
                  >
                    {middleEllipsis(source.transactionId, 6)}
                  </a>
                </>
              }
            >
              ({source.chain.replace('-', ' ')})
            </Tooltip>
          </>
        );
      },
    },
    {
      title: t('bridge.transactionHistory.table.toAddress'),
      // dataIndex: 'destination',
      key: 'destination',
      render: record => {
        const { destination, symbol, status } = record;

        return (
          <>
            <a
              data-original={destination.address}
              target="_blank"
              rel="noreferrer"
              href={`${renderExplorerUrl(
                getAssetBySymbolAndChain(
                  walletAllAssets,
                  symbol,
                  destination.chain.split(/[^A-Za-z]/)[0],
                )?.config ?? session.wallet.config,
                'address',
              )}/${destination.address}`}
            >
              {middleEllipsis(destination.address, 6)}
            </a>
            <br />
            {status === BridgeTransactionStatus.CONFIRMED ? (
              <Tooltip
                placement="right"
                title={
                  <>
                    {t('bridge.transactionHistory.table.transactionHash')}{' '}
                    {destination.chain.indexOf('Cronos') !== -1 ? (
                      middleEllipsis(destination.transactionId, 6)
                    ) : (
                      <a
                        data-original={destination.transactionId}
                        target="_blank"
                        rel="noreferrer"
                        href={`${renderExplorerUrl(
                          getAssetBySymbolAndChain(
                            walletAllAssets,
                            symbol,
                            destination.chain.split(/[^A-Za-z]/)[0],
                          )?.config ?? session.wallet.config,
                          'tx',
                        )}/${destination.transactionId}`}
                      >
                        {middleEllipsis(destination.transactionId, 6)}
                      </a>
                    )}
                  </>
                }
              >
                ({destination.chain.replace('-', ' ')})
              </Tooltip>
            ) : (
              <>({destination.chain.replace('-', ' ')})</>
            )}
          </>
        );
      },
    },
    {
      title: t('bridge.transactionHistory.table.amount'),
      // dataIndex: 'amount',
      key: 'amount',
      render: record => {
        return (
          <>
            {Big(record.amount).toFixed(4)} {record.symbol}
          </>
        );
      },
    },
    {
      title: t('bridge.transactionHistory.table.time'),
      dataIndex: 'time',
      key: 'time',
    },
    {
      title: t('bridge.transactionHistory.table.status'),
      dataIndex: 'status',
      key: 'status',
      render: text => {
        // const color = record.direction === TransactionDirection.OUTGOING ? 'danger' : 'success';
        // const sign = record.direction === TransactionDirection.OUTGOING ? '-' : '+';
        return processStatusTag(text);
      },
    },
  ];

  useEffect(() => {
    const fetchBridgeHistory = async () => {
      if (cronosAsset) {
        await bridgeService.fetchAndSaveBridgeTxs(cronosAsset?.address!);
      }
      const transactionHistory = await bridgeService.retrieveCurrentWalletBridgeTransactions();
      const processedHistory = convertBridgeTransfers(transactionHistory);

      setAllBridgeHistory(processedHistory);
    };
    fetchBridgeHistory();
  }, []);

  return (
    <>
      <Table
        columns={HistoryColumns}
        dataSource={allBridgeHistory}
        className="transfer-table"
        rowKey={record => record.key}
      />
    </>
  );
};

export default BridgeTransactionHistory;
