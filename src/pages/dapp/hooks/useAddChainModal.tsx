import * as React from 'react';
import { useState } from 'react';
import { Modal } from 'antd';
import { ethers } from 'ethers';
import { DappBrowserIPC } from '../types';

export const useAddChainModal = () => {
  const [m, setM] = useState({
    destroy: () => {},
  });

  const [isShowing, setIsShowing] = useState(false);

  function showWithConfig(props: {
    dappURL: string;
    faviconURL: string;
    config: DappBrowserIPC.EthereumChainConfig;
    onCancel: () => void;
    onApprove: () => void;
  }) {
    if (isShowing) {
      return;
    }
    const mm = Modal.info({
      title: '',
      icon: null,
      visible: true,
      onCancel: props.onCancel,
      onOk: props.onApprove,
      okText: 'Approve',
      cancelText: 'Cancel',
      okCancel: true,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', margin: 'auto' }}>
            {props.faviconURL && (
              <img
                src={props.faviconURL}
                style={{ width: '20px', height: '20px', marginRight: '6px' }}
                alt="dapp-favicon"
              />
            )}
            <span>{props.dappURL}</span>
          </div>
          <div style={{ fontSize: '20px', textAlign: 'center', marginTop: '12px' }}>
            Wants to Add A Network
          </div>
          <div style={{ width: '', margin: 'auto', textAlign: 'left', marginTop: '30px' }}>
            {[
              {
                title: 'Network Name',
                value: props.config.chainName,
              },
              {
                title: 'Network ID',
                value: ethers.BigNumber.from(props.config.chainId).toString(),
              },
              {
                title: 'Currency',
                value: props.config.nativeCurrency.symbol,
              },
              {
                title: 'RPC URL',
                value: props.config.rpcUrls[0],
              },
              {
                title: 'Explorer URL',
                value: props.config.blockExplorerUrls[0],
              },
            ].map(({ title, value }) => {
              return (
                <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '10px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{title}</div>
                  <div>{value}</div>
                </div>
              );
            })}
          </div>
        </div>
      ),
    });
    setM(mm);
    setIsShowing(true);
  }

  function dismiss() {
    m.destroy();
    setIsShowing(false);
  }

  return {
    showWithConfig,
    dismiss,
  };
};
