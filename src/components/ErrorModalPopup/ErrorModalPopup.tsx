import React from 'react';
import './ErrorModalPopup.less';
import { Modal } from 'antd';
import ErrorXmark from '../ErrorXmark/ErrorXmark';

interface ErrorModalPopupProps {
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

const ErrorModalPopup: React.FC<ErrorModalPopupProps> = props => {
  return (
    <>
      {props.button}
      <Modal
        visible={props.isModalVisible}
        onOk={props.handleOk}
        onCancel={props.handleCancel}
        footer={props.footer}
        className="error-popup"
      >
        <ErrorXmark />
        <div className="title">{props.title}</div>
        {props.children}
      </Modal>
    </>
  );
};

export default ErrorModalPopup;
