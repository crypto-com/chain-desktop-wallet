import React from 'react';
import './SuccessModalPopup.less';
import { Modal } from 'antd';
import SuccessCheckmark from '../SuccessCheckmark/SuccessCheckmark';

interface SuccessModalPopupProps {
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
}

const SuccessModalPopup: React.FC<SuccessModalPopupProps> = props => {
  return (
    <>
      {props.button}
      <Modal
        visible={props.isModalVisible}
        onOk={props.handleOk}
        onCancel={props.handleCancel}
        footer={props.footer}
        className="success-popup"
      >
        <SuccessCheckmark />
        <div className="title">{props.title}</div>
        {props.children}
      </Modal>
    </>
  );
};

export default SuccessModalPopup;
