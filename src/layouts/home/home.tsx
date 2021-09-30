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
import IconWallet from '../../svg/IconWallet';
import ModalPopup from '../../components/ModalPopup/ModalPopup';
import SuccessModalPopup from '../../components/SuccessModalPopup/SuccessModalPopup';
import { walletService } from '../../service/WalletService';
import { Session } from '../../models/Session';
import { SettingsDataUpdate } from '../../models/Wallet';
import packageJson from '../../../package.json';
import { LEDGER_WALLET_TYPE } from '../../service/LedgerService';
import { LedgerWalletMaximum, MAX_INCORRECT_ATTEMPTS_ALLOWED, SHOW_WARNING_INCORRECT_ATTEMPTS } from '../../config/StaticConfig';
import { generalConfigService } from '../../storage/GeneralConfigService';
import PasswordFormModal from '../../components/PasswordForm/PasswordFormModal';
import { secretStoreService } from '../../storage/SecretStoreService';
import SessionLockModal from '../../components/PasswordForm/SessionLockModal';

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

    setSession(currentSession);
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
    }, 15_000);
  };

  const checkCorrectExplorerUrl = (walletSession?: Session) => {
    if (!walletSession || !walletSession.wallet) {
      return;
    }

    setTimeout(async () => {
      if (!walletSession.wallet.config.explorer) {
        const updateExplorerUrlNotificationKey = 'updateExplorerUrlNotificationKey';

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
      setSession(currentSession);
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
      checkCorrectExplorerUrl(currentSession);
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
            if (latestIncorrectAttemptCount >= (MAX_INCORRECT_ATTEMPTS_ALLOWED - SHOW_WARNING_INCORRECT_ATTEMPTS)) {
              errorText = t('general.sessionLockModal.errorSelfDestruct')
                .replace('*N*', String(latestIncorrectAttemptCount))
                .replace('#T#', String(MAX_INCORRECT_ATTEMPTS_ALLOWED - latestIncorrectAttemptCount))
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
              notification.warning({
                message: 'App Locked',
                description: 'The app will be locked shortly',
                duration: 3,
                placement: 'topRight',
              });
              setTimeout(() => {
                setIsSessionLockModalVisible(true);
              }, 3 * 1000);
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
      </Layout>
    </main>
  );
}

export default HomeLayout;
