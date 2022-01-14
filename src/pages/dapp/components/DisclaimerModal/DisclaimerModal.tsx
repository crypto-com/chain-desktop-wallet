import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Modal } from 'antd';
import Checkbox from 'antd/lib/checkbox/Checkbox';
import * as React from 'react';
import { useState } from 'react';

interface IDisclaimerModalProps {
  url: string;
  onCancel: () => void;
  onConfirm: (checked: boolean, url: string) => void;
}

export const DisclaimerModal = (props: IDisclaimerModalProps) => {
  const { url, onConfirm, onCancel } = props;

  const [checked, setChecked] = useState(false);

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
            Got it
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
        <div style={{ fontSize: '24px', fontWeight: 500, marginTop: '15px' }}>Disclaimer</div>
        <div style={{ fontSize: '14px', color: '#0B142688', padding: '10px', textAlign: 'center' }}>
          You are responsible for your use of any DApps. DApps are controlled solely by their
          respective project providers. Please check the receiving addresses or contract addresses
          before you transfer any assets.
          <br />
          We are not responsible for the accuracy, completeness, or usefulness of such DApps.
          Accordingly, we neither endorse, recommend, nor give any opinion, advice or whatsoever on
          such DApps. are not responsible or liable for any losses incurred during your use of
          DApps.
        </div>
        <Checkbox
          style={{ marginTop: '10px', color: '#0B1426', alignSelf: 'flex-start' }}
          checked={checked}
          onChange={() => {
            setChecked(!checked);
          }}
        >
          Dont show this message again.
        </Checkbox>
      </div>
    </Modal>
  );
};
