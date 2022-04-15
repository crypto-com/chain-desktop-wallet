import * as React from 'react';
import { Button, Form, Input, InputNumber, Modal } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import "./style.less";

const useCustomCROGasModal = () => {

  const [modalRef, setModalRef] = useState({
    destroy: () => { },
  })

  const [isShowing, setIsShowing] = useState(false)
  const [t] = useTranslation();

  const [gasFee, setGasFee] = useState("");
  const [gasLimit, setGasLimit] = useState("");

  function show(props: {
    onCancel?: () => void,
    onSuccess: (password: string) => void,
  }) {

    if (isShowing) {
      return
    }
    const modal = Modal.info({
      visible: isShowing,
      icon: null,
      closable: true,
      width: 520,
      className: "cro-gas-modal",
      onCancel: () => {
        modal.destroy()
        setIsShowing(false)
        props.onCancel?.();
      },
      cancelButtonProps: {
        hidden: true,
      },
      okButtonProps: {
        hidden: true
      },
      style: {
        padding: "20px 20px 0 20px"
      },
      content: <div>
        <div style={{
          fontSize: "24px",
          marginBottom: "30px"
        }}>Custom Gas</div>
        <Form layout="vertical">
          <Form.Item
            name="networkFee"
            label={t('settings.form1.networkFee.label')}
            hasFeedback
            rules={[
              {
                required: true,
                message: `${t('settings.form1.networkFee.label')} ${t('general.required')}`,
              },
            ]}
          >
            <InputNumber precision={0} min={1} />
          </Form.Item>
          <Form.Item
            name="gasLimit"
            label={t('settings.form1.gasLimit.label')}
            hasFeedback
            rules={[
              {
                required: true,
                message: `${t('settings.form1.gasLimit.label')} ${t('general.required')}`,
              },
            ]}
          >
            <InputNumber precision={0} min={1} />
          </Form.Item>
          <div>
            <div style={{ color: "#7B849B" }}>Estimate Network Fee</div>
            <div>0.1 CRO (~$0.1 USD)</div>
          </div>
          <div style={{
            marginTop: "20px"
          }}>
            <div style={{ color: "#7B849B" }}>Estimate Time</div>
            <div>6 s</div>
          </div>
          <Form.Item style={{
            marginTop: "20px"
          }}>
            <Button type="primary" htmlType="submit" style={{ margin: "0 10px 0 0", width: "200px" }}>
              {t('general.save')}
            </Button>
            <Button type="link" htmlType="button">
              {t('general.cancel')}
            </Button>
          </Form.Item>
        </Form>
      </div>
    })
    setIsShowing(true)
    setModalRef(modal)
  }

  function dismiss() {
    setIsShowing(false)
    modalRef.destroy()
  }

  return {
    show,
    dismiss,
  }
}

export { useCustomCROGasModal }
