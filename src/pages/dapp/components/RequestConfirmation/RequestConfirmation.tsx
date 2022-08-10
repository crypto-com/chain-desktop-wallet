import React, { useEffect, useState } from 'react';
import { Button, Drawer, Layout, Spin } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import numeral from 'numeral';
import { useTranslation } from 'react-i18next';
import './RequestConfirmation.less';

import { useRecoilState } from 'recoil';
import { ethers } from 'ethers';
import BigNumber from 'bignumber.js';
import {
  AssetMarketPrice,
  getAssetAmountInFiat,
  scaledAmount,
  UserAsset,
  UserAssetType,
} from '../../../../models/UserAsset';
import { Wallet } from '../../../../models/Wallet';
import { Session } from '../../../../models/Session';
import { SUPPORTED_CURRENCY } from '../../../../config/StaticConfig';
import { Dapp, DappBrowserIPC } from '../../types';

import { middleEllipsis, hexToUtf8, isUnlimited } from '../../../../utils/utils';
import { walletService } from '../../../../service/WalletService';
import { walletAllAssetsState } from '../../../../recoil/atom';
import { useLedgerStatus } from '../../../../hooks/useLedgerStatus';
import { LEDGER_WALLET_TYPE } from '../../../../service/LedgerService';
import { ledgerNotification } from '../../../../components/LedgerNotification/LedgerNotification';
import { useChainConfigs } from '../../browser/useChainConfigs';
import { useBalance } from '../../hooks/useBalance';

import GasStepSelectEVMDApp from '../../../../components/GasCustomize/EVM/GasConfigDApp';

const { Content, Footer } = Layout;

interface RequestConfirmationProps {
  event: DappBrowserIPC.Event;
  cronosAsset: UserAsset | undefined;
  allMarketData: Map<string, AssetMarketPrice>;
  currentSession: Session;
  wallet: Wallet;
  visible: boolean;
  isConfirming: boolean;
  dapp?: Dapp;
  onConfirm: (info: {
    gasPrice: BigNumber;
    gasLimit: BigNumber;
    event: DappBrowserIPC.Event;
  }) => void;
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
    isConfirming,
    onConfirm,
    onCancel,
  } = props;

  const { selectedChain } = useChainConfigs();
  const { balance, isFetchingBalance } = useBalance(
    selectedChain.rpcUrls[0],
    cronosAsset?.address ?? '',
  );

  const [message, setMessage] = useState('');
  const [subMessage, setSubMessage] = useState('');
  const [isContractAddressReview, setIsContractAddressReview] = useState(false);
  const [isConfirmDisabled, setIsConfirmDisabled] = useState(false);
  const [allAssets, setAllAssets] = useRecoilState(walletAllAssetsState);
  const [gasPrice, setGasPrice] = useState(ethers.BigNumber.from((event.object as any)?.gasPrice ?? 0));
  const [gasLimit, setGasLimit] = useState(ethers.BigNumber.from((event.object as any)?.gas ?? 0));

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

  const getReadableSignedMessage = (event: DappBrowserIPC.SignPersonalMessageEvent
  ) => {

    let message = '';
    try {

      message = hexToUtf8(event.object.params[0]);
    } catch (error) {
      message = event.object.params[1];
    }

    return message;
  };

  const EventView = () => {

    if (event.name === 'signTransaction' || event.name === 'sendTransaction') {
      const networkFee = gasLimit.mul(gasPrice);
      // if (event.object.gasPrice) {
      //   networkFee = event ? ethers.BigNumber.from(event.object?.gas).mul(event.object?.gasPrice) : 0;
      // } else {
      //   networkFee = event.object.maxFeePerGas?.mul(event.object.gas) ?? 0;
      // }

      const total = event ? ethers.BigNumber.from(event.object?.value ?? '0').add(networkFee) : 0;

      const isDisabled = (balance ?? ethers.BigNumber.from('0')).lt(total);
      setIsConfirmDisabled(isDisabled);

      return (
        <>
          <GasStepSelectEVMDApp config={selectedChain} gasLimit={new BigNumber(gasLimit.toString())} gasPrice={new BigNumber(gasPrice.toString())} onChange={(_gasLimit, _gasPrice) => {
            setGasLimit(ethers.BigNumber.from(_gasLimit.toString()));
            setGasPrice(ethers.BigNumber.from(_gasPrice.toString()));
          }} />
          <div className="row">
            <div className="title">{t('dapp.requestConfirmation.total.title')}</div>
            <div>{`${scaledAmount(total.toString(), selectedChain.nativeCurrency.decimals)} ${
              selectedChain.nativeCurrency.symbol
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
          let value = parsedRaw.message[key];
          if (typeof value !== 'string') {
            value = JSON.stringify(value);
          }

          displayMessage = displayMessage.concat(`${key}: \n${value}\n\n`);
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
          <pre className="signing-message">{getReadableSignedMessage(event)}</pre>
        </>
      );
    }

    if (event.name === 'tokenApproval') {
      const networkFee = event ? gasLimit.mul(gasPrice) : 0;
      const total = networkFee;
      const { contractAddress } = event.object.tokenData;

      const isDisabled = (balance ?? ethers.BigNumber.from(0)).lt(total);
      setIsConfirmDisabled(isDisabled);

      return (
        <>
          <GasStepSelectEVMDApp config={selectedChain} gasLimit={new BigNumber(gasLimit.toString())} gasPrice={new BigNumber(gasPrice.toString())} onChange={(_gasLimit, _gasPrice) => {
            setGasLimit(ethers.BigNumber.from(_gasLimit.toString()));
            setGasPrice(ethers.BigNumber.from(_gasPrice.toString()));
          }} />
          <div className="row">
            <div className="title">{t('dapp.requestConfirmation.total.title')}</div>
            <div>{`${scaledAmount(total.toString(), selectedChain.nativeCurrency.decimals)} ${
              selectedChain.nativeCurrency.symbol
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
          {event.name === 'tokenApproval' && (
            <div className="row">
              <div className="title">{t('settings.revoke.amount')}</div>
              <div>
                {isUnlimited(ethers.BigNumber.from(event.object.amount))
                  ? `${t('settings.revoke.unlimited')} ${event.object.tokenData.symbol}`
                  : `${scaledAmount(
                    event.object.amount,
                    Number(event.object.tokenData.decimals),
                  )} ${event.object.tokenData.symbol}`}
              </div>
            </div>
          )}
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
    if (event.name === 'signTransaction' || event.name === 'sendTransaction') {
      // TODO:
      const assetMarketData = allMarketData.get(
        `${UserAssetType.CRC_20_TOKEN}-${selectedChain.nativeCurrency.symbol}-${currentSession.currency}`,
      );
      const totalScaledAmount = scaledAmount(
        ethers.BigNumber.from(event.object?.value ?? '0').toString(),
        selectedChain.nativeCurrency.decimals,
      );
      const totalValue =
        assetMarketData &&
        assetMarketData.price &&
        selectedChain.nativeCurrency.symbol === assetMarketData.assetSymbol
          ? `${SUPPORTED_CURRENCY.get(assetMarketData.currency)?.symbol}${numeral(
            getAssetAmountInFiat(totalScaledAmount, assetMarketData),
          ).format('0,0.00')} ${assetMarketData?.currency}`
          : `${SUPPORTED_CURRENCY.get(currentSession.currency)?.symbol}--`;

      setMessage(`${totalScaledAmount} ${selectedChain.nativeCurrency.symbol}`);
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
    }
  }, [event, allAssets]);

  return (
    <Drawer visible={visible} className="request-confirmation" onClose={onCancel}>
      <Layout>
        <Content>
          {dapp && (
            <>
              <div className="logo">
                <img style={{ width: '60px', height: '60px' }} src={dapp.logo} alt={dapp.alt} />
                <div >{dapp.url}</div>
              </div>
            </>
          )}
          {message && <div className="message">{message}</div>}
          {subMessage && <div className="sub-message">{subMessage}</div>}
          <div className="wallet-detail">
            <div className="row">
              <div className="name">{wallet.name}</div>
              <div className="s-title">{`${selectedChain.nativeCurrency.symbol} ${t(
                'general.balance',
              )}`}</div>
            </div>
            <div className="row">
              <div className="address">{middleEllipsis(cronosAsset?.address ?? '', 6)}</div>
              {isFetchingBalance ? (
                <Spin
                  style={{
                    marginLeft: '60px',
                  }}
                />
              ) : (
                <div className="balance">{`${scaledAmount(
                  balance?.toString(),
                  selectedChain.nativeCurrency.decimals,
                )} ${selectedChain.nativeCurrency.symbol}`}</div>
              )}
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
                  gasLimit: new BigNumber(gasLimit.toString()),
                  gasPrice: new BigNumber(gasPrice.toString()),
                  event
                });
              }}
              loading={isConfirming}
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
