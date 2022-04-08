import { Table } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRecoilValue } from 'recoil';
import { useCronosEvmAsset } from '../../../../hooks/useCronosEvmAsset';
import { renderExplorerUrl } from '../../../../models/Explorer';
import { sessionState } from '../../../../recoil/atom';
import { nftTxsResponseTxModel } from '../../../../service/rpc/indexing/nft/cronos/CronosNftIndexingModels';
import { walletService } from '../../../../service/WalletService';
import { ellipsis, middleEllipsis } from '../../../../utils/utils';

const CronosNFTTransactionList = () => {
  const [nftTransfers, setNftTransfers] = useState<nftTxsResponseTxModel[]>([]);
  const [t] = useTranslation();
  const currentSession = useRecoilValue(sessionState);
  const cronosAsset = useCronosEvmAsset();

  useEffect(() => {
    const fetchNftTransfers = async () => {
      const txs = await walletService.retrieveCronosNFTTxs();
      setNftTransfers(txs);
    };

    fetchNftTransfers();
  }, []);

  const NftTransactionColumns: ColumnsType<nftTxsResponseTxModel> = [
    {
      title: t('home.transactions.table3.transactionHash'),
      render: (tx: nftTxsResponseTxModel) => {
        const text = tx.tx_hash;
        return (
          <a
            data-original={text}
            target="_blank"
            rel="noreferrer"
            href={`${renderExplorerUrl(cronosAsset?.config, 'tx')}/${text}`}
          >
            {middleEllipsis(text, 6)}
          </a>
        );
      },
    },
    {
      title: t('Token Name'),
      key: 'tokenId',
      render: (tx: nftTxsResponseTxModel) => {
        const text = tx.token_name;
        return <div data-original={text}>{text ? ellipsis(text, 12) : 'n.a.'}</div>;
      },
    },
    {
      title: t('home.transactions.table3.tokenId'),
      key: 'tokenId',
      render: (tx: nftTxsResponseTxModel) => {
        const text = tx.event_detail.token_id;
        return <div data-original={text}>{text ? ellipsis(text, 12) : 'n.a.'}</div>;
      },
    },
    {
      title: t('home.transactions.table3.recipientAddress'),
      render: (tx: nftTxsResponseTxModel) => {
        const text = tx.event_detail.to;

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
      render: text => {
        return new Date(Number(text) * 1000).toLocaleString();
      },
    },
  ];

  return (
    <Table<nftTxsResponseTxModel>
      locale={{
        triggerDesc: t('general.table.triggerDesc'),
        triggerAsc: t('general.table.triggerAsc'),
        cancelSort: t('general.table.cancelSort'),
      }}
      columns={NftTransactionColumns}
      dataSource={nftTransfers}
      rowKey={record => record.tx_hash}
    />
  );
};

export { CronosNFTTransactionList };
