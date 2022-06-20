import * as React from 'react';
import { useState } from 'react';
import { Modal } from 'antd';
import { ethers } from 'ethers';
import { useTranslation } from 'react-i18next';
import { EVMChainConfig } from '../../../models/Chain';

export const useAddChainModal = () => {
  const [m, setM] = useState({
    destroy: () => {},
  });

  const [isShowing, setIsShowing] = useState(false);
  const [t] = useTranslation();

  function showWithConfig(props: {
    dappURL: string;
    faviconURL: string;
    config: EVMChainConfig;
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
      okText: t('Approve'),
      cancelText: t('general.cancel'),
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
            {t('Wants to Add A Network')}
          </div>
          <div style={{ width: '', margin: 'auto', textAlign: 'left', marginTop: '30px' }}>
            {[
              {
                title: t('dapp.chainConfig.chainName'),
                value: props.config.chainName,
              },
              {
                title: t('dapp.chainConfig.chainID'),
                value: ethers.BigNumber.from(props.config.chainId).toString(),
              },
              {
                title: t('dapp.chainConfig.currencySymbol'),
                value: props.config.nativeCurrency.symbol,
              },
              {
                title: 'RPC URL',
                value: props.config.rpcUrls[0],
              },
              {
                title: t('dapp.chainConfig.blockExplorer'),
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
