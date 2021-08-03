import React, { useEffect, useRef, useState } from 'react';
import './home.less';
import 'antd/dist/antd.css';
import { Alert, Button, Checkbox, Dropdown, Form, Input, Layout, Menu, Spin } from 'antd';
import { Link, useHistory, useLocation } from 'react-router-dom';
import Icon, {
  CaretDownOutlined,
  DeleteOutlined,
  LoadingOutlined,
  PlusOutlined,
  ReloadOutlined,
  BankOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useRecoilState } from 'recoil';
import { useTranslation } from 'react-i18next';

import {
  sessionState,
  walletAssetState,
  walletListState,
  marketState,
  validatorListState,
  fetchingDBState,
  nftListState,
} from '../../recoil/atom';
import { ellipsis } from '../../utils/utils';
import WalletIcon from '../../assets/icon-wallet-grey.svg';
import IconHome from '../../svg/IconHome';
import IconSend from '../../svg/IconSend';
import IconReceive from '../../svg/IconReceive';
import IconStaking from '../../svg/IconStaking';
import IconNft from '../../svg/IconNft';
import IconWallet from '../../svg/IconWallet';
import ModalPopup from '../../components/ModalPopup/ModalPopup';
import SuccessModalPopup from '../../components/SuccessModalPopup/SuccessModalPopup';
import { walletService } from '../../service/WalletService';
import { Session } from '../../models/Session';
import packageJson from '../../../package.json';
import { LEDGER_WALLET_TYPE } from '../../service/LedgerService';
import { LedgerWalletMaximum } from '../../config/StaticConfig';
import { generalConfigService } from '../../storage/GeneralConfigService';

interface HomeLayoutProps {
  children?: React.ReactNode;
}

const { Sider } = Layout;

function HomeLayout(props: HomeLayoutProps) {
  const history = useHistory();
  const [confirmDeleteForm] = Form.useForm();
  const [deleteWalletAddress, setDeleteWalletAddress] = useState('');
  const [hasWallet, setHasWallet] = useState(true); // Default as true. useEffect will only re-render if result of hasWalletBeenCreated === false
  const [session, setSession] = useRecoilState(sessionState);
  const [userAsset, setUserAsset] = useRecoilState(walletAssetState);
  const [walletList, setWalletList] = useRecoilState(walletListState);
  const [marketData, setMarketData] = useRecoilState(marketState);
  const [validatorList, setValidatorList] = useRecoilState(validatorListState);
  const [nftList, setNftList] = useRecoilState(nftListState);
  const [fetchingDB, setFetchingDB] = useRecoilState(fetchingDBState);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [isConfirmDeleteVisible, setIsConfirmDeleteVisible] = useState(false);
  const [isConfirmationModalVisible, setIsConfirmationModalVisible] = useState(false);
  const [isSuccessDeleteModalVisible, setIsSuccessDeleteModalVisible] = useState(false);

  const [isAnnouncementVisible, setIsAnnouncementVisible] = useState(false);
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const didMountRef = useRef(false);

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
      await walletService.IBCAssetsFetch(fetchSession);
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
    setSession(currentSession);
    setUserAsset(currentAsset);
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

  useEffect(() => {
    const fetchDB = async () => {
      setFetchingDB(true);
      const hasWalletBeenCreated = await walletService.hasWalletBeenCreated();
      const currentSession = await walletService.retrieveCurrentSession();
      const currentAsset = await walletService.retrieveDefaultWalletAsset(currentSession);
      const allWalletsData = await walletService.retrieveAllWallets();
      const currentMarketData = await walletService.retrieveAssetPrice(
        currentAsset.mainnetSymbol,
        'usd',
      );

      const announcementShown = await generalConfigService.checkIfHasShownAnalyticsPopup();
      setHasWallet(hasWalletBeenCreated);
      setSession(currentSession);
      setUserAsset(currentAsset);
      setWalletList(allWalletsData);
      setMarketData(currentMarketData);

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
    };

    if (!didMountRef.current) {
      fetchDB();
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
    walletList,
    setWalletList,
    marketData,
    setMarketData,
    validatorList,
    setValidatorList,
    nftList,
    setNftList,
  ]);

  const HomeMenu = () => {
    const locationPath = useLocation().pathname;
    const paths = [
      '/home',
      '/staking',
      '/send',
      '/receive',
      '/settings',
      '/governance',
      '/nft',
      '/wallet',
    ];

    let menuSelectedKey = locationPath;
    if (!paths.includes(menuSelectedKey)) {
      menuSelectedKey = '/home';
    }

    return (
      <Menu theme="dark" mode="inline" defaultSelectedKeys={[menuSelectedKey]}>
        <Menu.Item key="/home" icon={<Icon component={IconHome} />}>
          <Link to="/home">{t('navbar.home')}</Link>
        </Menu.Item>
        <Menu.Item key="/staking" icon={<Icon component={IconStaking} />}>
          <Link to="/staking">{t('navbar.staking')}</Link>
        </Menu.Item>
        <Menu.Item key="/send" icon={<Icon component={IconSend} />}>
          <Link to="/send">{t('navbar.send')}</Link>
        </Menu.Item>
        <Menu.Item key="/receive" icon={<Icon component={IconReceive} />}>
          <Link to="/receive">{t('navbar.receive')}</Link>
        </Menu.Item>
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
      <Layout>
        <Sider className="home-sider">
          <div className="logo" />
          <div className="version">SAMPLE WALLET v{buildVersion}</div>
          <HomeMenu />
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
