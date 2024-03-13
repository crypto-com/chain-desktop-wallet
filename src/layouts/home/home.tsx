import React, { useEffect, useRef, useState } from 'react';
import './home.less';
import 'antd/dist/antd.css';
import {
  Alert,
  Button,
  Checkbox,
  Dropdown,
  Form,
  Input,
  Layout,
  Menu,
  notification,
  Spin,
} from 'antd';
import { Link, useHistory, useLocation } from 'react-router-dom';
import Icon, {
  CaretDownOutlined,
  DeleteOutlined,
  LoadingOutlined,
  PlusOutlined,
  ReloadOutlined,
  BankOutlined,
  SettingOutlined,
  LockFilled,
} from '@ant-design/icons';
import { useRecoilCallback, useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { useTranslation } from 'react-i18next';

import {
  sessionState,
  walletAssetState,
  walletAllAssetsState,
  walletListState,
  marketState,
  allMarketState,
  validatorListState,
  fetchingDBState,
  nftListState,
  isIbcVisibleState,
  navbarMenuSelectedKeyState,
  pageLockState,
  NavbarMenuKey,
  updateDownloadedState,
} from '../../recoil/atom';
import { ellipsis, checkIfTestnet, getCronosEvmAsset, getEthereumEvmAsset, getCronosTendermintAsset } from '../../utils/utils';
import WalletIcon from '../../assets/icon-wallet-grey.svg';
import IconHome from '../../svg/IconHome';
// import IconSend from '../../svg/IconSend';
// import IconReceive from '../../svg/IconReceive';
import IconAssets from '../../svg/IconAssets';
import IconStaking from '../../svg/IconStaking';
import IconNft from '../../svg/IconNft';
import IconCronos from '../../svg/IconCronos';
import IconDApp from '../../svg/IconDApp';
import IconWallet from '../../svg/IconWallet';
import ModalPopup from '../../components/ModalPopup/ModalPopup';
import SuccessModalPopup from '../../components/SuccessModalPopup/SuccessModalPopup';
import { walletService } from '../../service/WalletService';
import { Session } from '../../models/Session';
// eslint-disable-next-line
import { SettingsDataUpdate } from '../../models/Wallet';
import packageJson from '../../../package.json';
import {
  LEDGER_WALLET_TYPE,
} from '../../service/LedgerService';
import {
  LedgerWalletMaximum,
  LOADING_TIMEOUT,
  MAX_INCORRECT_ATTEMPTS_ALLOWED,
  SHOW_WARNING_INCORRECT_ATTEMPTS,
  SupportedChainName,
  ThemeColor,
} from '../../config/StaticConfig';
import { generalConfigService } from '../../service/storage/GeneralConfigService';
import PasswordFormModal from '../../components/PasswordForm/PasswordFormModal';
import { secretStoreService } from '../../service/storage/SecretStoreService';
import SessionLockModal from '../../components/PasswordForm/SessionLockModal';
import { getAssetBalancePrice, UserAsset, UserAssetType } from '../../models/UserAsset';
import { BridgeService } from '../../service/bridge/BridgeService';
import {
  DefaultMainnetBridgeConfigs,
  DefaultTestnetBridgeConfigs,
} from '../../service/bridge/BridgeConfig';
import { CRONOS_TENDERMINT_ASSET, ETH_ASSET, GOERLI_ETHEREUM_EXPLORER_URL, MainNetEvmConfig, MAINNET_ETHEREUM_EXPLORER_URL, TestNetEvmConfig } from '../../config/StaticAssets';
import { walletConnectStateAtom } from '../../service/walletconnect/store';
import { WalletConnectModal } from '../../pages/walletconnect/components/WalletConnectModal';
import IconWalletConnect from '../../svg/IconWalletConnect';
import IntercomCustomerService from '../../pages/customer-service';
import numeral from 'numeral';

// import i18n from '../../language/I18n';

const { ipcRenderer } = window.require('electron');

interface HomeLayoutProps {
  children?: React.ReactNode;
}

const { Sider } = Layout;

const allPaths: NavbarMenuKey[] = [
  '/home',
  '/staking',
  // '/send',
  // '/receive',
  '/assets',
  '/bridge',
  '/dapp',
  '/governance',
  '/nft',
  '/settings',
  '/wallet',
];

function HomeLayout(props: HomeLayoutProps) {
  const history = useHistory();
  const [confirmDeleteForm] = Form.useForm();
  const [deleteWalletAddress, setDeleteWalletAddress] = useState('');
  const [hasWallet, setHasWallet] = useState(true); // Default as true. useEffect will only re-render if result of hasWalletBeenCreated === false
  const [session, setSession] = useRecoilState(sessionState);
  const [userAsset, setUserAsset] = useRecoilState(walletAssetState);
  const [walletAllAssets, setWalletAllAssets] = useRecoilState(walletAllAssetsState);
  const [walletList, setWalletList] = useRecoilState(walletListState);
  const [marketData, setMarketData] = useRecoilState(marketState);
  const [allMarketData, setAllMarketData] = useRecoilState(allMarketState);
  const [validatorList, setValidatorList] = useRecoilState(validatorListState);
  const [nftList, setNftList] = useRecoilState(nftListState);
  const [navbarMenuSelectedKey, setNavbarMenuSelectedKey] = useRecoilState(
    navbarMenuSelectedKeyState,
  );
  const [pageLock, setPageLock] = useRecoilState(pageLockState);
  const [fetchingDB, setFetchingDB] = useRecoilState(fetchingDBState);
  const setIsIbcVisible = useSetRecoilState(isIbcVisibleState);
  const updatedDownloaded = useRecoilValue(updateDownloadedState);

  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [isConfirmDeleteVisible, setIsConfirmDeleteVisible] = useState(false);
  const [isConfirmationModalVisible, setIsConfirmationModalVisible] = useState(false);
  const [isSuccessDeleteModalVisible, setIsSuccessDeleteModalVisible] = useState(false);

  const [isAnnouncementVisible, setIsAnnouncementVisible] = useState(false);
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [menuToBeSelectedKey, setMenuToBeSelectedKey] = useState('');

  const [
    isLedgerCreateAssetSuccessModalVisible,
    setIsLedgerCreateAssetSuccessModalVisible,
  ] = useState(false);

  const didMountRef = useRef(false);
  const currentLocationPath = useLocation().pathname;

  const [t] = useTranslation();

  const callBackFetchingDB = useRecoilCallback(({ snapshot }) => async () => {
    const fetchingDB = await snapshot.getPromise(fetchingDBState);
    // Avoid infinite loading spin
    if(fetchingDB) {
      setTimeout(() => {
        setFetchingDB(false);
      }, LOADING_TIMEOUT);
    }
  }, [fetchingDB]);

  async function fetchAndSetNewValidators(currentSession) {
    try {
      await walletService.fetchAndSaveValidators(currentSession);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('Failed loading new wallet validators list', e);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function fetchAndSaveIBCWalletAssets(fetchSession: Session) {
    // lgtm [js/unused-local-variable]
    try {
      await walletService.fetchIBCAssets(fetchSession);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('Failed loading new wallet validators list', e);
    }
  }

  async function fetchAndSetNewProposals(currentSession) {
    try {
      await walletService.fetchAndSaveProposals(currentSession);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('Failed loading new wallet proposals', e);
    }
  }

  async function fetchAndSetNFTs(currentSession) {
    try {
      await walletService.fetchAndSaveNFTs(currentSession);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('Failed loading new wallet NFTs', e);
    }
  }

  const onWalletDeleteFinish = async () => {
    setIsButtonLoading(true);
    setFetchingDB(true);

    if (!session) {
      return;
    }
    await walletService.deleteWallet(session.wallet.identifier);

    // Switch to existing default wallet
    const allWalletsData = await walletService.retrieveAllWallets();
    setWalletList(allWalletsData);
    await walletService.setCurrentSession(new Session(allWalletsData[0]));
    const currentSession = await walletService.retrieveCurrentSession();
    const currentAsset = await walletService.retrieveDefaultWalletAsset(currentSession);
    const allAssets = await walletService.retrieveCurrentWalletAssets(currentSession);
    // const isIbcVisible = allAssets.length > 1;
    const isIbcVisible = false;

    setSession({
      ...currentSession,
      activeAsset: currentAsset,
    });
    setUserAsset(currentAsset);
    setWalletAllAssets(allAssets);
    setIsIbcVisible(isIbcVisible);
    walletService.syncAll(currentSession);

    setIsButtonLoading(false);
    setIsConfirmationModalVisible(false);
    setIsSuccessDeleteModalVisible(true);
    setFetchingDB(false);
    setIsButtonDisabled(true);
    setIsConfirmDeleteVisible(false);
    confirmDeleteForm.resetFields();
  };

  const handleCancel = () => {
    if (!isButtonLoading) {
      setIsConfirmationModalVisible(false);
      setIsConfirmDeleteVisible(false);
      setIsButtonDisabled(true);
      setIsConfirmDeleteVisible(false);
      confirmDeleteForm.resetFields();
    }
  };

  const showPasswordModal = () => {
    setIsConfirmationModalVisible(false);
  };

  const [inputPasswordVisible, setInputPasswordVisible] = useState<boolean>(false);
  const [isSessionLockModalVisible, setIsSessionLockModalVisible] = useState<boolean>(false);

  // const checkNewlyAddedStaticAssets = (walletSession?: Session) => {
  //   if (!walletSession || !walletSession.wallet) {
  //     return;
  //   }

  //   setTimeout(async () => {
  //     if (await walletService.checkIfWalletNeedAssetCreation(walletSession)) {
  //       const newAssetAddedNotificationKey = 'newAssetAddedNotificationKey';

  //       const createNewlyAddedAssets = (
  //         <Button
  //           type="primary"
  //           size="small"
  //           className="btn-restart"
  //           onClick={() => {
  //             setNavbarMenuSelectedKey('/assets');
  //             setTimeout(() => {
  //               history.push('/assets');
  //             }, 100);
  //             notification.close(newAssetAddedNotificationKey);
  //           }}
  //           style={{ height: '30px', margin: '0px', lineHeight: 1.0 }}
  //         >
  //           {t('home.createNewAsset.enable')}
  //         </Button>
  //       );

  //       notification.info({
  //         message: t('home.createNewAsset.notification.message'),
  //         description: t('home.createNewAsset.notification.description'),
  //         duration: 120,
  //         key: newAssetAddedNotificationKey,
  //         placement: 'topRight',
  //         btn: createNewlyAddedAssets,
  //       });
  //     }
  //   }, 1000);
  // };

  const checkBridgeConfigs = async (walletSession?: Session) => {
    if (!walletSession || !walletSession.wallet) {
      return;
    }

    setTimeout(async () => {
      const allConfigs = await walletService.storageService.fetchAllBridgeConfigs();

      if (allConfigs.length < 6) {
        const updateBridgeConfigsNotificationKey = 'updateBridgeConfigsNotificationKey';
        const bridgeService = new BridgeService(walletService.storageService);
        bridgeService.updateBridgeConfiguration(DefaultTestnetBridgeConfigs.CRONOS_TENDERMINT_TO_CRONOS);
        bridgeService.updateBridgeConfiguration(DefaultTestnetBridgeConfigs.CRONOS_TO_CRONOS_TENDERMINT);
        bridgeService.updateBridgeConfiguration(DefaultMainnetBridgeConfigs.CRONOS_TENDERMINT_TO_CRONOS);
        bridgeService.updateBridgeConfiguration(DefaultMainnetBridgeConfigs.CRONOS_TO_CRONOS_TENDERMINT);
        bridgeService.updateBridgeConfiguration(DefaultMainnetBridgeConfigs.COSMOS_HUB_TO_CRONOS);
        bridgeService.updateBridgeConfiguration(DefaultMainnetBridgeConfigs.CRONOS_TO_COSMOS_HUB);

        notification.info({
          message: 'New config setting found',
          description: 'Your bridge config setting is updated!',
          duration: 15,
          key: updateBridgeConfigsNotificationKey,
          placement: 'topRight',
        });
      }
    }, 5_000);
  };

  const checkCorrectExplorerUrl = async (walletSession?: Session) => {
    if (!walletSession || !walletSession.wallet) {
      return;
    }

    const assets = await walletService.retrieveWalletAssets(walletSession.wallet.identifier);
    const cronosTendermintAsset = getCronosTendermintAsset(assets);
    const cronosAsset = getCronosEvmAsset(assets);
    const ethAsset = getEthereumEvmAsset(assets);
    const isTestnet = checkIfTestnet(walletSession.wallet.config.network);

    const { nodeUrl: checkDefaultCronosPosNodeUrl, explorerUrl: checkDefaultCronosPosExplorerUrl } = CRONOS_TENDERMINT_ASSET(walletSession.wallet.config).config;

    const checkDefaultCronosExplorerUrl = isTestnet
      ? TestNetEvmConfig.explorerUrl
      : MainNetEvmConfig.explorerUrl;

    const checkDefaultEthExplorerUrl = isTestnet
      ? GOERLI_ETHEREUM_EXPLORER_URL
      : MAINNET_ETHEREUM_EXPLORER_URL;

    setTimeout(async () => {
      if (
        !walletSession.activeAsset?.config?.explorer ||
        // Check if explorerUrl has been updated with latest default
        cronosTendermintAsset?.config?.explorerUrl !== checkDefaultCronosPosExplorerUrl || 
        cronosTendermintAsset?.config?.nodeUrl !== checkDefaultCronosPosNodeUrl ||
        cronosAsset?.config?.explorerUrl !== checkDefaultCronosExplorerUrl ||
        ethAsset?.config?.explorerUrl !== checkDefaultEthExplorerUrl || 
        // Check if there are latest tendermintNetwork on Cronos Tendermint
        !cronosTendermintAsset?.config?.tendermintNetwork
      ) {
        const updateExplorerUrlNotificationKey = 'updateExplorerUrlNotificationKey';

        // Update to Default Bridge Configs
        const bridgeService = new BridgeService(walletService.storageService);
        bridgeService.updateBridgeConfiguration(DefaultTestnetBridgeConfigs.CRONOS_TENDERMINT_TO_CRONOS);
        bridgeService.updateBridgeConfiguration(DefaultTestnetBridgeConfigs.CRONOS_TO_CRONOS_TENDERMINT);
        bridgeService.updateBridgeConfiguration(DefaultMainnetBridgeConfigs.CRONOS_TENDERMINT_TO_CRONOS);
        bridgeService.updateBridgeConfiguration(DefaultMainnetBridgeConfigs.CRONOS_TO_CRONOS_TENDERMINT);
        bridgeService.updateBridgeConfiguration(DefaultMainnetBridgeConfigs.COSMOS_HUB_TO_CRONOS);
        bridgeService.updateBridgeConfiguration(DefaultMainnetBridgeConfigs.CRONOS_TO_COSMOS_HUB);

        // Update All Assets in All Wallets
        const allWallets = await walletService.retrieveAllWallets();
        allWallets.forEach(async wallet => {
          const isTestnet = checkIfTestnet(wallet.config.network);
          const defaultEthAssetConfig = ETH_ASSET(wallet.config).config;
          const defaultCronosTendermintAsset = CRONOS_TENDERMINT_ASSET(wallet.config);

          const settingsDataUpdate: SettingsDataUpdate = {
            walletId: wallet.identifier,
            chainId: defaultCronosTendermintAsset.config.chainId,
            nodeUrl: defaultCronosTendermintAsset.config.nodeUrl,
            indexingUrl: defaultCronosTendermintAsset.config.indexingUrl,
            networkFee: String(wallet.config.fee.networkFee),
            gasLimit: String(wallet.config.fee.gasLimit),
            explorer: {
              baseUrl: `${defaultCronosTendermintAsset.config.explorerUrl}`,
              tx: `${defaultCronosTendermintAsset.config.explorerUrl}/tx`,
              address: `${defaultCronosTendermintAsset.config.explorerUrl}/account`,
              validator: `${defaultCronosTendermintAsset.config.explorerUrl}/validator`,
            },
            clientUrl: defaultCronosTendermintAsset.config.tendermintNetwork?.node?.clientUrl,
            proxyUrl: defaultCronosTendermintAsset.config.tendermintNetwork?.node?.proxyUrl,
          };

          await walletService.updateWalletNodeConfig(settingsDataUpdate);

          // Save updated active asset settings.
          const allAssets = await walletService.retrieveWalletAssets(wallet.identifier);
          allAssets.forEach(async asset => {
            let name = asset.name;
            let nodeUrl = `${asset.config?.nodeUrl ?? wallet.config.nodeUrl}`;
            let indexingUrl = `${asset.config?.indexingUrl ?? wallet.config.indexingUrl}`;
            let explorerUrl = `${asset.config?.explorerUrl ?? wallet.config.explorerUrl}`;
            let chainId = `${asset.config?.chainId ?? wallet.config.network.chainId}`;
            if (
              asset.assetType === UserAssetType.TENDERMINT && (asset.name === SupportedChainName.CRONOS_TENDERMINT || asset.name.includes('Crypto.org'))
            ) {
              name = SupportedChainName.CRONOS_TENDERMINT;
              nodeUrl = defaultCronosTendermintAsset.config.nodeUrl;
              indexingUrl = defaultCronosTendermintAsset.config.indexingUrl;
              explorerUrl = defaultCronosTendermintAsset.config.explorerUrl;
              chainId = defaultCronosTendermintAsset.config.chainId;
            }
            if (
              asset.assetType === UserAssetType.EVM && asset.name.includes('Cronos') ||
              asset.assetType === UserAssetType.CRC_20_TOKEN
            ) {
              nodeUrl = isTestnet ? TestNetEvmConfig.nodeUrl : MainNetEvmConfig.nodeUrl;
              indexingUrl = isTestnet ? TestNetEvmConfig.indexingUrl : MainNetEvmConfig.indexingUrl;
              explorerUrl = isTestnet ? TestNetEvmConfig.explorerUrl : MainNetEvmConfig.explorerUrl;
            } else if (
              asset.assetType === UserAssetType.EVM && asset.name.includes('Ethereum') ||
              asset.assetType === UserAssetType.ERC_20_TOKEN
            ) {
              nodeUrl = defaultEthAssetConfig.nodeUrl;
              indexingUrl = defaultEthAssetConfig.indexingUrl;
              explorerUrl = defaultEthAssetConfig.explorerUrl;
              chainId = defaultEthAssetConfig.chainId;
            }
            
            const newlyUpdatedAsset: UserAsset = {
              ...asset,
              name,
              description: asset.description.replace('Crypto.org Chain', SupportedChainName.CRONOS_TENDERMINT),
              config: {
                ...asset.config!,
                nodeUrl,
                indexingUrl,
                explorer: {
                  baseUrl: `${explorerUrl}`,
                  tx: `${explorerUrl}/tx`,
                  address: `${explorerUrl}/${asset.assetType === UserAssetType.TENDERMINT ||
                      asset.assetType === UserAssetType.IBC
                    ? 'account'
                    : 'address'
                  }`,
                  validator: `${explorerUrl}/validator`,
                },
                explorerUrl,
                chainId,
                fee: {
                  gasLimit: String(asset.config?.fee.gasLimit ?? wallet.config.fee.gasLimit),
                  networkFee: String(asset.config?.fee.networkFee ?? wallet.config.fee.networkFee),
                },
                isLedgerSupportDisabled: asset.config?.isLedgerSupportDisabled!,
                isStakingDisabled: asset.config?.isStakingDisabled!,
                ...(asset.assetType === UserAssetType.TENDERMINT && (asset.name === SupportedChainName.CRONOS_TENDERMINT || asset.name.includes('Crypto.org') )) && {
                  tendermintNetwork: {
                    ...defaultCronosTendermintAsset.config.tendermintNetwork!,
                    node: {
                      clientUrl: defaultCronosTendermintAsset.config.tendermintNetwork?.node?.clientUrl ?? '',
                      proxyUrl: defaultCronosTendermintAsset.config.tendermintNetwork?.node?.proxyUrl ?? '',
                    }
                  }
                }
              },
            };
            await walletService.saveAssets([newlyUpdatedAsset]);
          });
        });

        notification.info({
          message: 'New config setting found',
          description: 'Your Explorer URL config setting is updated!',
          duration: 15,
          key: updateExplorerUrlNotificationKey,
          placement: 'topRight',
        });
      }
    }, 5_000);
  };

  const conditionalLink = (to: NavbarMenuKey, label: string) => {
    const conditionalLinkNotificationKey = 'conditionalLinkNotificationKey';

    const renderConditionalLinkBtn = () => {
      switch (pageLock) {
        case 'bridge':
          return (
            <a
              onClick={() => {
                notification.info({
                  key: conditionalLinkNotificationKey,
                  message: t('home.notification.cronosBridgeExit.message'),
                  description: t('home.notification.cronosBridgeExit.description'),
                  duration: 10,
                  btn: (
                    <Button
                      type="primary"
                      size="small"
                      className="btn-exit"
                      onClick={() => {
                        notification.close(conditionalLinkNotificationKey);
                        setPageLock('');
                        setNavbarMenuSelectedKey(to);
                        if (to === '/bridge') {
                          setTimeout(() => {
                            history.push(to);
                          }, 100);
                          history.push({
                            pathname: '/refresh',
                            state: {
                              from: to,
                            },
                          });
                        } else {
                          history.push(to);
                        }
                      }}
                      style={{ height: '30px', margin: '0px', lineHeight: 1.0 }}
                    >
                      {t('home.notification.cronosBridgeExit.button')}
                    </Button>
                  ),
                });
              }}
            >
              {label}
            </a>
          );
        case 'dapp':
          return (
            <a
              onClick={() => {
                notification.info({
                  key: conditionalLinkNotificationKey,
                  message: t('home.notification.dappBrowserExit.message'),
                  description: t('home.notification.dappBrowserExit.description'),
                  duration: 10,
                  btn: (
                    <Button
                      type="primary"
                      size="small"
                      className="btn-exit"
                      onClick={() => {
                        notification.close(conditionalLinkNotificationKey);
                        setPageLock('');
                        setNavbarMenuSelectedKey(to);
                        if (to === '/dapp') {
                          setTimeout(() => {
                            history.push(to);
                          }, 100);
                          history.push({
                            pathname: '/refresh',
                            state: {
                              from: to,
                            },
                          });
                        } else {
                          history.push(to);
                        }
                      }}
                      style={{ height: '30px', margin: '0px', lineHeight: 1.0 }}
                    >
                      {t('home.notification.dappBrowserExit.button')}
                    </Button>
                  ),
                });
              }}
            >
              {label}
            </a>
          );
        default:
          return <Link to={to}>{label}</Link>;
      }
    };

    return renderConditionalLinkBtn();
  };

  useEffect(() => {
    const fetchDB = async () => {
      setFetchingDB(true);
      const hasWalletBeenCreated = await walletService.hasWalletBeenCreated();
      const currentSession = await walletService.retrieveCurrentSession();
      const currentAsset = await walletService.retrieveDefaultWalletAsset(currentSession);
      const allAssets = await walletService.retrieveCurrentWalletAssets(currentSession);
      const allWalletsData = await walletService.retrieveAllWallets();
      const currentMarketData = await walletService.retrieveAssetPrice(
        currentAsset?.assetType,
        currentAsset?.mainnetSymbol,
        currentSession.currency,
      );
      const currentAllAssetsMarketData = await walletService.retrieveAllAssetsPrices(
        currentSession.currency,
      );

      const processedAllAssets = allAssets.map((asset) => {
        const assetMarketData = currentAllAssetsMarketData.get(
          `${asset.assetType}-${asset.mainnetSymbol}-${currentSession.currency}`,
        );
        return {
          ...asset,
          marketValue: assetMarketData &&
          assetMarketData.price && 
          asset.mainnetSymbol === assetMarketData.assetSymbol 
            ? numeral(
              getAssetBalancePrice(asset, assetMarketData),
            ).value() ?? 0
            : 0
        };
      })
        .sort((a, b) => {
          if(a.marketValue < b.marketValue) return 1;
          if(a.marketValue > b.marketValue) return -1;
          return 0;
        });

      const isIbcVisible = allAssets.length > 1;

      const announcementShown = await generalConfigService.checkIfHasShownAnalyticsPopup();
      const isAppLocked = await generalConfigService.getIfAppIsLockedByUser();

      // let isAutoUpdateDisabled = await generalConfigService.checkIfAutoUpdateDisabled();
      const autoUpdateExpireTime = await ipcRenderer.invoke('get_auto_update_expire_time');
      // Enable Auto Update if expired
      if (autoUpdateExpireTime < Date.now()) {
        ipcRenderer.send('set_auto_update_expire_time', 0);
      }

      setHasWallet(hasWalletBeenCreated);
      setSession({
        ...currentSession,
        activeAsset: currentAsset,
      });
      setUserAsset(currentAsset);
      setWalletAllAssets(processedAllAssets);
      setIsIbcVisible(isIbcVisible);
      setWalletList(allWalletsData);
      setMarketData(currentMarketData);
      setAllMarketData(currentAllAssetsMarketData);
      setIsSessionLockModalVisible(isAppLocked);

      await Promise.all([
        await fetchAndSetNewValidators(currentSession),
        await fetchAndSetNewProposals(currentSession),
        await fetchAndSetNFTs(currentSession),
        // await fetchAndSaveIBCWalletAssets(currentSession),
      ]);

      const currentValidatorList = await walletService.retrieveTopValidators(
        currentSession.wallet.config.network.chainId,
      );
      const currentNftLists = await walletService.retrieveNFTs(currentSession.wallet.identifier);

      setValidatorList(currentValidatorList);
      setNftList(currentNftLists);

      setFetchingDB(false);

      // Timeout for loading
      setTimeout(() => {
        setIsAnnouncementVisible(!announcementShown);
      }, 2000);

      // checkNewlyAddedStaticAssets(currentSession);
      checkCorrectExplorerUrl({
        ...currentSession,
        activeAsset: currentAsset,
      });
      checkBridgeConfigs(currentSession);
    };

    if (!didMountRef.current) {
      fetchDB();
      if (allPaths.includes(currentLocationPath as NavbarMenuKey)) {
        setNavbarMenuSelectedKey(currentLocationPath as NavbarMenuKey);
      }

      didMountRef.current = true;
    } else if (!hasWallet) {
      history.push('/welcome');
    }
  }, [
    history,
    hasWallet,
    session,
    setSession,
    userAsset,
    setUserAsset,
    walletAllAssets,
    setWalletAllAssets,
    walletList,
    setWalletList,
    marketData,
    setMarketData,
    allMarketData,
    setAllMarketData,
    validatorList,
    setValidatorList,
    nftList,
    setNftList,
    isSessionLockModalVisible,
    setIsSessionLockModalVisible,
    pageLock,
    menuToBeSelectedKey,
    setMenuToBeSelectedKey,
  ]);
  
  useEffect(() => {
    callBackFetchingDB();
  }, [fetchingDB]);

  const onWalletDecryptFinishCreateFreshAssets = async (password: string) => {
    setFetchingDB(true);
    setInputPasswordVisible(false);
    const phraseDecrypted = await secretStoreService.decryptPhrase(
      password,
      session.wallet.identifier,
    );

    await walletService.handleCurrentWalletAssetsMigration(phraseDecrypted, session);

    setFetchingDB(false);
  };

  const HomeMenu = () => {
    const isTestnet = checkIfTestnet(session.wallet.config.network);
    let menuSelectedKey = currentLocationPath;
    if (!allPaths.includes(menuSelectedKey as NavbarMenuKey)) {
      menuSelectedKey = '/home';
    }

    const walletConnectState = useRecoilValue(walletConnectStateAtom);
    const homeMenuItemList = [
      {
        label: conditionalLink('/home', t('navbar.home')),
        key: '/home',
        icon: <Icon component={IconHome} />,
      },
      {
        label: conditionalLink('/staking', t('navbar.staking')),
        key: '/staking',
        icon: <Icon component={IconStaking} />,
      },
      {
        label: conditionalLink('/assets', t('navbar.assets')),
        key: '/assets',
        icon: <Icon component={IconAssets} />,
      },
      (!isTestnet || session.wallet.config.network.chainId === 'testnet-croeseid-4')
        ? {
          label: conditionalLink('/bridge', t('navbar.bridge')),
          key: '/bridge',
          icon: <Icon component={IconCronos} />,
        } 
        : null,
      !isTestnet
        ? {
          label: conditionalLink('/dapp', t('navbar.dapp')),
          key: '/dapp',
          icon: <Icon component={IconDApp} />,
        }
        : null,
      {
        label: conditionalLink('/governance', t('navbar.governance')),
        key: '/governance',
        icon: <BankOutlined />,
      },
      {
        label: conditionalLink('/nft', t('navbar.nft')),
        key: '/nft',
        icon: <Icon component={IconNft} />,
      },
      {
        label: conditionalLink('/settings', t('navbar.settings')),
        key: '/settings',
        icon: <SettingOutlined />,
      },
    ];

    if (walletConnectState.connected) {
      homeMenuItemList.push({
        label: conditionalLink('/walletconnect', 'WalletConnect'),
        key: '/walletconnect',
        icon: <Icon component={IconWalletConnect} />,
      });
    }

    return (
      <Menu
        theme="dark"
        mode="inline"
        defaultSelectedKeys={[menuSelectedKey]}
        selectedKeys={[navbarMenuSelectedKey]}
        onClick={item => {
          setMenuToBeSelectedKey(item.key);
          if (!pageLock) {
            setNavbarMenuSelectedKey(item.key as NavbarMenuKey);
          }
        }}
        items={homeMenuItemList}
      />
    );
  };

  const WalletMenu = () => {
    const walletMenuItemList = [
      ...(walletList.length <= LedgerWalletMaximum
        ? [
          {
            label: conditionalLink('/restore', t('navbar.wallet.restore')),
            key: 'restore-wallet-item',
            className: 'restore-wallet-item',
            icon: <ReloadOutlined style={{ color: ThemeColor.BLUE }} />,
          },
          {
            label: conditionalLink('/create', t('navbar.wallet.create')),
            key: 'create-wallet-item',
            className: 'create-wallet-item',
            icon: <PlusOutlined style={{ color: ThemeColor.BLUE }} />,
          },
        ]
        : []),
      ...(walletList.length > 1
        ? [
          {
            label: t('navbar.wallet.delete'),
            key: 'delete-wallet-item',
            className: 'delete-wallet-item',
            icon: <DeleteOutlined style={{ color: ThemeColor.RED }} />,
          },
        ]
        : []),
      {
        label: conditionalLink('/wallet', t('navbar.wallet.list')),
        key: 'wallet-list-item',
        className: 'wallet-list-item',
        icon: <Icon component={IconWallet} style={{ color: ThemeColor.BLUE }} />,
      }, // which is required
    ];

    return (
      <Menu
        items={walletMenuItemList}
        onClick={({ key }) => {
          if (key === 'delete-wallet-item') {
            setDeleteWalletAddress(session.wallet.address);
            setIsConfirmationModalVisible(true);
          }
        }}
        className="wallet-menu"
      />
    );
  };

  const buildVersion = packageJson.version;

  return (
    <main className="home-layout">
      <IntercomCustomerService />
      <PasswordFormModal
        description={t('general.passwordFormModal.description')}
        okButtonText={t('general.passwordFormModal.okButton')}
        onCancel={() => {
          setInputPasswordVisible(false);
        }}
        onSuccess={onWalletDecryptFinishCreateFreshAssets}
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
      />

      <SessionLockModal
        description={t('general.sessionLockModal.description')}
        okButtonText={t('general.sessionLockModal.okButton')}
        onCancel={async () => {
          await generalConfigService.setIsAppLockedByUser(false);
          setIsSessionLockModalVisible(false);
        }}
        onSuccess={async () => {
          await generalConfigService.setIsAppLockedByUser(false);
          notification.info({
            message: t('general.sessionLockModal.notification.message2'),
            description: t('general.sessionLockModal.notification.description2'),
            duration: 3,
            placement: 'topRight',
          });
          setIsSessionLockModalVisible(false);
        }}
        onValidatePassword={async (password: string) => {
          const isValid = await secretStoreService.checkIfPasswordIsValid(password);
          let latestIncorrectAttemptCount = 0;
          let errorText = t('general.sessionLockModal.error');

          if (isValid) {
            // Reset Incorrect attempt counts to ZERO
            await generalConfigService.resetIncorrectUnlockAttemptsCount();
          } else {
            // Increment incorrect Attempt counts by ONE
            await generalConfigService.incrementIncorrectUnlockAttemptsCountByOne();

            // Self-destruct or clear storage on `N` incorrect attempts
            latestIncorrectAttemptCount = await generalConfigService.getIncorrectUnlockAttemptsCount();

            // Deleting local storage
            if (latestIncorrectAttemptCount >= MAX_INCORRECT_ATTEMPTS_ALLOWED) {
              const deleteDBRequest = indexedDB.deleteDatabase('NeDB');
              deleteDBRequest.onsuccess = () => {
                setTimeout(() => {
                  ipcRenderer.send('restart_app');
                }, 3000);
              };
            }

            // Show warning after `X` number of wrong attempts
            if (
              latestIncorrectAttemptCount >=
              MAX_INCORRECT_ATTEMPTS_ALLOWED - SHOW_WARNING_INCORRECT_ATTEMPTS
            ) {
              errorText = t('general.sessionLockModal.errorSelfDestruct')
                .replace('*N*', String(latestIncorrectAttemptCount))
                .replace(
                  '#T#',
                  String(MAX_INCORRECT_ATTEMPTS_ALLOWED - latestIncorrectAttemptCount),
                );
            }
          }

          return {
            valid: isValid,
            errMsg: !isValid ? errorText : '',
          };
        }}
        successText={t('general.sessionLockModal.success')}
        title={t('general.sessionLockModal.title')}
        visible={isSessionLockModalVisible}
        successButtonText={t('general.continue')}
      />

      <Layout>
        <Sider className="home-sider">
          <div className="logo" />
          <WalletConnectModal />
          <div className="version">DEFI DESKTOP WALLET v{buildVersion}</div>
          <HomeMenu />
          {updatedDownloaded && <Button onClick={() => {
            ipcRenderer.send('auto_updater_restart_app');
          }} className="restart-button" type="primary" size="large">{t('home.notification.downloadComplete.updateButton')}</Button>}
          <Button
            className="bottom-icon"
            type="ghost"
            size="large"
            icon={<LockFilled style={{ color: ThemeColor.BLUE }} />}
            onClick={async () => {
              notification.info({
                message: t('general.sessionLockModal.notification.message1'),
                description: t('general.sessionLockModal.notification.description1'),
                duration: 3,
                placement: 'topRight',
              });
              setTimeout(() => {
                setIsSessionLockModalVisible(true);
              }, 2 * 1000);
              await generalConfigService.setIsAppLockedByUser(true);
            }}
          >
            {' '}
            {t('navbar.lock')}{' '}
          </Button>
          <Dropdown
            overlay={<WalletMenu />}
            placement="topCenter"
            className="wallet-selection"
            // arrow
            trigger={['click']}
          >
            <div>
              <img src={WalletIcon} alt="walletIcon" />
              {ellipsis(session?.wallet.name, 16)}
              <CaretDownOutlined />
            </div>
          </Dropdown>
        </Sider>
        <div className={`home-page ${fetchingDB ? 'loading' : ''}`}>
          <Spin spinning={fetchingDB} indicator={<LoadingOutlined style={{ fontSize: 96 }} />}>
            <div className="container">{props.children}</div>
          </Spin>
        </div>
        <ModalPopup
          isModalVisible={isConfirmationModalVisible}
          handleCancel={handleCancel}
          handleOk={showPasswordModal}
          confirmationLoading={isButtonLoading}
          closable={!isButtonLoading}
          okText="Confirm"
          footer={[
            <Button
              key="submit"
              type="primary"
              loading={isButtonLoading}
              onClick={() => setIsConfirmDeleteVisible(true)}
              disabled={isButtonDisabled}
              hidden={isConfirmDeleteVisible}
              danger
            >
              {t('general.confirm')}
            </Button>,
            <Button
              key="submit"
              type="primary"
              loading={isButtonLoading}
              onClick={confirmDeleteForm.submit}
              disabled={isButtonDisabled}
              hidden={!isConfirmDeleteVisible}
              danger
            >
              {t('navbar.wallet.delete')}
            </Button>,
            <Button key="back" type="link" onClick={handleCancel} disabled={isButtonLoading}>
              {t('general.cancel')}
            </Button>,
          ]}
        >
          <>
            <div className="title">{t('navbar.wallet.modal.title')}</div>
            <div className="description">{t('navbar.wallet.modal.description')}</div>
            <div className="item">
              <div className="label">{t('navbar.wallet.modal.form1.address.label')}</div>
              {/* <div className="address">{`${session.wallet.address}`}</div> */}
              <div className="address">{`${deleteWalletAddress}`}</div>
            </div>
            {!isConfirmDeleteVisible ? (
              <>
                <div className="item">
                  <Alert
                    type="warning"
                    message={`${t('navbar.wallet.modal.warning1')} ${session.wallet.walletType !== LEDGER_WALLET_TYPE
                      ? t('navbar.wallet.modal.warning2')
                      : ''
                    }`}
                    showIcon
                  />
                </div>
                <div className="item">
                  <Checkbox
                    checked={!isButtonDisabled}
                    onChange={() => setIsButtonDisabled(!isButtonDisabled)}
                  >
                    {session.wallet.walletType !== LEDGER_WALLET_TYPE
                      ? t('navbar.wallet.modal.checkbox1')
                      : t('navbar.wallet.modal.checkbox2')}
                  </Checkbox>
                </div>
              </>
            ) : (
              <div className="item">
                <Form
                  layout="vertical"
                  form={confirmDeleteForm}
                  name="control-hooks"
                  requiredMark="optional"
                  onFinish={onWalletDeleteFinish}
                >
                  <Form.Item
                    name="delete"
                    label={`${t('navbar.wallet.modal.form1.delete.label')} DELETE`}
                    hasFeedback
                    rules={[
                      {
                        required: true,
                        message: `${t('navbar.wallet.modal.form1.delete.error1')} DELETE`,
                      },
                      {
                        pattern: /^DELETE$/,
                        message: `${t('navbar.wallet.modal.form1.delete.error1')} DELETE`,
                      },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Form>
              </div>
            )}
          </>
        </ModalPopup>
        <SuccessModalPopup
          isModalVisible={isSuccessDeleteModalVisible}
          handleCancel={() => {
            setIsSuccessDeleteModalVisible(false);
          }}
          handleOk={() => {
            setIsSuccessDeleteModalVisible(false);
          }}
          title={t('general.successModalPopup.title')}
          button={null}
          footer={[
            <Button
              key="submit"
              type="primary"
              onClick={() => {
                setIsSuccessDeleteModalVisible(false);
              }}
            >
              {t('general.ok')}
            </Button>,
          ]}
        >
          <>
            <div className="description">
              {t('navbar.wallet.successModal.message1')}
              <br />
              {deleteWalletAddress}
              <br />
              {t('navbar.wallet.successModal.message2')}
            </div>
          </>
        </SuccessModalPopup>
        <ModalPopup
          isModalVisible={isAnnouncementVisible}
          handleCancel={() => {
            setIsAnnouncementVisible(false);
            generalConfigService.setHasShownAnalyticsPopup(true);
          }}
          handleOk={() => { }}
          footer={[]}
        >
          <>
            <div className="title">{t('announcement.modal.title')}</div>
            <div className="description">{t('announcement.modal.description1')}</div>
          </>
        </ModalPopup>
        <SuccessModalPopup
          isModalVisible={isLedgerCreateAssetSuccessModalVisible}
          handleCancel={() => {
            setIsLedgerCreateAssetSuccessModalVisible(false);
          }}
          handleOk={() => {
            setIsLedgerCreateAssetSuccessModalVisible(false);
          }}
          title={t('general.successModalPopup.title')}
          button={null}
          footer={[
            <Button
              key="submit"
              type="primary"
              onClick={() => {
                setIsLedgerCreateAssetSuccessModalVisible(false);
              }}
            >
              {t('general.continue')}
            </Button>,
          ]}
        >
          <>
            <div className="description">
              {t('general.successModalPopup.createWallet.description')}
            </div>
          </>
        </SuccessModalPopup>
      </Layout>
    </main>
  );
}

export default HomeLayout;
