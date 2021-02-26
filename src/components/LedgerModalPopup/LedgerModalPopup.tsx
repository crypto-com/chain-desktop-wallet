import React from 'react';
import './LedgerModalPopup.less';
import { Modal } from 'antd';

interface LedgerModalPopupProps {
  children: React.ReactNode;
  handleOk(): void;
  handleCancel(): void;
  isModalVisible: boolean;
  title?: string; // card title
  className?: string; // combine parent className
  style?: object;
  button?: React.ReactNode;
  // okButtonProps?: object;
  disabled?: boolean;
  footer?: Array<React.ReactNode>;
  image: React.ReactNode;
}

const LedgerModalPopup: React.FC<LedgerModalPopupProps> = props => {
  return (
    <>
      {props.button}
      <Modal
        visible={props.isModalVisible}
        onOk={props.handleOk}
        onCancel={props.handleCancel}
        footer={props.footer}
        className="ledger-popup"
      >
        <div className="image">{props.image}</div>
        <div className="title">{props.title}</div>
        {props.children}
      </Modal>
    </>
  );
};

export default LedgerModalPopup;
