import * as React from 'react';
import { useEffect, useState } from 'react';
import { Button, Modal, ModalFuncProps, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { InfoCircleOutlined } from '@ant-design/icons';

interface ModalConfig {
  onCancel: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export const ConfirmModal = (props: ModalConfig) => {
  const [t] = useTranslation();

  return (
    <Modal
      visible
      onCancel={props.onCancel}
      footer={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px'
          }}
        >
          <Button
            type="primary"
            onClick={props.onConfirm}
            loading={props.isLoading}
          >
            Revoke Permission
          </Button>
          <Button type="link" onClick={props.onCancel}>
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
          paddingTop: '20px'
        }}
      >
        <InfoCircleOutlined style={{ color: '#f27474', fontSize: '70px' }} />
        <div
          style={{
            fontSize: '24px',
            fontWeight: 'bold',
            textAlign: 'center',
            marginTop: '10px',
            padding: '10px'
          }}
        >
          Confirm
        </div>
        <div style={{ color: '#0B142680' }}>
          Are you sure you want to revoke permission?
        </div>
      </div>
    </Modal>
  );
};
