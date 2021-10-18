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
  confirmationLoading?: boolean;
  okText?: string;
  closable?: boolean;
  width?: number;
  forceRender?: boolean;
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
        confirmLoading={props.confirmationLoading}
        okText={props.okText}
        closable={props.closable}
        style={props.style}
        className={props.className}
        width={props.width}
        forceRender={props.forceRender}
      >
        {props.children}
      </Modal>
    </>
  );
};

export default ModalPopup;
