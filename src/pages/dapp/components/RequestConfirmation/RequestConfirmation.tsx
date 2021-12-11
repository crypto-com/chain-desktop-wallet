import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Button, Drawer, Layout } from 'antd';
import BigNumber from 'bignumber.js';
import numeral from 'numeral';
import './RequestConfirmation.less';

import {
  AssetMarketPrice,
  getAssetBalancePrice,
  scaledAmount,
  UserAsset,
} from '../../../../models/UserAsset';
import { Wallet } from '../../../../models/Wallet';
import { Dapp, DappBrowserIPC } from '../../types';

import { middleEllipsis, getAssetBySymbolAndChain } from '../../../../utils/utils';
import { TokenApprovalRequestData } from '../../browser/TransactionDataParser';
import { SupportedChainName, SUPPORTED_CURRENCY } from '../../../../config/StaticConfig';
import { Session } from '../../../../models/Session';

const { Content, Footer } = Layout;

function hexToUtf8(s: string) {
  return decodeURIComponent(
    s
      .replace('0x', '')
      .replace(/\s+/g, '') // remove spaces
      .replace(/[0-9a-f]{2}/g, '%$&'), // add '%' before each 2 characters
  );
}

interface RequestConfirmationProps {
  event: DappBrowserIPC.Event;
  data: { request: TokenApprovalRequestData; gas: number; gasPrice: string };
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
    data,
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

  const eventViewToRender = (_event: DappBrowserIPC.Event) => {
    if (DappBrowserIPC.instanceOfSendTransactionEvent(_event)) {
      const networkFee = _event
        ? new BigNumber(_event.object?.gas).times(_event.object?.gasPrice)
        : 0;
      const total = _event ? new BigNumber(_event.object?.value ?? '0').plus(networkFee) : 0;
      return (
        <>
          <div className="row">
            <div className="title">Estimated Network Fee</div>
            <div>{`${scaledAmount(networkFee.toString(), cronosAsset?.decimals ?? 1)} ${
              cronosAsset?.symbol
            }`}</div>
          </div>
          <div className="row">
            <div className="title">Total</div>
            <div>{`${scaledAmount(total.toString(), cronosAsset?.decimals ?? 1)} ${
              cronosAsset?.symbol
            }`}</div>
          </div>
        </>
      );
    }
    if (DappBrowserIPC.instanceOfSignPersonalMessageEvent(_event)) {
      return (
        <>
          <div className="row">
            <div className="title">Message: </div>
          </div>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
            }}
          >
            {hexToUtf8(_event.object.data)}
          </pre>
        </>
      );
    }
    // TODO: Handle other events
    return <></>;
  };

  const dataViewToRender = (_data: {
    request: TokenApprovalRequestData;
    gas: number;
    gasPrice: string;
  }) => {
    const fee = new BigNumber(_data.gas).times(_data.gasPrice).toString();
    const networkFee = fee;
    const total = fee;
    const { contractAddress } = _data.request.tokenData;

    return (
      <>
        <div className="row">
          <div className="title">Estimated Network Fee</div>
          <div>{`${scaledAmount(networkFee.toString(), cronosAsset?.decimals ?? 1)} ${
            cronosAsset?.symbol
          }`}</div>
        </div>
        <div className="row">
          <div className="title">Total</div>
          <div>{`${scaledAmount(total.toString(), cronosAsset?.decimals ?? 1)} ${
            cronosAsset?.symbol
          }`}</div>
        </div>
        <div className="row">
          <div className="title">Contract Address</div>
          <a onClick={() => setIsContractAddressReview(!isContractAddressReview)}>
            {isContractAddressReview ? 'Hide' : 'Review'}
          </a>
        </div>
        <div
          className="contract-address"
          hidden={!isContractAddressReview}
        >{`${contractAddress}`}</div>
      </>
    );
  };

  useEffect(() => {
    if (event) {
      if (DappBrowserIPC.instanceOfSendTransactionEvent(event)) {
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

        setMessage(`${scaledAmount(total, currentAsset?.decimals ?? 1)} ${currentAsset?.symbol}`);
        setSubMessage(`≈${totalValue}`);
      }
    }
    if (data) {
      setMessage(`Allow ${dapp?.name} to access your ${data.request.tokenData.symbol}?`);
      setSubMessage(`${dapp?.url}`);
      const asset = getAssetBySymbolAndChain(
        allAssets,
        data.request.tokenData.symbol,
        SupportedChainName.CRONOS,
      );
      setCurrentAsset(asset ?? cronosAsset);
    }
  }, [event, data]);

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
              <div className="s-title">{`${currentAsset?.symbol} Balance`}</div>
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
          {data && dataViewToRender(data)}
        </Content>
        <Footer>
          <div className="row">
            <Button type="link" htmlType="button" onClick={onClose}>
              Reject
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
              Confirm
            </Button>
          </div>
        </Footer>
      </Layout>
    </Drawer>
  );
};

export default RequestConfirmation;
