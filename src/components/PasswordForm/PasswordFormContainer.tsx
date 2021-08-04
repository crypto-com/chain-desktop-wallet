import React, { useState } from 'react';
import './PasswordFormConatiner.less';
import { Button } from 'antd';
import PasswordForm from './PasswordForm';
// import ResultModalPopup from '../ResultModalPopup/ResultModalPopup';

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

const PasswordFormContainer: React.FC<PasswordFormPageProps> = props => {
  const [validationErrMsg, setValidatorErrMsg] = useState<string>();
  const onFormFinish = async (password: string) => {
    const result = await props.onValidatePassword(password);
    if (!result.valid) {
      setValidatorErrMsg(result.errMsg);
      // eslint-disable-next-line
      console.error(validationErrMsg);
      return;
    }
    props.onSuccess(password);
  };
  const onFormErr = (errMsg: string) => {
    setValidatorErrMsg(errMsg);
  };
  const onFormChange = () => {
    setValidatorErrMsg('');
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
        <Button type="primary" htmlType="submit">
          {props.okButtonText || 'Submit'}
        </Button>
      </PasswordForm>
    </div>
  );
};

export default PasswordFormContainer;
