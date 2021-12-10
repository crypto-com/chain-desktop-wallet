import React, { Dispatch, SetStateAction } from 'react';
import { Button, Drawer, Layout } from 'antd';
import BigNumber from 'bignumber.js';
import './RequestConfirmation.less';

import { scaledAmount, UserAsset } from '../../../../models/UserAsset';
import { Wallet } from '../../../../models/Wallet';
import { Dapp, DappBrowserIPC } from '../../types';

import { middleEllipsis } from '../../../../utils/utils';

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
  event: DappBrowserIPC.SendTransactionEvent | DappBrowserIPC.SignPersonalMessageEvent;
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

  let viewToRender: JSX.Element | undefined;

  if (event.name === 'signTransaction') {
    const networkFee = event ? new BigNumber(event.object?.gas).times(event.object?.gasPrice) : 0;
    const total = event ? new BigNumber(event.object?.value ?? '0').plus(networkFee) : 0;
    viewToRender = (
      <>
        <div className="row">
          <div className="title">Estimated Network Fee</div>
          <div className="title">{`${scaledAmount(networkFee.toString(), asset?.decimals ?? 1)} ${
            asset?.symbol
          }`}</div>
        </div>
        <div className="row">
          <div className="title">Total</div>
          <div className="title">{`${scaledAmount(total.toString(), asset?.decimals ?? 1)} ${
            asset?.symbol
          }`}</div>
        </div>
      </>
    );
  } else if (event.name === 'signPersonalMessage') {
    viewToRender = (
      <>
        <div className="row">
          <div className="title">Message: </div>
        </div>
        <pre
          style={{
            whiteSpace: 'pre-wrap',
          }}
        >
          {hexToUtf8(event.object.data)}
        </pre>
      </>
    );
  } else {
    // TODO: Handle other events
  }

  return (
    <Drawer visible={visible} className="request-confirmation" onClose={onClose}>
      <Layout>
        <Content>
          {dapp && (
            <div className="logo">
              <img src={dapp.logo} alt={dapp.alt} />
            </div>
          )}
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
          {viewToRender}
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
