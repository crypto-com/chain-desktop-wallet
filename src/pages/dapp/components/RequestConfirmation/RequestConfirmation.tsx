import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Button, Drawer, Layout } from 'antd';
import BigNumber from 'bignumber.js';
import './RequestConfirmation.less';

import { scaledAmount, UserAsset } from '../../../../models/UserAsset';
import { Wallet } from '../../../../models/Wallet';
import { Dapp, DappBrowserIPC } from '../../types';

import { middleEllipsis } from '../../../../utils/utils';
import { TokenApprovalRequestData } from '../../browser/TransactionDataParser';

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
  asset: UserAsset | undefined;
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
    asset,
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
            <div>{`${scaledAmount(networkFee.toString(), asset?.decimals ?? 1)} ${
              asset?.symbol
            }`}</div>
          </div>
          <div className="row">
            <div className="title">Total</div>
            <div>{`${scaledAmount(total.toString(), asset?.decimals ?? 1)} ${asset?.symbol}`}</div>
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
          <div>{`${scaledAmount(networkFee.toString(), asset?.decimals ?? 1)} ${
            asset?.symbol
          }`}</div>
        </div>
        <div className="row">
          <div className="title">Total</div>
          <div>{`${scaledAmount(total.toString(), asset?.decimals ?? 1)} ${asset?.symbol}`}</div>
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
    // if(event) {
    //   if(DappBrowserIPC.instanceOfSendTransactionEvent(event)){
    //     setMessage(``);
    //   }
    // }
    if (data) {
      setMessage(`Allow ${dapp?.name} to access your ${data.request.tokenData.symbol}?`);
      setSubMessage(`${dapp?.url}`);
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
              <div className="s-title">{`${asset?.symbol} Balance`}</div>
            </div>
            <div className="row">
              <div className="address">{middleEllipsis(asset?.address ?? '', 6)}</div>
              <div className="balance">{`${scaledAmount(
                asset?.balance ?? '0',
                asset?.decimals ?? 1,
              )} ${asset?.symbol}`}</div>
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
