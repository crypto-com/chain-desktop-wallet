import * as React from 'react';
import { useState } from 'react';
import { Button, Modal } from 'antd';
import { ethers } from 'ethers';
import { useTranslation } from 'react-i18next';
import useModal from 'antd/lib/modal/useModal';

export const useConfirmModal = () => {
  const [modal, setModal] = useState({
    destroy: () => { },
  });

  const [isShowing, setIsShowing] = useState(false);
  const [t] = useTranslation();

  function showWithConfig(props: {
    icon?: React.ReactNode;
    title: string;
    subTitle: string;
    okText: string;
    onCancel: () => void;
    onApprove: () => void;
  }) {
    if (isShowing) {
      return;
    }
    const modalLocal = Modal.info({
      title: '',
      icon: null,
      visible: true,
      onCancel: props.onCancel,
      okButtonProps: {
        hidden: true,
      },
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', paddingTop: "30px" }}>
          {
            props.icon && props.icon
          }
          <div style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center', marginTop: '12px', padding: '10px' }}>
            {props.title}
          </div>
          <div style={{ color: '#0B142680' }}>{props.subTitle}</div>
          <div
            style={{
              marginTop: "30px",
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Button type="primary" onClick={props.onApprove}>
              {props.okText}
            </Button>
            <Button type="link" onClick={() => {
              modalLocal.destroy();
              dismiss();
              props.onCancel();
            }}>
              {t('general.cancel')}
            </Button>
          </div>
        </div>
      ),
    });
    setModal(modalLocal);
    setIsShowing(true);
  }

  function dismiss() {
    modal.destroy();
    setIsShowing(false);
  }

  return {
    showWithConfig,
    dismiss,
  };
};
