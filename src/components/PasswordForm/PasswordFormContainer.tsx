import React, { useState } from 'react';
import './PasswordFormConatiner.less';
import { Button } from 'antd';
import PasswordForm from './PasswordForm';
import ResultModalPopup from '../ResultModalPopup/ResultModalPopup';

interface PasswordFormPageProps {
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

const PasswordFormContainer: React.FC<PasswordFormPageProps> = props => {
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
    setDisplayComponent('form');
  };
  const onModalCancel = () => {
    if (validationErrMsg !== '') {
      props.onCancel();
      setDisplayComponent('form');
      return;
    }

    // Clicking cancel on success result behaves the same as clicking ok button on the modal
    onModalFinish();
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
    <div className="password-form-container" style={{ display: props.visible ? 'block' : 'none' }}>
      <div className="title">{props.title}</div>
      <div className="description">{props.description}</div>
      <PasswordForm
        visible
        confirmPassword={props.confirmPassword}
        onOk={onFormFinish}
        onChange={onFormChange}
        onErr={onFormErr}
        shouldValidate
      >
        <ResultModalPopup
          isModalVisible={displayComponent === 'result'}
          handleCancel={onModalCancel}
          handleOk={onModalFinish}
          title={props.title}
          button={
            <Button type="primary" htmlType="submit">
              {props.okButtonText || 'Submit'}
            </Button>
          }
          footer={[
            <div key="submit" style={{ textAlign: 'center' }}>
              <Button type="primary" onClick={onModalFinish}>
                {resultButtonText}
              </Button>
            </div>,
          ]}
          success={validationErrMsg === ''}
        >
          {validationErrMsg ? (
            <div className="result-message result-alert-message">{validationErrMsg}</div>
          ) : (
            <div className="result-message">{props.successText}</div>
          )}
        </ResultModalPopup>
      </PasswordForm>
    </div>
  );
};

export default PasswordFormContainer;
