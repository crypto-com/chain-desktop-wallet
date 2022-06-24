import { CheckOutlined } from '@ant-design/icons';
import { Modal, Spin } from 'antd';
import * as React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRecoilState } from 'recoil';
import { hexToNumber } from 'web3-utils';
import { EVMChainConfig } from '../../../models/Chain';
import { walletConnectPeerMetaAtom } from '../../../service/walletconnect/store';
import { useWalletConnect } from '../../../service/walletconnect/useWalletConnect';
import { useChainConfigs } from '../../dapp/browser/useChainConfigs';
import ChainSelect from '../../dapp/components/ChainSelect';
import { PeerMetaInfo } from './PeerMetaInfo';

export const ConnectModal = (props: { address: string }) => {
  const { rejectSession, approveSession, state } = useWalletConnect();
  const { loading, fetchingPeerMeta, connected } = state;
  const [peerMeta, setPeerMeta] = useRecoilState(walletConnectPeerMetaAtom);
  const [t] = useTranslation();
  const { selectedChain } = useChainConfigs();

  return (
    <Modal
      visible={fetchingPeerMeta || (!connected && peerMeta?.name !== undefined)}
      okText="Approve"
      okButtonProps={{ disabled: loading }}
      cancelText="Reject"
      closable={false}
      onCancel={() => {
        rejectSession();
      }}
      onOk={() => {
        approveSession(props.address, hexToNumber(selectedChain.chainId));
      }}
      width="555px"
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: '30px',
        }}
      >
        {loading && <Spin style={{ left: 'auto' }} />}
        {peerMeta?.name && (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <img
                style={{
                  width: '64px',
                  height: '64px',
                }}
                src={peerMeta?.icons?.[0]}
              />
              <div
                style={{
                  border: '1px dashed #1199FA',
                  width: '32px',
                }}
              />
              <img
                style={{
                  width: '64px',
                  height: '64px',
                }}
                src={'/icon.png'}
              />
            </div>
            <div style={{ fontSize: '21px', fontWeight: 'bold', marginTop: '16px' }}>
              {peerMeta.name} Would like to connect to:
            </div>
            <div style={{ marginTop: '16px', opacity: '0.5' }}>
              By allowing permission, you are allowing the following DApp to access your address:
            </div>
            <div style={{ opacity: '0.5', marginTop: '10px' }}>{peerMeta.url}</div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              <ChainSelect />
            </div>
            <div
              style={{
                marginTop: '20px',
                fontSize: '14px',
                color: '#0B1426',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div style={{ color: '#97A0B6' }}>Allow the DApp to: </div>
              <div
                style={{
                  textAlign: 'left',
                  marginTop: '16px',
                }}
              >
                <div>
                  <CheckOutlined style={{ marginRight: '10px', color: '#20BCA4' }} />
                  View your wallet balance and activity
                </div>
                <div>
                  <CheckOutlined style={{ marginRight: '10px', color: '#20BCA4' }} />
                  Request approval for transactions
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
