import React, { Dispatch, SetStateAction } from 'react';
import { Button, Drawer, Layout } from 'antd';
import BigNumber from 'bignumber.js';
import './RequestConfirmation.less';

import { scaledAmount, UserAsset } from '../../../../models/UserAsset';
import { Wallet } from '../../../../models/Wallet';
import { Dapp, DappBrowserIPC } from '../../types';

import { middleEllipsis } from '../../../../utils/utils';

const { Content, Footer } = Layout;

interface RequestConfirmationProps {
  event: DappBrowserIPC.SendTransactionEvent;
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
    onClose,
  } = props;

  const networkFee = event ? new BigNumber(event.object?.gas).times(event.object?.gasPrice) : 0;
  const total = event ? new BigNumber(event.object?.value ?? '0').plus(networkFee) : 0;

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
