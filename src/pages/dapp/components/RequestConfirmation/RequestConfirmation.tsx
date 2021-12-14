import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Button, Drawer, Layout } from 'antd';
import BigNumber from 'bignumber.js';
import numeral from 'numeral';
import { useTranslation } from 'react-i18next';
import './RequestConfirmation.less';

import {
  AssetMarketPrice,
  getAssetBalancePrice,
  scaledAmount,
  UserAsset,
} from '../../../../models/UserAsset';
import { Wallet } from '../../../../models/Wallet';
import { Session } from '../../../../models/Session';
import { SupportedChainName, SUPPORTED_CURRENCY } from '../../../../config/StaticConfig';
import { Dapp, DappBrowserIPC } from '../../types';

import { middleEllipsis, hexToUtf8, getAssetBySymbolAndChain } from '../../../../utils/utils';

const { Content, Footer } = Layout;

interface RequestConfirmationProps {
  event: DappBrowserIPC.Event;
  cronosAsset: UserAsset | undefined;
  allMarketData: AssetMarketPrice[];
  allAssets: UserAsset[];
  currentSession: Session;
  wallet: Wallet;
  visible: boolean;
  dapp?: Dapp;
  decryptedPhrase: string;
  confirmTxCallback:
    | {
        successCallback: Function;
        errorCallback: Function;
      }
    | undefined;
  setConfirmTxCallback: Dispatch<
    SetStateAction<{ successCallback: Function; errorCallback: Function } | undefined>
  >;
  setRequestConfirmationVisible: Dispatch<SetStateAction<boolean>>;
  onClose: (e: any) => void;
}

const RequestConfirmation = (props: RequestConfirmationProps) => {
  const {
    event,
    cronosAsset,
    allMarketData,
    allAssets,
    currentSession,
    wallet,
    visible,
    dapp,
    decryptedPhrase,
    confirmTxCallback,
    setConfirmTxCallback,
    setRequestConfirmationVisible,
    onClose,
  } = props;

  const [message, setMessage] = useState('');
  const [subMessage, setSubMessage] = useState('');
  const [currentAsset, setCurrentAsset] = useState<UserAsset | undefined>(cronosAsset);
  const [isContractAddressReview, setIsContractAddressReview] = useState(false);

  const [t] = useTranslation();

  const eventViewToRender = (_event: DappBrowserIPC.Event) => {
    if (_event.name === 'signTransaction') {
      const networkFee = _event
        ? new BigNumber(_event.object?.gas).times(_event.object?.gasPrice)
        : 0;
      const total = _event ? new BigNumber(_event.object?.value ?? '0').plus(networkFee) : 0;
      return (
        <>
          <div className="row">
            <div className="title">{t('dapp.requestConfirmation.networkFee.title')}</div>
            <div>{`${scaledAmount(networkFee.toString(), cronosAsset?.decimals ?? 1)} ${
              cronosAsset?.symbol
            }`}</div>
          </div>
          <div className="row">
            <div className="title">{t('dapp.requestConfirmation.total.title')}</div>
            <div>{`${scaledAmount(total.toString(), cronosAsset?.decimals ?? 1)} ${
              cronosAsset?.symbol
            }`}</div>
          </div>
        </>
      );
    }
    if (_event.name === 'signMessage') {
      return (
        <>
          <div className="row">
            <div className="title">{t('dapp.requestConfirmation.message.title')}: </div>
          </div>
          <pre className="signing-message">{_event.object.data}</pre>
        </>
      );
    }

    if (_event.name === 'signTypedMessage') {
      let displayMessage = '';
      const parsedRaw = JSON.parse(_event.object.raw);

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

    if (_event.name === 'signPersonalMessage') {
      return (
        <>
          <div className="row">
            <div className="title">{t('dapp.requestConfirmation.message.title')}: </div>
          </div>
          <pre className="signing-message">{hexToUtf8(_event.object.data)}</pre>
        </>
      );
    }

    if (_event.name === 'tokenApproval') {
      const fee = new BigNumber(_event.object.gas).times(_event.object.gasPrice).toString();
      const networkFee = fee;
      const total = fee;
      const { contractAddress } = _event.object.tokenData;

      return (
        <>
          <div className="row">
            <div className="title">{t('dapp.requestConfirmation.networkFee.title')}</div>
            <div>{`${scaledAmount(networkFee.toString(), cronosAsset?.decimals ?? 1)} ${
              cronosAsset?.symbol
            }`}</div>
          </div>
          <div className="row">
            <div className="title">{t('dapp.requestConfirmation.total.title')}</div>
            <div>{`${scaledAmount(total.toString(), cronosAsset?.decimals ?? 1)} ${
              cronosAsset?.symbol
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
        </>
      );
    }

    // TODO: Handle other events
    return <></>;
  };

  useEffect(() => {
    if (!event) {
      return;
    }
    if (event.name === 'signTransaction') {
      const assetMarketData =
        allMarketData[`${currentAsset?.mainnetSymbol}-${currentSession.currency}`];
      const total = new BigNumber(event.object?.value ?? '0').toString();
      const totalValue =
        assetMarketData &&
        assetMarketData.price &&
        currentAsset?.mainnetSymbol === assetMarketData.assetSymbol
          ? `${SUPPORTED_CURRENCY.get(assetMarketData.currency)?.symbol}${numeral(
              getAssetBalancePrice(currentAsset!, assetMarketData),
            ).format('0,0.00')} ${assetMarketData?.currency}`
          : `${SUPPORTED_CURRENCY.get(currentSession.currency)?.symbol}--`;

      setSubMessage(`${scaledAmount(total, currentAsset?.decimals ?? 1)} ${currentAsset?.symbol}`);
      setSubMessage(`≈${totalValue}`);
    }
    setSubMessage('');

    if (event.name === 'requestAccounts') {
      setMessage(t('dapp.requetConfirmation.requestAccounts.message'));
    } else if (event.name === 'signPersonalMessage') {
      setMessage(t('dapp.requetConfirmation.signPersonalMessage.message'));
    } else if (event.name === 'signTypedMessage' || event.name === 'signMessage') {
      setMessage(t('dapp.requetConfirmation.signMessage.message'));
    } else if (event.name === 'tokenApproval') {
      setMessage(
        t('dapp.requetConfirmation.tokenApproval.message', {
          name: dapp?.name,
          symbol: event.object.tokenData.symbol,
        }),
      );

      setSubMessage(`${dapp?.url}`);
      const asset = getAssetBySymbolAndChain(
        allAssets,
        event.object.tokenData.symbol,
        SupportedChainName.CRONOS,
      );
      setCurrentAsset(asset ?? cronosAsset);
    }
  }, [event]);

  return (
    <Drawer visible={visible} className="request-confirmation" onClose={onClose}>
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
          {event && eventViewToRender(event)}
        </Content>
        <Footer>
          <div className="row">
            <Button type="link" htmlType="button" onClick={onClose}>
              {t('general.reject')}
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              onClick={() => {
                confirmTxCallback?.successCallback(decryptedPhrase);
                setConfirmTxCallback(undefined);
                setRequestConfirmationVisible(false);
              }}
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
