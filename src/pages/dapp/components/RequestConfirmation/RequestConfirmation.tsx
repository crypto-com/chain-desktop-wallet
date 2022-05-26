import React, { useEffect, useState } from 'react';
import { Button, Drawer, Layout } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import BigNumber from 'bignumber.js';
import numeral from 'numeral';
import { useTranslation } from 'react-i18next';
import './RequestConfirmation.less';

import { useRecoilState } from 'recoil';
import { ethers } from 'ethers';
import {
  AssetMarketPrice,
  getAssetAmountInFiat,
  scaledAmount,
  UserAsset,
} from '../../../../models/UserAsset';
import { Wallet } from '../../../../models/Wallet';
import { Session } from '../../../../models/Session';
import { SupportedChainName, SUPPORTED_CURRENCY } from '../../../../config/StaticConfig';
import { Dapp, DappBrowserIPC } from '../../types';

import { middleEllipsis, hexToUtf8, getAssetBySymbolAndChain, isUnlimited } from '../../../../utils/utils';
import { walletService } from '../../../../service/WalletService';
import { walletAllAssetsState } from '../../../../recoil/atom';
import { useLedgerStatus } from '../../../../hooks/useLedgerStatus';
import { LEDGER_WALLET_TYPE } from '../../../../service/LedgerService';
import { ledgerNotification } from '../../../../components/LedgerNotification/LedgerNotification';
import GasStepSelectEVMDApp from '../../../../components/GasCustomize/EVM/GasSelectDApp';

const { Content, Footer } = Layout;

interface RequestConfirmationProps {
  event: DappBrowserIPC.Event;
  cronosAsset: UserAsset | undefined;
  allMarketData: Map<string, AssetMarketPrice>;
  currentSession: Session;
  wallet: Wallet;
  visible: boolean;
  dapp?: Dapp;
  onConfirm: (info: { gasPrice: BigNumber, gasLimit: BigNumber, event: DappBrowserIPC.Event }) => void;
  onCancel: () => void;
}

const RequestConfirmation = (props: RequestConfirmationProps) => {
  const {
    event,
    cronosAsset,
    allMarketData,
    currentSession,
    wallet,
    visible,
    dapp,
    onConfirm,
    onCancel,
  } = props;

  const [message, setMessage] = useState('');
  const [subMessage, setSubMessage] = useState('');
  const [currentAsset, setCurrentAsset] = useState<UserAsset | undefined>(cronosAsset);
  const [isContractAddressReview, setIsContractAddressReview] = useState(false);
  const [isConfirmDisabled, setIsConfirmDisabled] = useState(false);
  const [allAssets, setAllAssets] = useRecoilState(walletAllAssetsState);
  const [gasPrice, setGasPrice] = useState(new BigNumber((event.object as any)?.gasPrice ?? 0));
  const [gasLimit, setGasLimit] = useState(new BigNumber((event.object as any)?.gas ?? 0));

  const { isLedgerConnected } = useLedgerStatus({ asset: cronosAsset });

  useEffect(() => {
    if (currentSession.wallet.walletType === LEDGER_WALLET_TYPE && isLedgerConnected === false) {
      ledgerNotification(currentSession.wallet, cronosAsset!);
    }
  }, [isLedgerConnected, currentSession, cronosAsset]);

  const [t] = useTranslation();

  useEffect(() => {
    const fetch = async () => {
      const sessionData = await walletService.retrieveCurrentSession();
      await walletService.syncBalancesData(sessionData);
      const assets = await walletService.retrieveCurrentWalletAssets(sessionData);
      setAllAssets(assets);
    };
    fetch();
  }, []);

  const EventView = () => {
    setIsConfirmDisabled(false);

    if (event.name === 'signTransaction') {
      const networkFee = event ? gasLimit.times(gasPrice) : 0;
      const total = event ? new BigNumber(event.object?.value ?? '0').plus(networkFee) : 0;

      const isDisabled = new BigNumber(cronosAsset?.balance ?? '0').isLessThan(total);
      setIsConfirmDisabled(isDisabled);

      return (
        <>
          <GasStepSelectEVMDApp asset={cronosAsset} gasLimit={gasLimit} gasPrice={gasPrice} onChange={(_gasLimit, _gasPrice) => {
            setGasLimit(_gasLimit)
            setGasPrice(_gasPrice)
          }} />
          <div className="row">
            <div className="title">{t('dapp.requestConfirmation.total.title')}</div>
            <div>{`${scaledAmount(total.toString(), cronosAsset?.decimals ?? 1)} ${cronosAsset?.symbol
              }`}</div>
          </div>
        </>
      );
    }
    if (event.name === 'signMessage') {
      return (
        <>
          <div className="row">
            <div className="title">{t('dapp.requestConfirmation.message.title')}: </div>
          </div>
          <pre className="signing-message">{event.object.data}</pre>
        </>
      );
    }

    if (event.name === 'signTypedMessage') {
      let displayMessage = '';
      const parsedRaw = JSON.parse(event.object.raw);

      if (parsedRaw.message) {
        Object.keys(parsedRaw.message).forEach(key => {
          displayMessage = displayMessage.concat(`${key}: \n${parsedRaw.message[key]}\n\n`);
        });
      }

      return (
        <>
          <div className="row">
            <div className="title">{t('dapp.requestConfirmation.message.title')}</div>
          </div>
          <pre className="signing-message">{displayMessage}</pre>
        </>
      );
    }

    if (event.name === 'signPersonalMessage') {
      return (
        <>
          <div className="row">
            <div className="title">{t('dapp.requestConfirmation.message.title')}: </div>
          </div>
          <pre className="signing-message">{hexToUtf8(event.object.data)}</pre>
        </>
      );
    }

    if (event.name === 'tokenApproval') {
      const networkFee = event ? gasLimit.times(gasPrice) : 0;
      const total = networkFee;
      const { contractAddress } = event.object.tokenData;

      const isDisabled = new BigNumber(cronosAsset?.balance ?? '0').isLessThan(total);
      setIsConfirmDisabled(isDisabled);

      return (
        <>
          <GasStepSelectEVMDApp asset={cronosAsset} gasLimit={gasLimit} gasPrice={gasPrice} onChange={(_gasLimit, _gasPrice) => {
            setGasLimit(_gasLimit)
            setGasPrice(_gasPrice)
          }} />
          <div className="row">
            <div className="title">{t('dapp.requestConfirmation.total.title')}</div>
            <div>{`${scaledAmount(total.toString(), cronosAsset?.decimals ?? 1)} ${cronosAsset?.symbol
              }`}</div>
          </div>

          <div className="row">
            <div className="title">{t('dapp.requestConfirmation.contractAddress.title')}</div>
            <a onClick={() => setIsContractAddressReview(!isContractAddressReview)}>
              {isContractAddressReview ? t('general.hide') : t('general.review')}
            </a>
          </div>
          <div
            className="contract-address"
            hidden={!isContractAddressReview}
          >{`${contractAddress}`}</div>
          {
            event.name === 'tokenApproval' && <div className="row">
              <div className="title">{t('settings.revoke.amount')}</div>
              <div>{isUnlimited(ethers.BigNumber.from(event.object.amount)) ? `${t('settings.revoke.unlimited')} ${event.object.tokenData.symbol}` : `${scaledAmount(event.object.amount, Number(event.object.tokenData.decimals))} ${event.object.tokenData.symbol}`}</div>
            </div>
          }
        </>
      );
    }

    // TODO: Handle other events
    return <></>;
  };

  useEffect(() => {
    setMessage('');
    setSubMessage('');
    if (!event) {
      return;
    }
    if (event.name === 'signTransaction') {
      const assetMarketData = allMarketData.get(
        `${currentAsset?.assetType}-${currentAsset?.mainnetSymbol}-${currentSession.currency}`,
      );
      const totalScaledAmount = scaledAmount(
        new BigNumber(event.object?.value ?? '0').toString(),
        currentAsset?.decimals ?? 1,
      );
      const totalValue =
        assetMarketData &&
          assetMarketData.price &&
          currentAsset?.mainnetSymbol === assetMarketData.assetSymbol
          ? `${SUPPORTED_CURRENCY.get(assetMarketData.currency)?.symbol}${numeral(
            getAssetAmountInFiat(totalScaledAmount, assetMarketData),
          ).format('0,0.00')} ${assetMarketData?.currency}`
          : `${SUPPORTED_CURRENCY.get(currentSession.currency)?.symbol}--`;

      setMessage(`${totalScaledAmount} ${currentAsset?.symbol}`);
      setSubMessage(`≈${totalValue}`);
    }
    if (event.name === 'requestAccounts') {
      setMessage(t('dapp.requestConfirmation.requestAccounts.message'));
    } else if (event.name === 'signPersonalMessage') {
      setMessage(t('dapp.requestConfirmation.signPersonalMessage.message'));
    } else if (event.name === 'signTypedMessage' || event.name === 'signMessage') {
      setMessage(t('dapp.requestConfirmation.signMessage.message'));
    } else if (event.name === 'tokenApproval') {
      setMessage(
        t('dapp.requestConfirmation.tokenApproval.message', {
          name: dapp?.name,
          symbol: event.object.tokenData.symbol,
        }),
      );

      setSubMessage(`${dapp?.url ?? ''}`);
      const asset = getAssetBySymbolAndChain(
        allAssets,
        event.object.tokenData.symbol,
        SupportedChainName.CRONOS,
      );
      setCurrentAsset(asset ?? cronosAsset);
    }
  }, [event, allAssets]);

  return (
    <Drawer visible={visible} className="request-confirmation" onClose={onCancel}>
      <Layout>
        <Content>
          {dapp && (
            <div className="logo">
              <img src={dapp.logo} alt={dapp.alt} />
            </div>
          )}
          {message && <div className="message">{message}</div>}
          {subMessage && <div className="sub-message">{subMessage}</div>}
          <div className="wallet-detail">
            <div className="row">
              <div className="name">{wallet.name}</div>
              <div className="s-title">{`${currentAsset?.symbol} ${t('general.balance')}`}</div>
            </div>
            <div className="row">
              <div className="address">{middleEllipsis(currentAsset?.address ?? '', 6)}</div>
              <div className="balance">{`${scaledAmount(
                currentAsset?.balance ?? '0',
                currentAsset?.decimals ?? 1,
              )} ${currentAsset?.symbol}`}</div>
            </div>
          </div>
          {event && <EventView />}
        </Content>
        <Footer>
          <div style={{ color: '#ff4d4f' }} hidden={!isConfirmDisabled}>
            <ExclamationCircleOutlined style={{ marginRight: '6px' }} />
            <span>{t('dapp.requestConfirmation.error.insufficientBalance')}</span>
          </div>
          <div className="row">
            <Button type="link" htmlType="button" onClick={onCancel}>
              {t('general.reject')}
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              onClick={() => {
                onConfirm({
                  gasLimit,
                  gasPrice,
                  event
                })
              }}
              disabled={
                isConfirmDisabled ||
                (!isLedgerConnected && currentSession.wallet.walletType === LEDGER_WALLET_TYPE)
              }
            >
              {t('general.confirm')}
            </Button>
          </div>
        </Footer>
      </Layout>
    </Drawer>
  );
};

export default RequestConfirmation;
