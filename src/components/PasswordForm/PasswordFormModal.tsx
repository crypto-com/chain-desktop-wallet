import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './PasswordFormModal.less';
import Modal from 'antd/lib/modal/Modal';
import { Button } from 'antd';
import PasswordForm from './PasswordForm';
import SuccessCheckmark from '../SuccessCheckmark/SuccessCheckmark';
import ErrorXmark from '../ErrorXmark/ErrorXmark';

export interface PasswordFormModalProps {
  title: string;
  description?: string;
  // Control visibility of the component
  visible: boolean;
  // Control whether the form should confirm the password
  confirmPassword?: boolean;

  // Overwrite and display error message
  errMsg?: string;

  // Ok button text
  okButtonText?: string;
  // Text to show on password is validated
  successText: string;
  // Button text on password is validated
  successButtonText?: string;

  isButtonLoading?: boolean;

  // Will ask for password again even after password was validated before
  repeatValidation?: boolean;

  mask?: boolean;

  maskStyle?: React.CSSProperties;

  maskClosable?: boolean;

  keyboard?: boolean;

  closable?: boolean;

  // TODO: use secure-string
  onValidatePassword: (
    password: string,
  ) => Promise<{
    valid: boolean;
    errMsg?: string;
  }>;
  // Callback on password is ok
  onSuccess: (password: string) => void;
  // Callback on cancel
  onCancel: () => void;
}

type DisplayComponent = 'form' | 'result';

const PasswordFormModal: React.FC<PasswordFormModalProps> = props => {
  const [appPassword, setAppPassword] = useState<string>();
  const [displayComponent, setDisplayComponent] = useState<DisplayComponent>('form');
  const [validationErrMsg, setValidatorErrMsg] = useState<string>();
  const [resultButtonText, setResultButtonText] = useState<string>();

  const [t] = useTranslation();

  const onModalFinish = async () => {
    if (validationErrMsg !== '') {
      setValidatorErrMsg('');
      setDisplayComponent('form');
      return;
    }
    await props.onSuccess(appPassword!);
    if (props.repeatValidation) {
      setAppPassword('');
      setDisplayComponent('form');
    }
  };
  const onFormFinish = async (password: string) => {
    const result = await props.onValidatePassword(password);
    if (!result.valid) {
      setValidatorErrMsg(result.errMsg);
      setResultButtonText(t('general.retry'));
      setDisplayComponent('result');
      return;
    }

    setAppPassword(password);
    setResultButtonText(props.successButtonText);
    setDisplayComponent('result');
  };
  const onFormErr = (errMsg: string) => {
    setValidatorErrMsg(errMsg);
    setResultButtonText(t('general.retry'));
    setDisplayComponent('result');
  };
  const onFormChange = () => {
    setValidatorErrMsg('');
    setDisplayComponent('form');
  };
  return (
    <Modal
      className="password-form-modal"
      title={props.title}
      visible={props.visible}
      confirmLoading={props.isButtonLoading}
      footer={
        displayComponent === 'result' && (
          <div style={{ textAlign: 'center' }}>
            <Button
              key="submit"
              type="primary"
              onClick={onModalFinish}
              loading={props.isButtonLoading}
            >
              {resultButtonText}
            </Button>
          </div>
        )
      }
      closable={props.closable}
      onCancel={props.onCancel}
      mask={props.mask}
      maskStyle={props.maskStyle}
      keyboard={props.keyboard}
      maskClosable={props.maskClosable}
    >
      {displayComponent === 'form' ? (
        <PasswordForm
          visible
          confirmPassword={props.confirmPassword}
          onOk={onFormFinish}
          onChange={onFormChange}
          onErr={onFormErr}
        >
          <Button type="primary" htmlType="submit">
            {props.okButtonText || 'Submit'}
          </Button>
        </PasswordForm>
      ) : (
        <div className="result">
          {validationErrMsg ? (
            <div>
              <ErrorXmark />
              <div className="result-message">{
              validationErrMsg
              .includes('*break*')?  
              validationErrMsg
              .split('*break*')
              .map((err, idx) => {
                return <div key={idx}> {err}</div>
              })
              : validationErrMsg
              }</div>
            </div>
          ) : (
            <div>
              <SuccessCheckmark />
              <div className="result-message">{props.successText}</div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default PasswordFormModal;
