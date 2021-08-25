import React, { useEffect, useState, useRef } from 'react';
import { Link, useHistory } from 'react-router-dom';
import './home.less';
import 'antd/dist/antd.css';
import { Button, Layout, notification, Table, Tabs, Tag, Card, List, Avatar } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import numeral from 'numeral';
import { useTranslation } from 'react-i18next';

import {
  hasShownWarningOnWalletTypeState,
  sessionState,
  marketState,
  walletAllAssetsState,
  nftListState,
  // isIbcVisibleState,
  navbarMenuSelectedKeyState,
  fetchingDBState,
} from '../../recoil/atom';
import { NOT_KNOWN_YET_VALUE, WalletConfig } from '../../config/StaticConfig';
import { getUIDynamicAmount } from '../../utils/NumberUtils';
import { middleEllipsis, isJson, ellipsis } from '../../utils/utils';
import {
  scaledBalance,
  scaledStakingBalance,
  getAssetBalancePrice,
  getAssetStakingBalancePrice,
  UserAsset,
} from '../../models/UserAsset';
// import { Session } from '../../models/Session';
import {
  NftModel,
  NftProcessedModel,
  // TransactionDirection,
  TransactionStatus,
  // TransferTransactionData,
  NftAccountTransactionData,
  NftTransactionType,
} from '../../models/Transaction';

import { walletService } from '../../service/WalletService';
import { AnalyticsService } from '../../service/analytics/AnalyticsService';

// import logoCro from '../../assets/AssetLogo/cro.png';
import IconTick from '../../svg/IconTick';
import nftThumbnail from '../../assets/nft-thumbnail.png';
import { Session } from '../../models/Session';
import PasswordFormModal from '../../components/PasswordForm/PasswordFormModal';
import { secretStoreService } from '../../storage/SecretStoreService';

const { ipcRenderer } = window.require('electron');

const { Header, Content, Footer } = Layout;
const { TabPane } = Tabs;
const { Meta } = Card;

const maxNftPreview = 5;

// interface TransferTabularData {
//   key: string;
//   transactionHash: string;
//   recipientAddress: string;
//   amount: string;
//   time: string;
//   direction: TransactionDirection;
//   status: TransactionStatus;
// }

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

// function convertTransfers(
//   allTransfers: TransferTransactionData[],
//   allAssets: UserAsset[],
//   sessionData: Session,
//   defaultWalletAsset: UserAsset,
// ) {
//   const { address } = sessionData.wallet;

//   function getDirection(from: string, to: string): TransactionDirection {
//     if (address === from && address === to) {
//       return TransactionDirection.SELF;
//     }
//     if (address === from) {
//       return TransactionDirection.OUTGOING;
//     }
//     return TransactionDirection.INCOMING;
//   }

//   return allTransfers.map(transfer => {
//     const transferAmount = getUIDynamicAmount(transfer.amount, defaultWalletAsset);
//     const data: TransferTabularData = {
//       key: transfer.hash + transfer.receiverAddress + transfer.amount,
//       recipientAddress: transfer.receiverAddress,
//       transactionHash: transfer.hash,
//       time: new Date(transfer.date).toLocaleString(),
//       amount: `${transferAmount} ${transfer.assetSymbol}`,
//       direction: getDirection(transfer.senderAddress, transfer.receiverAddress),
//       status: transfer.status,
//     };
//     return data;
//   });
// }

function convertNftTransfers(allTransfers: NftAccountTransactionData[]) {
  function getStatus(transfer: NftAccountTransactionData) {
    if (transfer.success) {
      return TransactionStatus.SUCCESS;
    }
    return TransactionStatus.FAILED;
  }
  function getType(transfer: NftAccountTransactionData) {
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
  }

  return allTransfers.map(transfer => {
    const data: NftTransferTabularData = {
      key:
        transfer.transactionHash +
        transfer.data.recipient +
        transfer.data.denomId +
        transfer.data.tokenId,
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
}

const isWalletNotLive = (config: WalletConfig) => {
  return config.nodeUrl === NOT_KNOWN_YET_VALUE && config.indexingUrl === NOT_KNOWN_YET_VALUE;
};

const HomePage = () => {
  const [currentSession, setCurrentSession] = useRecoilState(sessionState);
  // const [transfers, setTransfers] = useState<TransferTabularData[]>([]);
  const [nftTransfers, setNftTransfers] = useState<NftTransferTabularData[]>([]);
  const [walletAllAssets, setWalletAllAssets] = useRecoilState(walletAllAssetsState);
  // const isIbcVisible = useRecoilValue(isIbcVisibleState);
  const setNavbarMenuSelectedKey = useSetRecoilState(navbarMenuSelectedKeyState);
  const setNFTList = useSetRecoilState(nftListState);
  const marketData = useRecoilValue(marketState);
  const [fetchingDB, setFetchingDB] = useRecoilState(fetchingDBState);
  const didMountRef = useRef(false);
  const history = useHistory();

  const [processedNftList, setProcessedNftList] = useState<NftProcessedModel[]>([]);

  const [hasShownNotLiveWallet, setHasShownNotLiveWallet] = useRecoilState(
    hasShownWarningOnWalletTypeState,
  );

  const [defaultWalletAsset, setdefaultWalletAsset] = useState<UserAsset>();

  const analyticsService = new AnalyticsService(currentSession);

  const [t] = useTranslation();

  const assetIcon = asset => {
    const { icon_url, symbol } = asset;

    return icon_url ? (
      <img src={icon_url} alt="cronos" className="asset-icon" />
    ) : (
      <Avatar>{symbol[0].toUpperCase()}</Avatar>
    );
  };

  const AssetColumns = [
    {
      title: t('home.assetList.table.name'),
      // dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: record => {
        const { name, symbol } = record;
        return (
          <div className="name">
            {assetIcon(record)}
            {name} ({symbol})
          </div>
        );
      },
    },
    {
      title: t('home.assetList.table.price'),
      // dataIndex: 'price',
      key: 'price',
      render: record => (
        <>
          {marketData && marketData.price && record.mainnetSymbol === marketData.assetSymbol
            ? `${numeral(marketData.price).format('$0,0.00')} ${marketData?.currency}`
            : '$--'}
        </>
      ),
    },
    {
      title: t('home.assetList.table.amount'),
      // dataIndex: 'amount',
      key: 'amount',
      render: (record: UserAsset) => {
        return (
          <>
            {getUIDynamicAmount(record.balance, record)} {record.symbol}
          </>
        );
      },
    },
    {
      title: t('home.assetList.table.value'),
      // dataIndex: 'value',
      key: 'value',
      render: record => {
        return (
          <>
            {marketData && marketData.price && record.mainnetSymbol === marketData.assetSymbol
              ? `${numeral(getAssetBalancePrice(record, marketData)).format('$0,0.00')} ${
                  marketData?.currency
                }`
              : '$--'}
          </>
        );
      },
    },
  ];

  // const TransactionColumns = [
  //   {
  //     title: t('home.transactions.table1.transactionHash'),
  //     dataIndex: 'transactionHash',
  //     key: 'transactionHash',
  //     render: text => (
  //       <a
  //         data-original={text}
  //         target="_blank"
  //         rel="noreferrer"
  //         href={`${currentSession.wallet.config.explorerUrl}/tx/${text}`}
  //       >
  //         {middleEllipsis(text, 12)}
  //       </a>
  //     ),
  //   },
  //   {
  //     title: t('home.transactions.table1.amount'),
  //     dataIndex: 'amount',
  //     key: 'amount',
  //     render: (text, record: TransferTabularData) => {
  //       const color = record.direction === TransactionDirection.OUTGOING ? 'danger' : 'success';
  //       const sign = record.direction === TransactionDirection.OUTGOING ? '-' : '+';
  //       return (
  //         <Text type={color}>
  //           {sign}
  //           {text}
  //         </Text>
  //       );
  //     },
  //   },
  //   {
  //     title: t('home.transactions.table1.recipientAddress'),
  //     dataIndex: 'recipientAddress',
  //     key: 'recipientAddress',
  //     render: text => (
  //       <a
  //         data-original={text}
  //         target="_blank"
  //         rel="noreferrer"
  //         href={`${currentSession.wallet.config.explorerUrl}/account/${text}`}
  //       >
  //         {middleEllipsis(text, 12)}
  //       </a>
  //     ),
  //   },
  //   {
  //     title: t('home.transactions.table1.time'),
  //     dataIndex: 'time',
  //     key: 'time',
  //   },
  //   {
  //     title: t('home.transactions.table1.status'),
  //     dataIndex: 'status',
  //     key: 'status',
  //     render: (text, record: TransferTabularData) => {
  //       // const color = record.direction === TransactionDirection.OUTGOING ? 'danger' : 'success';
  //       // const sign = record.direction === TransactionDirection.OUTGOING ? '-' : '+';
  //       let statusColor;
  //       if (record.status === TransactionStatus.SUCCESS) {
  //         statusColor = 'success';
  //       } else if (record.status === TransactionStatus.FAILED) {
  //         statusColor = 'error';
  //       } else {
  //         statusColor = 'processing';
  //       }

  //       return (
  //         <Tag style={{ border: 'none', padding: '5px 14px' }} color={statusColor}>
  //           {record.status.toString()}
  //         </Tag>
  //       );
  //     },
  //   },
  // ];

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
          href={`${currentSession.wallet.config.explorerUrl}/tx/${text}`}
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
      dataIndex: 'tokenId',
      key: 'tokenId',
      render: text => <div data-original={text}>{text ? ellipsis(text, 12) : 'n.a.'}</div>,
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
            href={`${currentSession.wallet.config.explorerUrl}/account/${text}`}
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

  const renderPreview = (_nft: NftProcessedModel) => {
    return (
      <img
        alt={_nft?.denomName}
        src={_nft?.tokenData.image ? _nft?.tokenData.image : nftThumbnail}
        onError={e => {
          (e.target as HTMLImageElement).src = nftThumbnail;
        }}
      />
    );
  };

  const renderNftTitle = (_nft: NftProcessedModel | undefined, length: number = 999) => {
    if (_nft?.tokenData && _nft?.tokenData.name) {
      return ellipsis(_nft?.tokenData.name, length);
    }
    if (_nft?.tokenData && _nft?.tokenData.drop) {
      return ellipsis(_nft?.tokenData.drop, length);
    }
    if (_nft) {
      return ellipsis(`${_nft?.denomId} - #${_nft?.tokenId}`, length);
    }
    return 'n.a.';
  };

  const showWalletStateNotification = (config: WalletConfig) => {
    setTimeout(async () => {
      if (isWalletNotLive(config) && !hasShownNotLiveWallet) {
        notification.warning({
          message: t('home.notification.walletInfo.message'),
          description: `${t('home.notification.walletInfo.description1')} ${config.name} ${t(
            'home.notification.walletInfo.description2',
          )}`,
          placement: 'topRight',
          duration: 0,
        });
      }
    }, 200);
  };

  const [inputPasswordVisible, setInputPasswordVisible] = useState<boolean>(false);

  const onWalletDecryptFinish = async (password: string) => {
    setFetchingDB(true);
    setInputPasswordVisible(false);
    const phraseDecrypted = await secretStoreService.decryptPhrase(
      password,
      currentSession.wallet.identifier,
    );

    await walletService.handleCurrentWalletAssetsMigration(phraseDecrypted, currentSession);
    setFetchingDB(false);
  };

  const showPasswordInput = () => {
    setInputPasswordVisible(true);
  };

  const checkNewlyAddedStaticAssets = (session: Session) => {
    setTimeout(async () => {
      if (await walletService.checkIfWalletNeedAssetCreation(session)) {
        const newAssetAddedNotificationKey = 'newAssetAddedNotificationKey';

        const createNewlyAddedAssets = (
          <Button
            type="primary"
            size="small"
            className="btn-restart"
            onClick={() => {
              showPasswordInput();
              notification.close(newAssetAddedNotificationKey);
            }}
            style={{ height: '30px', margin: '0px', lineHeight: 1.0 }}
          >
            Enable
          </Button>
        );

        notification.info({
          message: 'New Assets Available',
          description: 'Do you want to enable the newly added assets ?',
          duration: 15,
          key: newAssetAddedNotificationKey,
          placement: 'topRight',
          btn: createNewlyAddedAssets,
        });
      }
    }, 12_000);
  };

  const onSyncAndRefreshBtnCall = async () => {
    setFetchingDB(true);

    await walletService.syncAll();
    const sessionData = await walletService.retrieveCurrentSession();
    // const currentAsset = await walletService.retrieveDefaultWalletAsset(sessionData);
    const allAssets = await walletService.retrieveCurrentWalletAssets(sessionData);
    await walletService.IBCAssetsFetch(sessionData);

    // const allTransfers: TransferTransactionData[] = await walletService.retrieveAllTransfers(
    //   sessionData.wallet.identifier,
    //   defaultWalletAsset,
    // );

    const allNftTransfer: NftAccountTransactionData[] = await walletService.getAllNFTAccountTxs(
      sessionData,
    );

    // const transferTabularData = defaultWalletAsset
    //   ? convertTransfers(allTransfers, allAssets, sessionData, defaultWalletAsset)
    //   : [];
    const nftTransferTabularData = convertNftTransfers(allNftTransfer);

    showWalletStateNotification(currentSession.wallet.config);

    // setTransfers(transferTabularData);
    setNftTransfers(nftTransferTabularData);
    // setUserAsset(currentAsset);
    setWalletAllAssets(allAssets);
    setHasShownNotLiveWallet(true);

    await walletService.fetchAndSaveNFTs(sessionData);
    setFetchingDB(false);
  };

  const processNftList = (currentList: NftModel[] | undefined) => {
    if (currentList) {
      return currentList.slice(0, maxNftPreview).map(item => {
        const denomSchema = isJson(item.denomSchema)
          ? JSON.parse(item.denomSchema)
          : item.denomSchema;
        const tokenData = isJson(item.tokenData) ? JSON.parse(item.tokenData) : item.tokenData;
        const nftModel: NftProcessedModel = {
          ...item,
          denomSchema,
          tokenData,
        };
        return nftModel;
      });
    }
    return [];
  };

  function listenToNewVersionUpdates() {
    ipcRenderer.on('update_available', () => {
      ipcRenderer.removeAllListeners('update_available');

      const newVersionNotificationKey = `open-update_available`;

      notification.info({
        message: t('home.notification.updateAvailable.message'),
        description: t('home.notification.updateAvailable.description'),
        duration: 10,
        key: newVersionNotificationKey,
        placement: 'topRight',
      });
    });
  }

  function listenToUpdatesDownloaded() {
    ipcRenderer.on('update_downloaded', () => {
      ipcRenderer.removeAllListeners('update_downloaded');

      const newVersionNotificationKey = `open-update_downloaded`;

      const restartBtn = (
        <Button
          type="primary"
          size="small"
          className="btn-restart"
          onClick={() => {
            ipcRenderer.send('restart_app');
            notification.close(newVersionNotificationKey);
          }}
          style={{ height: '30px', margin: '0px', lineHeight: 1.0 }}
        >
          {t('home.notification.downloadComplete.button')}
        </Button>
      );

      notification.success({
        message: t('home.notification.downloadComplete.message'),
        description: t('home.notification.downloadComplete.description'),
        duration: 20,
        key: newVersionNotificationKey,
        placement: 'topRight',
        btn: restartBtn,
      });
    });
  }

  useEffect(() => {
    const syncAssetData = async () => {
      const sessionData = await walletService.retrieveCurrentSession();
      const currentAsset = await walletService.retrieveDefaultWalletAsset(sessionData);
      const allAssets = await walletService.retrieveCurrentWalletAssets(sessionData);

      const allNftTransfer: NftAccountTransactionData[] = await walletService.getAllNFTAccountTxs(
        sessionData,
      );

      const allNFTs: NftModel[] = await walletService.retrieveNFTs(sessionData.wallet.identifier);
      const currentNftList = processNftList(allNFTs);
      setProcessedNftList(currentNftList);
      setNFTList(allNFTs);

      setdefaultWalletAsset(currentAsset);

      const nftTransferTabularData = convertNftTransfers(allNftTransfer);

      showWalletStateNotification(sessionData.wallet.config);
      checkNewlyAddedStaticAssets(sessionData);

      // setTransfers(transferTabularData);
      setNftTransfers(nftTransferTabularData);
      // setUserAsset(currentAsset);
      setWalletAllAssets(allAssets);
      setHasShownNotLiveWallet(true);
    };

    syncAssetData();
    listenToNewVersionUpdates();
    listenToUpdatesDownloaded();

    if (!didMountRef.current) {
      didMountRef.current = true;
      analyticsService.logPage('Home');
    }
  }, [fetchingDB]);

  return (
    <Layout className="site-layout">
      <PasswordFormModal
        description={t('general.passwordFormModal.description')}
        okButtonText={t('general.passwordFormModal.okButton')}
        onCancel={() => {
          setInputPasswordVisible(false);
        }}
        onSuccess={onWalletDecryptFinish}
        onValidatePassword={async (password: string) => {
          const isValid = await secretStoreService.checkIfPasswordIsValid(password);
          return {
            valid: isValid,
            errMsg: !isValid ? t('general.passwordFormModal.error') : '',
          };
        }}
        successText={t('general.passwordFormModal.success')}
        title={t('general.passwordFormModal.title')}
        visible={inputPasswordVisible}
        successButtonText={t('general.continue')}
        confirmPassword={false}
        repeatValidation
      />

      <Header className="site-layout-background">
        {t('home.title')}
        <SyncOutlined
          onClick={() => {
            onSyncAndRefreshBtnCall();
          }}
          style={{ position: 'absolute', right: '36px', marginTop: '6px' }}
          spin={fetchingDB}
        />
      </Header>
      <Content>
        <div className="site-layout-background balance-container">
          {/* <div className="balance">
            <div className="title">TOTAL ASSET BALANCE</div>
            <div className="quantity">
              $
              {numeral(
                new Big(getAssetStakingBalancePrice(userAsset, marketData))
                  .add(new Big(getAssetBalancePrice(userAsset, marketData)))
                  .toFixed(4),
              ).format('0,0.00')}{' '}
              USD
            </div>
          </div> */}
          <div className="balance">
            <div className="title">CRO BALANCE</div>
            {defaultWalletAsset && (
              <div className="quantity">
                {numeral(scaledBalance(defaultWalletAsset)).format('0,0.0000')}{' '}
                {defaultWalletAsset?.symbol}
              </div>
            )}
            <div className="fiat">
              {defaultWalletAsset && marketData && marketData.price
                ? `${numeral(getAssetBalancePrice(defaultWalletAsset, marketData)).format(
                    '$0,0.00',
                  )} ${marketData?.currency}`
                : ''}
            </div>
          </div>
          <div className="balance">
            <div className="title">STAKED CRO BALANCE</div>
            {defaultWalletAsset && (
              <div className="quantity">
                {numeral(scaledStakingBalance(defaultWalletAsset)).format('0,0.0000')}{' '}
                {defaultWalletAsset?.symbol}
              </div>
            )}
            <div className="fiat">
              {defaultWalletAsset && marketData && marketData.price
                ? `${numeral(getAssetStakingBalancePrice(defaultWalletAsset, marketData)).format(
                    '$0,0.00',
                  )} ${marketData?.currency}
                  `
                : ''}
            </div>
          </div>
        </div>
        <Tabs defaultActiveKey="1">
          {/* <TabPane tab={t('home.transactions.tab1')} key="1">
            <Table
              locale={{
                triggerDesc: t('general.table.triggerDesc'),
                triggerAsc: t('general.table.triggerAsc'),
                cancelSort: t('general.table.cancelSort'),
              }}
              columns={TransactionColumns}
              dataSource={transfers}
              rowKey={record => record.key}
            />
          </TabPane> */}
          <TabPane tab={t('home.transactions.tab1')} key="1">
            <div className="site-layout-background asset-container">
              <Table
                columns={AssetColumns}
                dataSource={walletAllAssets}
                rowKey={record => record.identifier}
                className="asset-table"
                pagination={false}
                onRow={selectedAsset => {
                  return {
                    onClick: async () => {
                      setNavbarMenuSelectedKey('/send');
                      setFetchingDB(true);
                      setCurrentSession({
                        ...currentSession,
                        activeAsset: selectedAsset,
                      });
                      await walletService.setCurrentSession({
                        ...currentSession,
                        activeAsset: selectedAsset,
                      });
                      history.push({
                        pathname: '/send',
                        state: {
                          from: '/home',
                        },
                      });
                    }, // click row
                  };
                }}
              />
              <Link to="/send" className="all" onClick={() => setNavbarMenuSelectedKey('/send')}>
                {t('general.seeAll')}
              </Link>
            </div>
          </TabPane>
        </Tabs>
        <Tabs defaultActiveKey="1">
          <TabPane tab={t('home.nft.tab1')} key="1">
            <div className="site-layout-background nft-container">
              <List
                grid={{
                  gutter: 16,
                  xs: 1,
                  sm: 2,
                  md: 4,
                  lg: 5,
                  xl: 5,
                  xxl: 5,
                }}
                dataSource={processedNftList}
                renderItem={item => (
                  <List.Item>
                    <Card
                      style={{ width: 170 }}
                      cover={renderPreview(item)}
                      hoverable
                      className="nft"
                    >
                      <Meta
                        title={renderNftTitle(item)}
                        description={
                          <>
                            <Avatar
                              style={{
                                background:
                                  'linear-gradient(210.7deg, #1199FA -1.45%, #93D2FD 17.77%, #C1CDFE 35.71%, #EEC9FF 51.45%, #D4A9EA 67.2%, #41B0FF 85.98%)',
                                verticalAlign: 'middle',
                              }}
                            />
                            {middleEllipsis(item?.tokenMinter, 6)}{' '}
                            {item?.isMintedByCDC ? <IconTick style={{ height: '12px' }} /> : ''}
                          </>
                        }
                      />
                    </Card>
                  </List.Item>
                )}
                pagination={false}
              />
              <Link
                to="/nft"
                style={{ textAlign: 'right' }}
                onClick={() => setNavbarMenuSelectedKey('/nft')}
              >
                {t('general.seeAll')}
              </Link>
            </div>
          </TabPane>
          <TabPane tab={t('home.nft.tab2')} key="2">
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
          </TabPane>
        </Tabs>
      </Content>
      <Footer />
    </Layout>
  );
};

export default HomePage;
