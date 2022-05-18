import { Table, Tag } from 'antd';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRecoilValue } from 'recoil';
import { renderExplorerUrl } from '../../../../models/Explorer';
import {
  NftAccountTransactionData,
  NftTransactionType,
  TransactionStatus,
} from '../../../../models/Transaction';
import { sessionState } from '../../../../recoil/atom';
import { walletService } from '../../../../service/WalletService';
import { ellipsis, middleEllipsis } from '../../../../utils/utils';

interface NftTransferTabularData {
  key: string;
  transactionHash: string;
  messageType: NftTransactionType;
  denomId: string;
  tokenId: string;
  recipientAddress: string;
  time: string;
  status: TransactionStatus;
}

const convertNftTransfers = (allTransfers: NftAccountTransactionData[]) => {
  const getStatus = (transfer: NftAccountTransactionData) => {
    if (transfer.success) {
      return TransactionStatus.SUCCESS;
    }
    return TransactionStatus.FAILED;
  };
  const getType = (transfer: NftAccountTransactionData) => {
    if (transfer.messageType === NftTransactionType.ISSUE_DENOM) {
      return NftTransactionType.ISSUE_DENOM;
      // eslint-disable-next-line no-else-return
    } else if (transfer.messageType === NftTransactionType.MINT_NFT) {
      return NftTransactionType.MINT_NFT;
    } else if (transfer.messageType === NftTransactionType.EDIT_NFT) {
      return NftTransactionType.EDIT_NFT;
    } else if (transfer.messageType === NftTransactionType.BURN_NFT) {
      return NftTransactionType.BURN_NFT;
    }
    return NftTransactionType.TRANSFER_NFT;
  };

  return allTransfers.map((transfer, idx) => {
    const data: NftTransferTabularData = {
      key: `${idx}_${transfer.transactionHash}_${transfer.data.recipient}_${transfer.data.denomId}_${transfer.data.tokenId}`,
      transactionHash: transfer.transactionHash,
      messageType: getType(transfer),
      denomId: transfer.data.denomId,
      tokenId: transfer.data.tokenId,
      recipientAddress: transfer.data.recipient,
      time: new Date(transfer.blockTime).toLocaleString(),
      status: getStatus(transfer),
    };
    return data;
  });
};

const CryptoOrgNFTTransactionList = () => {
  const [nftTransfers, setNftTransfers] = useState<NftTransferTabularData[]>([]);
  const currentSession = useRecoilValue(sessionState);
  const [t] = useTranslation();

  useEffect(() => {
    const fetchNftTransfers = async () => {
      const allNftTransfer: NftAccountTransactionData[] = await walletService.getAllNFTAccountTxs(
        currentSession,
      );
      const nftTransferTabularData = convertNftTransfers(allNftTransfer);
      setNftTransfers(nftTransferTabularData);
    };

    fetchNftTransfers();
  }, []);

  const NftTransactionColumns = [
    {
      title: t('home.transactions.table3.transactionHash'),
      dataIndex: 'transactionHash',
      key: 'transactionHash',
      render: text => (
        <a
          data-original={text}
          target="_blank"
          rel="noreferrer"
          href={`${renderExplorerUrl(currentSession.wallet.config, 'tx')}/${text}`}
        >
          {middleEllipsis(text, 6)}
        </a>
      ),
    },
    {
      title: t('home.transactions.table3.messageType'),
      dataIndex: 'messageType',
      key: 'messageType',
      render: (text, record: NftTransferTabularData) => {
        let statusColor;
        if (!record.status) {
          statusColor = 'error';
        } else if (record.messageType === NftTransactionType.MINT_NFT) {
          statusColor = 'success';
        } else if (record.messageType === NftTransactionType.TRANSFER_NFT) {
          statusColor =
            record.recipientAddress === currentSession.wallet.address ? 'processing' : 'error';
        } else {
          statusColor = 'default';
        }

        if (record.status) {
          if (record.messageType === NftTransactionType.MINT_NFT) {
            return (
              <Tag style={{ border: 'none', padding: '5px 14px' }} color={statusColor}>
                Minted NFT
              </Tag>
            );
            // eslint-disable-next-line no-else-return
          } else if (record.messageType === NftTransactionType.TRANSFER_NFT) {
            return (
              <Tag style={{ border: 'none', padding: '5px 14px' }} color={statusColor}>
                {record.recipientAddress === currentSession.wallet.address
                  ? 'Received NFT'
                  : 'Sent NFT'}
              </Tag>
            );
          } else if (record.messageType === NftTransactionType.ISSUE_DENOM) {
            return (
              <Tag style={{ border: 'none', padding: '5px 14px' }} color={statusColor}>
                Issued Denom
              </Tag>
            );
          }
          return (
            <Tag style={{ border: 'none', padding: '5px 14px' }} color={statusColor}>
              {record.messageType}
            </Tag>
          );
          // eslint-disable-next-line no-else-return
        } else {
          if (record.messageType === NftTransactionType.MINT_NFT) {
            return (
              <Tag style={{ border: 'none', padding: '5px 14px' }} color={statusColor}>
                Failed Mint
              </Tag>
            );
            // eslint-disable-next-line no-else-return
          } else if (record.messageType === NftTransactionType.TRANSFER_NFT) {
            return (
              <Tag style={{ border: 'none', padding: '5px 14px' }} color={statusColor}>
                Failed Transfer
              </Tag>
            );
          } else if (record.messageType === NftTransactionType.ISSUE_DENOM) {
            return (
              <Tag style={{ border: 'none', padding: '5px 14px' }} color={statusColor}>
                Failed Issue
              </Tag>
            );
          }
          return (
            <Tag style={{ border: 'none', padding: '5px 14px' }} color={statusColor}>
              Failed {record.messageType}
            </Tag>
          );
        }
      },
    },
    {
      title: t('home.transactions.table3.denomId'),
      dataIndex: 'denomId',
      key: 'denomId',
      render: text => <div data-original={text}>{text ? ellipsis(text, 12) : 'n.a.'}</div>,
    },
    {
      title: t('home.transactions.table3.tokenId'),
      // dataIndex: 'tokenId',
      key: 'tokenId',
      render: record => {
        const { tokenId, denomId } = record;
        return tokenId ? (
          <a
            data-original={tokenId}
            target="_blank"
            rel="noreferrer"
            href={`${renderExplorerUrl(
              currentSession.wallet.config,
              'nft',
            )}/nfts/tokens/${denomId}/${tokenId}`}
          >
            {ellipsis(tokenId, 12)}
          </a>
        ) : (
          <div data-original={tokenId}>n.a.</div>
        );
      },
    },
    {
      title: t('home.transactions.table3.recipientAddress'),
      dataIndex: 'recipientAddress',
      key: 'recipientAddress',
      render: text => {
        return text ? (
          <a
            data-original={text}
            target="_blank"
            rel="noreferrer"
            href={`${renderExplorerUrl(currentSession.wallet.config, 'address')}/${text}`}
          >
            {middleEllipsis(text, 12)}
          </a>
        ) : (
          <div data-original={text}>n.a.</div>
        );
      },
    },
    {
      title: t('home.transactions.table3.time'),
      dataIndex: 'time',
      key: 'time',
    },
  ];

  return (
    <Table
      locale={{
        triggerDesc: t('general.table.triggerDesc'),
        triggerAsc: t('general.table.triggerAsc'),
        cancelSort: t('general.table.cancelSort'),
      }}
      columns={NftTransactionColumns}
      dataSource={nftTransfers}
      rowKey={record => record.key}
    />
  );
};

export { CryptoOrgNFTTransactionList };
