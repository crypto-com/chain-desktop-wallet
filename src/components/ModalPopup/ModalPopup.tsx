import React from 'react';
import './ModalPopup.less';
import { Modal } from 'antd';

interface ModalPopupProps {
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

const ModalPopup: React.FC<ModalPopupProps> = props => {
  return (
    <>
      {props.button}
      <Modal
        title={props.title}
        visible={props.isModalVisible}
        onOk={props.handleOk}
        onCancel={props.handleCancel}
        footer={props.footer}
      >
        {props.children}
      </Modal>
    </>
  );
};

export default ModalPopup;
