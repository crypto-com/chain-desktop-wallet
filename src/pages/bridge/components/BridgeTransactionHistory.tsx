import React, { useEffect, useState } from 'react';
import './BridgeTransactionHistory.less';
import { useRecoilValue } from 'recoil';
import { Select, Spin, Table, Tag, Tooltip } from 'antd';
import Big from 'big.js';
import { useTranslation } from 'react-i18next';

import { sessionState, walletAllAssetsState } from '../../../recoil/atom';
import {
  bech32ToEVMAddress,
  middleEllipsis,
  getCronosEvmAsset,
  getCronosTendermintAsset,
  getAssetBySymbolAndChain,
  getChainName,
  getCosmosHubTendermintAsset,
} from '../../../utils/utils';

import { walletService } from '../../../service/WalletService';
import { BridgeService } from '../../../service/bridge/BridgeService';
import {
  BridgeSourceChain,
  BridgeTransaction,
  BridgeTransactionStatus,
} from '../../../service/bridge/contracts/BridgeModels';
import { renderExplorerUrl } from '../../../models/Explorer';
import { LoadingOutlined } from '@ant-design/icons';

const { Option } = Select;

const BridgeTransactionHistory = () => {
  const session = useRecoilValue(sessionState);
  const walletAllAssets = useRecoilValue(walletAllAssetsState);

  const [loading, setLoading] = useState(false);
  const [selectedChain, setSelectedChain] = useState<BridgeSourceChain>(BridgeSourceChain.CRONOS_TENDERMINT);
  const [allBridgeHistory, setAllBridgeHistory] = useState<BridgeTransferTabularData[]>([]);

  const [t] = useTranslation();

  // eslint-disable-next-line
  const cronosEvmAsset = getCronosEvmAsset(walletAllAssets);
  const cronosTendermintAsset = getCronosTendermintAsset(walletAllAssets);
  const cosmosHubTendermintAsset = getCosmosHubTendermintAsset(walletAllAssets);

  const bridgeService = new BridgeService(walletService.storageService);
  const isTestnet = bridgeService.checkIfTestnet(session.wallet.config.network);

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

    return allTransfers.map((transfer, idx) => {
      const data: BridgeTransferTabularData = {
        key:
          idx.toString() +
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
      render: (record: BridgeTransferTabularData) => {
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
              ({getChainName(source.chain.replace('-', ' '), session.wallet.config)})
            </Tooltip>
          </>
        );
      },
    },
    {
      title: t('bridge.transactionHistory.table.toAddress'),
      // dataIndex: 'destination',
      key: 'destination',
      render: (record: BridgeTransferTabularData) => {
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
                ({getChainName(destination.chain.replace('-', ' '), session.wallet.config)})
              </Tooltip>
            ) : (
              <>({getChainName(destination.chain.replace('-', ' '), session.wallet.config)})</>
            )}
          </>
        );
      },
    },
    {
      title: t('bridge.transactionHistory.table.amount'),
      // dataIndex: 'amount',
      key: 'amount',
      render: (record: BridgeTransferTabularData) => {
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
      render: (status: BridgeTransactionStatus) => {
        return processStatusTag(status);
      },
    },
  ];

  useEffect(() => {
    const fetchBridgeHistory = async () => {
      setLoading(true);
      // if (cronosEvmAsset) {
      await bridgeService.fetchAndSaveBridgeTxs({
        cronosEvmAddress: selectedChain === BridgeSourceChain.CRONOS ? cronosEvmAsset?.address! : undefined,
        cronosTendermintAddress: selectedChain === BridgeSourceChain.CRONOS_TENDERMINT ? cronosTendermintAsset?.address! : undefined,
        cosmosHubTendermintAddress: selectedChain === BridgeSourceChain.COSMOS_HUB ? cosmosHubTendermintAsset?.address! : undefined,
      });
      // }
      const transactionHistory = await bridgeService.retrieveCurrentWalletBridgeTransactions(selectedChain);
      setLoading(false);
      const processedHistory = convertBridgeTransfers(transactionHistory);
      setAllBridgeHistory(processedHistory);

    };
    fetchBridgeHistory();
  }, [selectedChain]);


  return (
    <>
      <Select
        value={selectedChain}
        onChange={(value: BridgeSourceChain) => {
          setSelectedChain(value);
        }}
      >
        <Option key={BridgeSourceChain.CRONOS} value={BridgeSourceChain.CRONOS}>{getChainName('Cronos', session.wallet.config)}: {`${middleEllipsis(cronosEvmAsset?.address!, 6)}`}</Option>
        <Option key={BridgeSourceChain.CRONOS_TENDERMINT} value={BridgeSourceChain.CRONOS_TENDERMINT}>{getChainName('Crypto.org', session.wallet.config)}: {`${middleEllipsis(cronosTendermintAsset?.address!, 6)}`}</Option>
        {!isTestnet
          ? <Option key={BridgeSourceChain.COSMOS_HUB} value={BridgeSourceChain.COSMOS_HUB}>{getChainName('Cosmos Hub', session.wallet.config)}: {`${middleEllipsis(cosmosHubTendermintAsset?.address!, 6)}`}</Option>
          : <></>
        }
      </Select>
      <Table
        columns={HistoryColumns}
        dataSource={allBridgeHistory}
        className="transfer-table"
        rowKey={record => record.key}
        loading={{
          indicator: (
            <Spin indicator={<LoadingOutlined style={{ fontSize: 36 }} spin />} />
          ),
          spinning: loading,
        }}
      />
    </>
  );
};

export default BridgeTransactionHistory;
