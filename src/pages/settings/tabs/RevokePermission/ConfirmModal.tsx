import * as React from 'react';
import { Button, Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import { InfoCircleOutlined } from '@ant-design/icons';

interface ModalConfig {
  onCancel: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  closable: boolean;
}

export const ConfirmModal = ({ onCancel, onConfirm, isLoading, closable }: ModalConfig) => {
  const [t] = useTranslation();

  return (
    <Modal
      visible
      closable={closable}
      onCancel={onCancel}
      maskClosable={false}
      keyboard={false}
      footer={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
          }}
        >
          <Button type="primary" onClick={onConfirm} loading={isLoading}>
            {t('settings.revoke-permission')}
          </Button>
          <Button type="link" onClick={onCancel} disabled={!closable}>
            {t('general.cancel')}
          </Button>
        </div>
      }
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: '20px',
        }}
      >
        <InfoCircleOutlined style={{ color: '#f27474', fontSize: '70px' }} />
        <div
          style={{
            fontSize: '24px',
            fontWeight: 'bold',
            textAlign: 'center',
            marginTop: '10px',
            padding: '10px',
          }}
        >
          {t('general.confirm')}
        </div>
        <div style={{ color: '#0B142680' }}>{t('settings.revoke.sure')}</div>
      </div>
    </Modal>
  );
};
