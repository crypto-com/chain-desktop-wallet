import { Button, Modal } from 'antd';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

interface IConfirmModalProps {
  onConfirm: { (): void };
  onCancel: { (): void };
  confirmText: string;
  children: JSX.Element;
  visible: boolean;
}

const ConfirmModal = (props: IConfirmModalProps) => {
  const { onCancel, children, onConfirm, confirmText, visible } = props;
  const [t] = useTranslation();

  return (
    <Modal
      visible={visible}
      onCancel={onCancel}
      footer={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Button type="primary" onClick={onConfirm}>
            {confirmText}
          </Button>
          <Button type="link" onClick={onCancel}>
            {t('general.cancel')}
          </Button>
        </div>
      }
    >
      {children}
    </Modal>
  );
};

export default ConfirmModal;
