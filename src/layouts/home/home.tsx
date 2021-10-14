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
import { useRecoilState, useSetRecoilState } from 'recoil';
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
} from '../../recoil/atom';
import { ellipsis } from '../../utils/utils';
import WalletIcon from '../../assets/icon-wallet-grey.svg';
import IconHome from '../../svg/IconHome';
// import IconSend from '../../svg/IconSend';
// import IconReceive from '../../svg/IconReceive';
import IconAssets from '../../svg/IconAssets';
import IconStaking from '../../svg/IconStaking';
import IconNft from '../../svg/IconNft';
import IconCronos from '../../svg/IconCronos';
import IconWallet from '../../svg/IconWallet';
import ModalPopup from '../../components/ModalPopup/ModalPopup';
import SuccessModalPopup from '../../components/SuccessModalPopup/SuccessModalPopup';
import ErrorModalPopup from '../../components/ErrorModalPopup/ErrorModalPopup';
import { walletService } from '../../service/WalletService';
import { Session } from '../../models/Session';
// eslint-disable-next-line
import { SettingsDataUpdate } from '../../models/Wallet';
import packageJson from '../../../package.json';
import {
  createLedgerDevice,
  detectConditionsError,
  LEDGER_WALLET_TYPE,
} from '../../service/LedgerService';
import {
  LedgerWalletMaximum,
  MAX_INCORRECT_ATTEMPTS_ALLOWED,
  SHOW_WARNING_INCORRECT_ATTEMPTS,
} from '../../config/StaticConfig';
import { generalConfigService } from '../../storage/GeneralConfigService';
import PasswordFormModal from '../../components/PasswordForm/PasswordFormModal';
import { secretStoreService } from '../../storage/SecretStoreService';
import SessionLockModal from '../../components/PasswordForm/SessionLockModal';
import LedgerModalPopup from '../../components/LedgerModalPopup/LedgerModalPopup';
import SuccessCheckmark from '../../components/SuccessCheckmark/SuccessCheckmark';
import IconLedger from '../../svg/IconLedger';
import { ISignerProvider } from '../../service/signers/SignerProvider';
import { UserAsset } from '../../models/UserAsset';

interface HomeLayoutProps {
  children?: React.ReactNode;
}

const { Sider } = Layout;

const allPaths = [
  '/home',
  '/staking',
  // '/send',
  // '/receive',
  '/assets',
  '/settings',
  '/governance',
  '/nft',
  '/bridge',
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
  const [fetchingDB, setFetchingDB] = useRecoilState(fetchingDBState);
  const setIsIbcVisible = useSetRecoilState(isIbcVisibleState);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [isConfirmDeleteVisible, setIsConfirmDeleteVisible] = useState(false);
  const [isConfirmationModalVisible, setIsConfirmationModalVisible] = useState(false);
  const [isSuccessDeleteModalVisible, setIsSuccessDeleteModalVisible] = useState(false);

  const [isAnnouncementVisible, setIsAnnouncementVisible] = useState(false);
  const [isButtonLoading, setIsButtonLoading] = useState(false);

  const [ledgerTendermintAddress, setLedgerTendermintAddress] = useState('');
  const [isLedgerCroAppConnected, setIsLedgerCroAppConnected] = useState(false);
  const [isLedgerEthAppConnected, setIsLedgerEthAppConnected] = useState(false);
  const [isLedgerCroAppConnectModalVisible, setIsLedgerCroAppConnectModalVisible] = useState(false);
  const [isLedgerEthAppConnectModalVisible, setIsLedgerEthAppConnectModalVisible] = useState(false);
  const [
    isLedgerCreateAssetSuccessModalVisible,
    setIsLedgerCreateAssetSuccessModalVisible,
  ] = useState(false);
  const [isLedgerCreateAssetErrorModalVisible, setIsLedgerCreateAssetErrorModalVisible] = useState(
    false,
  );
  const [isLedgerModalButtonLoading, setIsLedgerModalButtonLoading] = useState(false);

  const didMountRef = useRef(false);
  const currentLocationPath = useLocation().pathname;

  const [t] = useTranslation();

  async function fetchAndSetNewValidators(currentSession) {
    try {
      await walletService.fetchAndSaveValidators(currentSession);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('Failed loading new wallet validators list', e);
    }
  }

  async function fetchAndSaveIBCWalletAssets(fetchSession: Session) {
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
    await walletService.syncAll(currentSession);

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

  const showPasswordInput = () => {
    setInputPasswordVisible(true);
  };

  const migrateLedgerAsset = async (
    walletSession: Session,
    tendermintAddress: string,
    evmAddress: string,
  ) => {
    setFetchingDB(true);
    try {
      await walletService.handleCurrentWalletAssetsMigration(
        '',
        walletSession,
        tendermintAddress,
        evmAddress,
      );
      setIsLedgerCreateAssetSuccessModalVisible(true);
    } catch (e) {
      setIsLedgerCreateAssetErrorModalVisible(true);
    }
    setFetchingDB(false);
  };

  const checkIsLedgerCroAppConnected = async (walletSession: Session) => {
    try {
      const device: ISignerProvider = createLedgerDevice();

      const tendermintAddress = await device.getAddress(
        walletSession.wallet.addressIndex,
        walletSession.wallet.config.network.addressPrefix,
        false,
      );

      setLedgerTendermintAddress(tendermintAddress);
      setIsLedgerCroAppConnected(true);

      await new Promise(resolve => {
        setTimeout(resolve, 2000);
      });

      setIsLedgerCroAppConnectModalVisible(false);
      setIsLedgerCroAppConnected(false);
      setIsLedgerModalButtonLoading(false);
      setIsLedgerEthAppConnectModalVisible(true);
    } catch (e) {
      let message = `${t('create.notification.ledger.message1')}`;
      let description = `${t('create.notification.ledger.description1')}`;
      if (walletSession.wallet.walletType === LEDGER_WALLET_TYPE) {
        if (detectConditionsError(e.toString())) {
          message = `${t('create.notification.ledger.message2')}`;
          description = `${t('create.notification.ledger.message2')}`;
        }
      }

      await new Promise(resolve => {
        setTimeout(resolve, 2000);
      });
      setIsLedgerCroAppConnected(false);
      setIsLedgerCroAppConnectModalVisible(false);
      setIsLedgerModalButtonLoading(false);

      notification.error({
        message,
        description,
        placement: 'topRight',
        duration: 20,
      });
    }
  };

  const checkIsLedgerEthAppConnected = async (walletSession: Session) => {
    let hwok = false;
    let ledgerEvmAddress = '';
    try {
      const device: ISignerProvider = createLedgerDevice();

      ledgerEvmAddress = await device.getEthAddress(walletSession.wallet.addressIndex, false);
      setIsLedgerEthAppConnected(true);

      await new Promise(resolve => {
        setTimeout(resolve, 2000);
      });

      setIsLedgerEthAppConnected(false);
      setIsLedgerEthAppConnectModalVisible(false);
      setIsLedgerModalButtonLoading(false);

      hwok = true;
    } catch (e) {
      let message = `${t('create.notification.ledger.message1')}`;
      let description = `${t('create.notification.ledger.description1')}`;
      if (walletSession.wallet.walletType === LEDGER_WALLET_TYPE) {
        if (detectConditionsError(e.toString())) {
          message = `${t('create.notification.ledger.message2')}`;
          description = `${t('create.notification.ledger.message2')}`;
        }
      }

      setIsLedgerEthAppConnected(false);
      await new Promise(resolve => {
        setTimeout(resolve, 2000);
      });
      setIsLedgerEthAppConnectModalVisible(false);
      setIsLedgerModalButtonLoading(false);

      notification.error({
        message,
        description,
        placement: 'topRight',
        duration: 20,
      });
    }
    await new Promise(resolve => {
      setTimeout(resolve, 2000);
    });
    if (hwok) {
      // proceed
      migrateLedgerAsset(walletSession, ledgerTendermintAddress, ledgerEvmAddress);
    }
  };

  const checkNewlyAddedStaticAssets = (walletSession?: Session) => {
    if (!walletSession || !walletSession.wallet) {
      return;
    }

    setTimeout(async () => {
      if (await walletService.checkIfWalletNeedAssetCreation(walletSession)) {
        const newAssetAddedNotificationKey = 'newAssetAddedNotificationKey';

        const createNewlyAddedAssets = (
          <Button
            type="primary"
            size="small"
            className="btn-restart"
            onClick={() => {
              if (walletSession.wallet.walletType === LEDGER_WALLET_TYPE) {
                setIsLedgerCroAppConnectModalVisible(true);
              } else {
                showPasswordInput();
              }
              notification.close(newAssetAddedNotificationKey);
            }}
            style={{ height: '30px', margin: '0px', lineHeight: 1.0 }}
          >
            {t('home.createNewAsset.enable')}
          </Button>
        );

        notification.info({
          message: t('home.createNewAsset.notification.message'),
          description: t('home.createNewAsset.notification.description'),
          duration: 60,
          key: newAssetAddedNotificationKey,
          placement: 'topRight',
          btn: createNewlyAddedAssets,
        });
      }
    }, 1000);
  };

  const checkCorrectExplorerUrl = (walletSession?: Session) => {
    if (!walletSession || !walletSession.wallet) {
      return;
    }

    setTimeout(async () => {
      if (!walletSession.activeAsset?.config?.explorer) {
        const updateExplorerUrlNotificationKey = 'updateExplorerUrlNotificationKey';

        // Update All Assets in All Wallets
        const allWallets = await walletService.retrieveAllWallets();
        allWallets.forEach(async wallet => {
          const settingsDataUpdate: SettingsDataUpdate = {
            walletId: wallet.identifier,
            chainId: wallet.config.network.chainId,
            nodeUrl: wallet.config.nodeUrl,
            indexingUrl: wallet.config.indexingUrl,
            networkFee: String(wallet.config.fee.networkFee),
            gasLimit: String(wallet.config.fee.gasLimit),
            explorer: {
              baseUrl: `${wallet.config.explorerUrl}`,
              tx: `${wallet.config.explorerUrl}/tx`,
              address: `${wallet.config.explorerUrl}/account`,
              validator: `${wallet.config.explorerUrl}/validator`,
            },
          };

          await walletService.updateWalletNodeConfig(settingsDataUpdate);

          // Save updated active asset settings.
          const allAssets = await walletService.retrieveWalletAssets(wallet.identifier);
          allAssets.forEach(async asset => {
            const newlyUpdatedAsset: UserAsset = {
              ...asset,
              config: {
                ...asset.config!,
                nodeUrl: asset.config?.nodeUrl ?? wallet.config.nodeUrl,
                indexingUrl: asset.config?.indexingUrl ?? wallet.config.indexingUrl,
                explorer: {
                  baseUrl: `${asset.config?.explorerUrl ?? wallet.config.explorerUrl}`,
                  tx: `${asset.config?.explorerUrl ?? wallet.config.explorerUrl}/tx`,
                  address: `${asset.config?.explorerUrl ?? wallet.config.explorerUrl}/account`,
                  validator: `${asset.config?.explorerUrl ?? wallet.config.explorerUrl}/validator`,
                },
                explorerUrl: asset.config?.explorerUrl ?? wallet.config.explorerUrl,
                fee: {
                  gasLimit: String(asset.config?.fee.gasLimit ?? wallet.config.fee.gasLimit),
                  networkFee: String(asset.config?.fee.networkFee ?? wallet.config.fee.networkFee),
                },
                isLedgerSupportDisabled: asset.config?.isLedgerSupportDisabled!,
                isStakingDisabled: asset.config?.isStakingDisabled!,
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

  useEffect(() => {
    const fetchDB = async () => {
      setFetchingDB(true);
      const hasWalletBeenCreated = await walletService.hasWalletBeenCreated();
      const currentSession = await walletService.retrieveCurrentSession();
      const currentAsset = await walletService.retrieveDefaultWalletAsset(currentSession);
      const allAssets = await walletService.retrieveCurrentWalletAssets(currentSession);
      const allWalletsData = await walletService.retrieveAllWallets();
      const currentMarketData = await walletService.retrieveAssetPrice(
        currentAsset?.mainnetSymbol,
        currentSession.currency,
      );
      const currentAllAssetsMarketData = await walletService.retrieveAllAssetsPrices(
        currentSession.currency,
      );

      const isIbcVisible = allAssets.length > 1;
      // const isIbcVisible = false;
      const announcementShown = await generalConfigService.checkIfHasShownAnalyticsPopup();
      const isAppLocked = await generalConfigService.getIfAppIsLockedByUser();
      setHasWallet(hasWalletBeenCreated);
      setSession({
        ...currentSession,
        activeAsset: currentAsset,
      });
      setUserAsset(currentAsset);
      setWalletAllAssets(allAssets);
      setIsIbcVisible(isIbcVisible);
      setWalletList(allWalletsData);
      setMarketData(currentMarketData);
      setAllMarketData(currentAllAssetsMarketData);
      setIsSessionLockModalVisible(isAppLocked);

      await Promise.all([
        await fetchAndSetNewValidators(currentSession),
        await fetchAndSetNewProposals(currentSession),
        await fetchAndSetNFTs(currentSession),
        await fetchAndSaveIBCWalletAssets(currentSession),
      ]);

      const currentValidatorList = await walletService.retrieveTopValidators(
        currentSession.wallet.config.network.chainId,
      );
      const currentNftList = await walletService.retrieveNFTs(currentSession.wallet.identifier);

      setValidatorList(currentValidatorList);
      setNftList(currentNftList);

      setFetchingDB(false);

      // Timeout for loading
      setTimeout(() => {
        setIsAnnouncementVisible(!announcementShown);
      }, 2000);

      checkNewlyAddedStaticAssets(currentSession);
      checkCorrectExplorerUrl({
        ...currentSession,
        activeAsset: currentAsset,
      });
    };

    if (!didMountRef.current) {
      fetchDB();

      if (allPaths.includes(currentLocationPath)) {
        setNavbarMenuSelectedKey(currentLocationPath);
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
  ]);

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
    let menuSelectedKey = currentLocationPath;
    if (!allPaths.includes(menuSelectedKey)) {
      menuSelectedKey = '/home';
    }

    return (
      <Menu
        theme="dark"
        mode="inline"
        defaultSelectedKeys={[menuSelectedKey]}
        selectedKeys={[navbarMenuSelectedKey]}
        onClick={item => {
          setNavbarMenuSelectedKey(item.key);
        }}
      >
        <Menu.Item key="/home" icon={<Icon component={IconHome} />}>
          <Link to="/home">{t('navbar.home')}</Link>
        </Menu.Item>
        <Menu.Item key="/staking" icon={<Icon component={IconStaking} />}>
          <Link to="/staking">{t('navbar.staking')}</Link>
        </Menu.Item>
        <Menu.Item key="/assets" icon={<Icon component={IconAssets} />}>
          <Link to="/assets">{t('navbar.assets')}</Link>
        </Menu.Item>
        <Menu.Item key="/bridge" icon={<Icon component={IconCronos} />}>
          <Link to="/bridge">{t('navbar.bridge')}</Link>
        </Menu.Item>
        {/* <Menu.Item key="/send" icon={<Icon component={IconSend} />}>
          <Link to="/send">{t('navbar.send')}</Link>
        </Menu.Item>
        <Menu.Item key="/receive" icon={<Icon component={IconReceive} />}>
          <Link to="/receive">{t('navbar.receive')}</Link>
        </Menu.Item> */}
        <Menu.Item key="/governance" icon={<BankOutlined />}>
          <Link to="/governance">{t('navbar.governance')}</Link>
        </Menu.Item>
        <Menu.Item key="/nft" icon={<Icon component={IconNft} />}>
          <Link to="/nft">{t('navbar.nft')}</Link>
        </Menu.Item>
        <Menu.Item key="/settings" icon={<SettingOutlined />}>
          <Link to="/settings">{t('navbar.settings')}</Link>
        </Menu.Item>
      </Menu>
    );
  };

  const WalletMenu = () => {
    return (
      <Menu>
        {walletList.length <= LedgerWalletMaximum ? (
          <>
            <Menu.Item className="restore-wallet-item">
              <Link to="/restore">
                <ReloadOutlined />
                {t('navbar.wallet.restore')}
              </Link>
            </Menu.Item>
            <Menu.Item className="create-wallet-item">
              <Link to="/create">
                <PlusOutlined />
                {t('navbar.wallet.create')}
              </Link>
            </Menu.Item>
          </>
        ) : (
          ''
        )}
        {walletList.length > 1 ? (
          <>
            <Menu.Item
              className="delete-wallet-item"
              onClick={() => {
                setDeleteWalletAddress(session.wallet.address);
                setIsConfirmationModalVisible(true);
              }}
            >
              <DeleteOutlined />
              {t('navbar.wallet.delete')}
            </Menu.Item>
          </>
        ) : (
          ''
        )}
        <Menu.Item>
          <Link to="/wallet">
            {/* <IconWallet /> */}
            <Icon component={IconWallet} />
            {t('navbar.wallet.list')}
          </Link>
        </Menu.Item>
      </Menu>
    );
  };

  const buildVersion = packageJson.version;

  return (
    <main className="home-layout">
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
        confirmPassword={false}
        repeatValidation
      />

      <SessionLockModal
        description={t('general.sessionLockModal.description')}
        okButtonText={t('general.sessionLockModal.okButton')}
        onCancel={async () => {
          await generalConfigService.setIsAppLockedByUser(false);
          setIsSessionLockModalVisible(false);
        }}
        onSuccess={async password => {
          await generalConfigService.setIsAppLockedByUser(false);
          notification.info({
            message: 'App Unlocked',
            description: 'The app is successfully unlocked.',
            duration: 3,
            placement: 'topRight',
          });
          setIsSessionLockModalVisible(false);
          onWalletDecryptFinishCreateFreshAssets(password);
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
              indexedDB.deleteDatabase('NeDB');
              setTimeout(() => {
                history.replace('/');
                history.go(0);
              }, 3000);
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
        confirmPassword={false}
        repeatValidation
      />

      <Layout>
        <Sider className="home-sider">
          <div className="logo" />
          <div className="version">SAMPLE WALLET v{buildVersion}</div>
          <HomeMenu />
          <Button
            className="bottom-icon"
            type="ghost"
            size="large"
            icon={<LockFilled style={{ color: '#1199fa' }} />}
            onClick={async () => {
              notification.info({
                message: 'App Locked',
                description: 'The app will be locked shortly',
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
                    message={`${t('navbar.wallet.modal.warning1')} ${
                      session.wallet.walletType !== LEDGER_WALLET_TYPE
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
          handleOk={() => {}}
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
        <ErrorModalPopup
          isModalVisible={isLedgerCreateAssetErrorModalVisible}
          handleCancel={() => {
            setIsLedgerCreateAssetErrorModalVisible(false);
            setIsLedgerCroAppConnectModalVisible(true);
          }}
          handleOk={() => {
            setIsLedgerCreateAssetErrorModalVisible(false);
            setIsLedgerCroAppConnectModalVisible(true);
          }}
          title={t('general.errorModalPopup.title')}
          footer={[]}
        >
          <>
            <div className="description">
              {t('general.errorModalPopup.createWallet.description')}
            </div>
          </>
        </ErrorModalPopup>
        <LedgerModalPopup
          isModalVisible={isLedgerCroAppConnectModalVisible}
          handleCancel={() => {
            setIsLedgerCroAppConnectModalVisible(false);
          }}
          handleOk={() => {
            setIsLedgerCroAppConnectModalVisible(false);
          }}
          title={
            isLedgerCroAppConnected
              ? t('home.ledgerModalPopup.tendermintAsset.title1')
              : t('home.ledgerModalPopup.tendermintAsset.title2')
          }
          footer={[
            isLedgerCroAppConnected ? (
              <></>
            ) : (
              <Button
                type="primary"
                size="small"
                className="btn-restart"
                onClick={() => {
                  checkIsLedgerCroAppConnected(session);
                  setIsLedgerModalButtonLoading(true);
                }}
                loading={isLedgerModalButtonLoading}
                // style={{ height: '30px', margin: '0px', lineHeight: 1.0 }}
              >
                {t('general.connect')}
              </Button>
            ),
          ]}
          image={isLedgerCroAppConnected ? <SuccessCheckmark /> : <IconLedger />}
        >
          <div className="description">
            {isLedgerCroAppConnected
              ? t('home.ledgerModalPopup.tendermintAsset.description1')
              : t('home.ledgerModalPopup.tendermintAsset.description2')}
          </div>
        </LedgerModalPopup>
        <LedgerModalPopup
          isModalVisible={isLedgerEthAppConnectModalVisible}
          handleCancel={() => {
            setIsLedgerEthAppConnectModalVisible(false);
          }}
          handleOk={() => {
            setIsLedgerEthAppConnectModalVisible(false);
          }}
          title={
            isLedgerEthAppConnected
              ? t('home.ledgerModalPopup.evmAsset.title1')
              : t('home.ledgerModalPopup.evmAsset.title2')
          }
          footer={[
            isLedgerEthAppConnected ? (
              <></>
            ) : (
              <Button
                type="primary"
                size="small"
                className="btn-restart"
                onClick={() => {
                  checkIsLedgerEthAppConnected(session);
                  setIsLedgerModalButtonLoading(true);
                }}
                loading={isLedgerModalButtonLoading}
                // style={{ height: '30px', margin: '0px', lineHeight: 1.0 }}
              >
                {t('general.connect')}
              </Button>
            ),
          ]}
          image={isLedgerEthAppConnected ? <SuccessCheckmark /> : <IconLedger />}
        >
          <div className="description">
            {isLedgerEthAppConnected
              ? t('home.ledgerModalPopup.evmAsset.description1')
              : t('home.ledgerModalPopup.evmAsset.description2')}
          </div>
        </LedgerModalPopup>
      </Layout>
    </main>
  );
}

export default HomeLayout;
