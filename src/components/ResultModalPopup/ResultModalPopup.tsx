import React from 'react';
import './ResultModalPopup.less';
import { Modal } from 'antd';
import ErrorXmark from '../ErrorXmark/ErrorXmark';
import SuccessCheckmark from '../SuccessCheckmark/SuccessCheckmark';

interface ResultModalPopupProps {
  children: React.ReactNode;
  success: boolean;
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

const ResultModalPopup: React.FC<ResultModalPopupProps> = props => {
  return (
    <>
      {props.button}
      <Modal
        title={props.title}
        visible={props.isModalVisible}
        onOk={props.handleOk}
        onCancel={props.handleCancel}
        footer={props.footer}
        className="error-popup"
      >
        {props.success ? <SuccessCheckmark /> : <ErrorXmark />}
        {props.children}
      </Modal>
    </>
  );
};

export default ResultModalPopup;
