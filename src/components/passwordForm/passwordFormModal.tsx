import React, { useState } from 'react';
import './passwordFormModal.less';
import Modal from 'antd/lib/modal/Modal';
import { Button } from 'antd';
import PasswordForm from './passwordForm';
import SuccessCheckmark from '../SuccessCheckmark/SuccessCheckmark';
import ErrorXmark from '../ErrorXmark/ErrorXmark';

interface PasswordFormModalProps {
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

  const onModalFinish = async () => {
    if (validationErrMsg !== '') {
      setValidatorErrMsg('');
      setDisplayComponent('form');
      return;
    }
    await props.onSuccess(appPassword!);
  };
  const onFormFinish = async (password: string) => {
    const result = await props.onValidatePassword(password);
    if (!result.valid) {
      setValidatorErrMsg(result.errMsg);
      setResultButtonText('Retry');
      setDisplayComponent('result');
      return;
    }

    setAppPassword(password);
    setResultButtonText(props.successButtonText);
    setDisplayComponent('result');
  };
  const onFormErr = (errMsg: string) => {
    setValidatorErrMsg(errMsg);
    setResultButtonText('Retry');
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
      footer={
        displayComponent === 'result' && (
          <div style={{ textAlign: 'center' }}>
            <Button key="submit" type="primary" onClick={onModalFinish}>
              {resultButtonText}
            </Button>
          </div>
        )
      }
      onCancel={props.onCancel}
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
              <div className="result-message result-alert-message">{validationErrMsg}</div>
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
