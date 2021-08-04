import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import './home.less';
import 'antd/dist/antd.css';
import {
  Button,
  Form,
  Layout,
  notification,
  Table,
  Tabs,
  Tag,
  Typography,
  Card,
  List,
  Avatar,
} from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import numeral from 'numeral';
import { useTranslation } from 'react-i18next';

import {
  hasShownWarningOnWalletTypeState,
  sessionState,
  marketState,
  walletAssetState,
  nftListState,
  ledgerIsExpertModeState,
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
import { Session } from '../../models/Session';
import {
  BroadCastResult,
  NftModel,
  NftProcessedModel,
  StakingTransactionData,
  TransactionDirection,
  TransactionStatus,
  TransferTransactionData,
  NftAccountTransactionData,
  NftTransactionType,
} from '../../models/Transaction';

import { walletService } from '../../service/WalletService';
import { LEDGER_WALLET_TYPE, detectConditionsError } from '../../service/LedgerService';
import { AnalyticsService } from '../../service/analytics/AnalyticsService';
import { secretStoreService } from '../../storage/SecretStoreService';

import ModalPopup from '../../components/ModalPopup/ModalPopup';
import PasswordFormModal from '../../components/PasswordForm/PasswordFormModal';
import SuccessModalPopup from '../../components/SuccessModalPopup/SuccessModalPopup';
import ErrorModalPopup from '../../components/ErrorModalPopup/ErrorModalPopup';
import { UndelegateFormComponent } from './components/UndelegateFormComponent';
import RedelegateFormComponent from './components/RedelegateFormComponent';

import IconTick from '../../svg/IconTick';
import nftThumbnail from '../../assets/nft-thumbnail.png';

const { ipcRenderer } = window.require('electron');

const { Text } = Typography;

const { Header, Content, Footer } = Layout;
const { TabPane } = Tabs;
const { Meta } = Card;

const maxNftPreview = 5;

enum StakingActionType {
  UNDELEGATE = 'UNDELEGATE',
  REDELEGATE = 'REDELEGATE',
}

interface StakingTabularData {
  key: string;
  stakedAmountWithSymbol: string;
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

function convertDelegations(allDelegations: StakingTransactionData[], currentAsset: UserAsset) {
  return allDelegations
    .map(dlg => {
      const stakedAmount = getUIDynamicAmount(dlg.stakedAmount, currentAsset);
      const data: StakingTabularData = {
        key: dlg.validatorAddress + dlg.stakedAmount,
        delegatorAddress: dlg.delegatorAddress,
        validatorAddress: dlg.validatorAddress,
        stakedAmountWithSymbol: `${stakedAmount} ${currentAsset.symbol}`,
        stakedAmount,
      };
      return data;
    })
    .filter(dlg => Number(dlg.stakedAmount) > 0);
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
    const transferAmount = getUIDynamicAmount(transfer.amount, currentAsset);
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

function HomePage() {
  const currentSession = useRecoilValue(sessionState);
  const [delegations, setDelegations] = useState<StakingTabularData[]>([]);
  const [transfers, setTransfers] = useState<TransferTabularData[]>([]);
  const [nftTransfers, setNftTransfers] = useState<NftTransferTabularData[]>([]);
  const [userAsset, setUserAsset] = useRecoilState(walletAssetState);
  const setNFTList = useSetRecoilState(nftListState);
  const marketData = useRecoilValue(marketState);
  const [ledgerIsExpertMode, setLedgerIsExpertMode] = useRecoilState(ledgerIsExpertModeState);
  const [fetchingDB, setFetchingDB] = useRecoilState(fetchingDBState);
  const didMountRef = useRef(false);

  const [processedNftList, setProcessedNftList] = useState<NftProcessedModel[]>([]);

  // Undelegate action related states changes
  const [form] = Form.useForm();

  const [isConfirmationModalVisible, setIsVisibleConfirmationModal] = useState(false);
  const [isSuccessTransferModalVisible, setIsSuccessTransferModalVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [isErrorTransferModalVisible, setIsErrorTransferModalVisible] = useState(false);
  const [inputPasswordVisible, setInputPasswordVisible] = useState(false);

  const [hasShownNotLiveWallet, setHasShownNotLiveWallet] = useRecoilState(
    hasShownWarningOnWalletTypeState,
  );

  const [decryptedPhrase, setDecryptedPhrase] = useState('');
  const [broadcastResult, setBroadcastResult] = useState<BroadCastResult>({});
  const [errorMessages, setErrorMessages] = useState([]);

  const [undelegateFormValues, setUndelegateFormValues] = useState({
    validatorAddress: '',
    undelegateAmount: '',
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [redelegateFormValues, setRedelegateFormValues] = useState({
    validatorOriginAddress: '',
    validatorDestinationAddress: '',
    redelegateAmount: '',
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [delegationActionType, setDelegationActionType] = useState<StakingActionType>();

  const analyticsService = new AnalyticsService(currentSession);

  const [t] = useTranslation();

  const TransactionColumns = [
    {
      title: t('home.transactions.table1.transactionHash'),
      dataIndex: 'transactionHash',
      key: 'transactionHash',
      render: text => (
        <a
          data-original={text}
          target="_blank"
          rel="noreferrer"
          href={`${currentSession.wallet.config.explorerUrl}/tx/${text}`}
        >
          {middleEllipsis(text, 12)}
        </a>
      ),
    },
    {
      title: t('home.transactions.table1.amount'),
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
      title: t('home.transactions.table1.recipientAddress'),
      dataIndex: 'recipientAddress',
      key: 'recipientAddress',
      render: text => (
        <a
          data-original={text}
          target="_blank"
          rel="noreferrer"
          href={`${currentSession.wallet.config.explorerUrl}/account/${text}`}
        >
          {middleEllipsis(text, 12)}
        </a>
      ),
    },
    {
      title: t('home.transactions.table1.time'),
      dataIndex: 'time',
      key: 'time',
    },
    {
      title: t('home.transactions.table1.status'),
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

        return (
          <Tag style={{ border: 'none', padding: '5px 14px' }} color={statusColor}>
            {record.status.toString()}
          </Tag>
        );
      },
    },
  ];

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

  const onSyncAndRefreshBtnCall = async () => {
    setFetchingDB(true);

    await walletService.syncAll();
    const sessionData = await walletService.retrieveCurrentSession();
    const currentAsset = await walletService.retrieveDefaultWalletAsset(sessionData);
    const allDelegations: StakingTransactionData[] = await walletService.retrieveAllDelegations(
      sessionData.wallet.identifier,
    );
    const allTransfers: TransferTransactionData[] = await walletService.retrieveAllTransfers(
      sessionData.wallet.identifier,
    );

    const allNftTransfer: NftAccountTransactionData[] = await walletService.getAllNFTAccountTxs(
      sessionData,
    );

    const stakingTabularData = convertDelegations(allDelegations, currentAsset);
    const transferTabularData = convertTransfers(allTransfers, currentAsset, sessionData);
    const nftTransferTabularData = convertNftTransfers(allNftTransfer);

    showWalletStateNotification(currentSession.wallet.config);

    setDelegations(stakingTabularData);
    setTransfers(transferTabularData);
    setNftTransfers(nftTransferTabularData);
    setUserAsset(currentAsset);
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
      const allDelegations: StakingTransactionData[] = await walletService.retrieveAllDelegations(
        sessionData.wallet.identifier,
      );
      const allTransfers: TransferTransactionData[] = await walletService.retrieveAllTransfers(
        sessionData.wallet.identifier,
      );

      const allNftTransfer: NftAccountTransactionData[] = await walletService.getAllNFTAccountTxs(
        sessionData,
      );

      const allNFTs: NftModel[] = await walletService.retrieveNFTs(sessionData.wallet.identifier);
      const currentNftList = processNftList(allNFTs);
      setProcessedNftList(currentNftList);
      setNFTList(allNFTs);

      const stakingTabularData = convertDelegations(allDelegations, currentAsset);
      const transferTabularData = convertTransfers(allTransfers, currentAsset, sessionData);
      const nftTransferTabularData = convertNftTransfers(allNftTransfer);

      showWalletStateNotification(currentSession.wallet.config);
      setDelegations(stakingTabularData);
      setTransfers(transferTabularData);
      setNftTransfers(nftTransferTabularData);
      setUserAsset(currentAsset);
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

  const showConfirmationModal = () => {
    setInputPasswordVisible(false);
    setIsVisibleConfirmationModal(true);
  };

  const onWalletDecryptFinish = async (password: string) => {
    const phraseDecrypted = await secretStoreService.decryptPhrase(
      password,
      currentSession.wallet.identifier,
    );
    setDecryptedPhrase(phraseDecrypted);
    showConfirmationModal();
  };

  const showPasswordInput = () => {
    if (decryptedPhrase || currentSession.wallet.walletType === LEDGER_WALLET_TYPE) {
      showConfirmationModal();
    } else {
      setInputPasswordVisible(true);
    }
  };

  const handleCancelConfirmationModal = () => {
    setIsVisibleConfirmationModal(false);
    setInputPasswordVisible(false);
  };

  const closeSuccessModal = () => {
    setIsSuccessTransferModalVisible(false);
    setInputPasswordVisible(false);
  };

  const closeErrorModal = () => {
    setIsErrorTransferModalVisible(false);
    setInputPasswordVisible(false);
  };

  const onConfirmDelegationAction = async () => {
    const { walletType } = currentSession.wallet;

    if (!decryptedPhrase && walletType !== LEDGER_WALLET_TYPE) {
      return;
    }
    try {
      setConfirmLoading(true);

      // TODO : Here switch between undelegation and redelegation
      let broadcastedTransaction: BroadCastResult | null = null;

      if (delegationActionType === StakingActionType.UNDELEGATE) {
        const undelegateAmount = form.getFieldValue('undelegateAmount');
        broadcastedTransaction = await walletService.sendUnDelegateTransaction({
          validatorAddress: undelegateFormValues.validatorAddress,
          amount: undelegateAmount,
          asset: userAsset,
          memo: '',
          decryptedPhrase,
          walletType,
        });
      } else if (delegationActionType === StakingActionType.REDELEGATE) {
        const redelegateAmount = form.getFieldValue('redelegateAmount');
        const validatorDesAddress = form.getFieldValue('validatorDestinationAddress');
        broadcastedTransaction = await walletService.sendReDelegateTransaction({
          validatorSourceAddress: redelegateFormValues.validatorOriginAddress,
          validatorDestinationAddress: validatorDesAddress,
          amount: redelegateAmount,
          asset: userAsset,
          memo: '',
          decryptedPhrase,
          walletType,
        });
      } else {
        return;
      }

      const allDelegations: StakingTransactionData[] = await walletService.retrieveAllDelegations(
        currentSession.wallet.identifier,
      );

      const delegationTabularData = convertDelegations(allDelegations, userAsset);
      setDelegations(delegationTabularData);

      setBroadcastResult(broadcastedTransaction);

      setIsVisibleConfirmationModal(false);
      setConfirmLoading(false);
      setIsSuccessTransferModalVisible(true);
      const currentWalletAsset = await walletService.retrieveDefaultWalletAsset(currentSession);
      setUserAsset(currentWalletAsset);
      setInputPasswordVisible(false);

      // Reset values
      form.resetFields();

      if (delegationActionType === StakingActionType.UNDELEGATE) {
        setUndelegateFormValues({
          validatorAddress: '',
          undelegateAmount: '',
        });
      } else if (delegationActionType === StakingActionType.REDELEGATE) {
        setRedelegateFormValues({
          redelegateAmount: '',
          validatorDestinationAddress: '',
          validatorOriginAddress: '',
        });
      }
    } catch (e) {
      if (walletType === LEDGER_WALLET_TYPE) {
        setLedgerIsExpertMode(detectConditionsError(e.toString()));
      }

      setErrorMessages(e.message.split(': '));
      setIsVisibleConfirmationModal(false);
      setConfirmLoading(false);
      setInputPasswordVisible(false);
      setIsErrorTransferModalVisible(true);
    }
  };

  const onDelegationCellsClicked = e => {
    const eventData = JSON.parse(e.currentTarget.dataset.id);
    const { validatorAddress, stakedAmount, actionType } = eventData;
    const newStakingAction: StakingActionType = StakingActionType[actionType];
    setDelegationActionType(newStakingAction);

    if (newStakingAction === StakingActionType.UNDELEGATE) {
      setUndelegateFormValues({
        validatorAddress,
        undelegateAmount: stakedAmount,
      });
    } else if (newStakingAction === StakingActionType.REDELEGATE) {
      setRedelegateFormValues({
        redelegateAmount: stakedAmount,
        validatorOriginAddress: validatorAddress,
        validatorDestinationAddress: '',
      });
    }

    showPasswordInput();
  };

  const StakingColumns = [
    {
      title: t('home.transactions.table2.validatorAddress'),
      dataIndex: 'validatorAddress',
      key: 'validatorAddress',
      render: text => (
        <a
          target="_blank"
          rel="noreferrer"
          href={`${currentSession.wallet.config.explorerUrl}/validator/${text}`}
        >
          {middleEllipsis(text, 8)}
        </a>
      ),
    },
    {
      title: t('home.transactions.table2.stakedAmountWithSymbol'),
      dataIndex: 'stakedAmountWithSymbol',
      key: 'stakedAmountWithSymbol',
    },
    {
      title: t('home.transactions.table2.delegatorAddress'),
      dataIndex: 'delegatorAddress',
      key: 'delegatorAddress',
      render: text => (
        <a
          data-original={text}
          target="_blank"
          rel="noreferrer"
          href={`${currentSession.wallet.config.explorerUrl}/account/${text}`}
        >
          {middleEllipsis(text, 8)}
        </a>
      ),
    },
    {
      title: t('home.transactions.table2.undelegateAction'),
      dataIndex: 'undelegateAction',
      key: 'undelegateAction',
      render: (text, record: StakingTabularData) => {
        const clickData = {
          ...record,
          actionType: StakingActionType.UNDELEGATE,
        };
        return (
          <a data-id={JSON.stringify(clickData)} onClick={onDelegationCellsClicked}>
            <Text type="danger">{t('home.transactions.table2.action1')}</Text>
          </a>
        );
      },
    },
    {
      title: t('home.transactions.table2.redelegateAction'),
      dataIndex: 'redelegate',
      key: 'redelegateAction',
      render: (text, record: StakingTabularData) => {
        const clickData = {
          ...record,
          actionType: StakingActionType.REDELEGATE,
        };
        return (
          <a data-id={JSON.stringify(clickData)} onClick={onDelegationCellsClicked}>
            <Text type="success">{t('home.transactions.table2.action2')}</Text>
          </a>
        );
      },
    },
  ];

  return (
    <Layout className="site-layout">
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
          <div className="balance">
            <div className="title">{t('home.balance.title1')}</div>
            <div className="quantity">
              {numeral(scaledBalance(userAsset)).format('0,0.0000')} {userAsset?.symbol}
            </div>
            <div className="fiat">
              {marketData && marketData.price
                ? `${numeral(getAssetBalancePrice(userAsset, marketData)).format('$0,0.00')} ${
                    marketData?.currency
                  }`
                : ''}
            </div>
          </div>
          <div className="balance">
            <div className="title">{t('home.balance.title2')}</div>
            <div className="quantity">
              {numeral(scaledStakingBalance(userAsset)).format('0,0.0000')} {userAsset?.symbol}
            </div>
            <div className="fiat">
              {marketData && marketData.price
                ? `${numeral(getAssetStakingBalancePrice(userAsset, marketData)).format(
                    '$0,0.00',
                  )} ${marketData?.currency}`
                : ''}
            </div>
          </div>
        </div>
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
              <Link to="/nft" style={{ textAlign: 'right' }}>
                {t('home.nft.seeAll')}
              </Link>
            </div>
          </TabPane>
        </Tabs>
        <Tabs defaultActiveKey="1">
          <TabPane tab={t('home.transactions.tab1')} key="1">
            <Table
              locale={{
                triggerDesc: t('general.table.triggerDesc'),
                triggerAsc: t('general.table.triggerAsc'),
                cancelSort: t('general.table.cancelSort'),
              }}
              columns={TransactionColumns}
              dataSource={transfers}
            />
          </TabPane>
          <TabPane tab={t('home.transactions.tab2')} key="2">
            <Table
              locale={{
                triggerDesc: t('general.table.triggerDesc'),
                triggerAsc: t('general.table.triggerAsc'),
                cancelSort: t('general.table.cancelSort'),
              }}
              columns={StakingColumns}
              dataSource={delegations}
            />
          </TabPane>
          <TabPane tab={t('home.transactions.tab3')} key="3">
            <Table
              locale={{
                triggerDesc: t('general.table.triggerDesc'),
                triggerAsc: t('general.table.triggerAsc'),
                cancelSort: t('general.table.cancelSort'),
              }}
              columns={NftTransactionColumns}
              dataSource={nftTransfers}
            />
          </TabPane>
        </Tabs>
        <div>
          <ModalPopup
            isModalVisible={isConfirmationModalVisible}
            handleCancel={handleCancelConfirmationModal}
            handleOk={onConfirmDelegationAction}
            confirmationLoading={confirmLoading}
            footer={[
              <Button
                key="submit"
                type="primary"
                loading={confirmLoading}
                onClick={onConfirmDelegationAction}
              >
                {t('general.confirm')}
              </Button>,
              <Button key="back" type="link" onClick={handleCancelConfirmationModal}>
                {t('general.cancel')}
              </Button>,
            ]}
            okText={t('general.confirm')}
          >
            {delegationActionType === StakingActionType.UNDELEGATE ? (
              <UndelegateFormComponent
                currentSession={currentSession}
                undelegateFormValues={undelegateFormValues}
                form={form}
              />
            ) : (
              <RedelegateFormComponent
                currentSession={currentSession}
                redelegateFormValues={redelegateFormValues}
                walletAsset={userAsset}
                form={form}
              />
            )}
          </ModalPopup>
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
          />

          <SuccessModalPopup
            isModalVisible={isSuccessTransferModalVisible}
            handleCancel={closeSuccessModal}
            handleOk={closeSuccessModal}
            title={t('general.successModalPopup.title')}
            button={null}
            footer={[
              <Button key="submit" type="primary" onClick={closeSuccessModal}>
                {t('general.ok')}
              </Button>,
            ]}
          >
            <>
              {broadcastResult?.code !== undefined &&
              broadcastResult?.code !== null &&
              broadcastResult.code === walletService.BROADCAST_TIMEOUT_CODE ? (
                <div className="description">
                  {t('general.successModalPopup.timeout.description')}
                </div>
              ) : (
                <div className="description">
                  {delegationActionType === StakingActionType.UNDELEGATE
                    ? t('general.successModalPopup.undelegation.description')
                    : t('general.successModalPopup.redelegation.description')}
                </div>
              )}
            </>
          </SuccessModalPopup>
          <ErrorModalPopup
            isModalVisible={isErrorTransferModalVisible}
            handleCancel={closeErrorModal}
            handleOk={closeErrorModal}
            title={t('general.errorModalPopup.title')}
            footer={[]}
          >
            <>
              <div className="description">
                {delegationActionType === StakingActionType.UNDELEGATE
                  ? t('general.errorModalPopup.undelegation.description')
                  : t('general.errorModalPopup.redelegation.description')}
                <br />
                {errorMessages
                  .filter((item, idx) => {
                    return errorMessages.indexOf(item) === idx;
                  })
                  .map((err, idx) => (
                    <div key={idx}>- {err}</div>
                  ))}
                {ledgerIsExpertMode ? (
                  <div>{t('general.errorModalPopup.ledgerExportMode')}</div>
                ) : (
                  ''
                )}
              </div>
            </>
          </ErrorModalPopup>
        </div>
      </Content>
      <Footer />
    </Layout>
  );
}

export default HomePage;
