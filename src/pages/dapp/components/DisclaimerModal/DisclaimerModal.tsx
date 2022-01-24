import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Modal } from 'antd';
import Checkbox from 'antd/lib/checkbox/Checkbox';
import * as React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface IDisclaimerModalProps {
  url: string;
  onCancel: () => void;
  onConfirm: (checked: boolean, url: string) => void;
}

export const DisclaimerModal = (props: IDisclaimerModalProps) => {
  const { url, onConfirm, onCancel } = props;

  const [checked, setChecked] = useState(false);
  const [t] = useTranslation();

  return (
    <Modal
      visible
      onCancel={onCancel}
      footer={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Button
            type="primary"
            onClick={() => {
              onConfirm(checked, url);
            }}
          >
            {t('dapp.disclaimer.sure')}
          </Button>
        </div>
      }
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '20px',
        }}
      >
        <InfoCircleOutlined style={{ color: '#f27474', fontSize: '70px' }} />
        <div style={{ fontSize: '24px', fontWeight: 500, marginTop: '15px' }}>
          {t('dapp.disclaimer.title')}
        </div>
        <div style={{ fontSize: '14px', color: '#0B142688', padding: '10px', textAlign: 'center' }}>
          {t('dapp.disclaimer.content1')}
          <br />
          {t('dapp.disclaimer.content2')}
        </div>
        <Checkbox
          style={{ marginTop: '10px', color: '#0B1426', alignSelf: 'flex-start' }}
          checked={checked}
          onChange={() => {
            setChecked(!checked);
          }}
        >
          {t('dapp.disclaimer.checkbox.label')}
        </Checkbox>
      </div>
    </Modal>
  );
};
