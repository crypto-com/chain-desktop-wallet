import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode.react';
import { useRecoilValue } from 'recoil';
import numeral from 'numeral';
import { useTranslation } from 'react-i18next';
import './receive.less';
import 'antd/dist/antd.css';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Layout, Button, Table, Avatar, notification } from 'antd';
import { CopyOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import {
  sessionState,
  marketState,
  walletAssetState,
  walletAllAssetsState,
} from '../../recoil/atom';
import { Session } from '../../models/Session';
import { getAssetBalancePrice, UserAsset, UserAssetType } from '../../models/UserAsset';
import { getUIDynamicAmount } from '../../utils/NumberUtils';
import { LEDGER_WALLET_TYPE, createLedgerDevice } from '../../service/LedgerService';
import { AnalyticsService } from '../../service/analytics/AnalyticsService';
import logoCro from '../../assets/AssetLogo/cro.png';

const { Header, Content, Footer } = Layout;

const ReceivePage = () => {
  const session: Session = useRecoilValue<Session>(sessionState);
  const userAsset = useRecoilValue(walletAssetState);
  const walletAllAssets = useRecoilValue(walletAllAssetsState);
  const marketData = useRecoilValue(marketState);
  const [isLedger, setIsLedger] = useState(false);
  const [currentAsset, setCurrentAsset] = useState<UserAsset>();
  const [isAssetVisible, setIsAssetVisible] = useState(false);
  const didMountRef = useRef(false);
  const analyticsService = new AnalyticsService(session);

  const [t] = useTranslation();

  useEffect(() => {
    const { walletType } = session.wallet;
    setIsLedger(LEDGER_WALLET_TYPE === walletType);
    if (!didMountRef.current) {
      didMountRef.current = true;
      analyticsService.logPage('Receive');
    }
  });

  const clickCheckLedger = async () => {
    try {
      const { addressIndex, walletType, config } = session.wallet;
      const addressprefix = config.network.addressPrefix;
      if (LEDGER_WALLET_TYPE === walletType) {
        const device = createLedgerDevice();
        await device.getAddress(addressIndex, addressprefix, true);
      }
    } catch (e) {
      notification.error({
        message: t('receive.notification.ledgerConnect.message'),
        description: t('receive.notification.ledgerConnect.description'),
        placement: 'topRight',
        duration: 3,
      });
    }
  };

  const onCopyClick = () => {
    setTimeout(() => {
      notification.success({
        message: t('receive.notification.addressCopy.message'),
        description: t('receive.notification.addressCopy.description'),
        placement: 'topRight',
        duration: 2,
        key: 'copy',
      });
    }, 100);
  };

  const assetIcon = asset => {
    const { assetType, icon_url, symbol } = asset;
    switch (assetType) {
      case UserAssetType.TENDERMINT:
        return <img src={logoCro} alt="cro" className="asset-icon" />;
      case UserAssetType.EVM:
        return <img src={icon_url} alt="cronos" className="asset-icon" />;
      case UserAssetType.IBC:
        return <Avatar>{symbol[0].toUpperCase()}</Avatar>;
      default:
        return <Avatar>{symbol[0].toUpperCase()}</Avatar>;
    }
  };

  const AssetColumns = [
    {
      title: 'Asset',
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
      title: 'Price',
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
      title: 'Balance',
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
      title: 'Value',
      // dataIndex: 'value',
      key: 'value',
      render: record => (
        <>
          {marketData && marketData.price && record.mainnetSymbol === marketData.assetSymbol
            ? `${numeral(getAssetBalancePrice(userAsset, marketData)).format('$0,0.00')} ${
                marketData?.currency
              }`
            : '$--'}
        </>
      ),
    },
    // {
    //   title: 'Action',
    //   key: 'action',
    //   render: record => {
    //     return <>
    //     {record.symbol}
    //     </>
    //   }
    // }
  ];

  return (
    <Layout className="site-layout">
      <Header className="site-layout-background">{t('receive.title')}</Header>
      <div className="header-description">{t('receive.description')}</div>
      <Content>
        <div className="site-layout-background receive-content">
          <div className="container">
            {isAssetVisible ? (
              <Layout className="asset-detail">
                <Content>
                  <a>
                    <div
                      className="back-button"
                      onClick={() => setIsAssetVisible(false)}
                      style={{ fontSize: '16px' }}
                    >
                      <ArrowLeftOutlined style={{ fontSize: '16px', color: '#1199fa' }} /> Back to
                      Asset List
                    </div>
                  </a>
                  <div className="title">
                    {assetIcon(currentAsset)}
                    {currentAsset?.name} ({currentAsset?.symbol})
                  </div>
                  <div className="address">
                    <QRCode value={session.wallet.address} size={180} />
                    <div className="name">{session.wallet.name}</div>
                  </div>
                  <CopyToClipboard text={session.wallet.address}>
                    <div className="copy" onClick={onCopyClick}>
                      {session.wallet.address}
                      <CopyOutlined />
                    </div>
                  </CopyToClipboard>
                  {isLedger && (
                    <div className="ledger">
                      <Button type="primary" onClick={clickCheckLedger}>
                        {t('receive.button')}
                      </Button>
                    </div>
                  )}
                </Content>
              </Layout>
            ) : (
              <Table
                columns={AssetColumns}
                dataSource={walletAllAssets}
                className="asset-table"
                onRow={record => {
                  return {
                    onClick: () => {
                      setCurrentAsset(record);
                      setIsAssetVisible(true);
                    }, // click row
                  };
                }}
                // pagination={false}
              />
            )}
          </div>
        </div>
      </Content>
      <Footer />
    </Layout>
  );
};

export default ReceivePage;
