import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './SessionLockModal.less';
import Modal from 'antd/lib/modal/Modal';
import { Button } from 'antd';
import PasswordForm from './PasswordForm';
import SuccessCheckmark from '../SuccessCheckmark/SuccessCheckmark';
import ErrorXmark from '../ErrorXmark/ErrorXmark';
import { PasswordFormModalProps } from './PasswordFormModal';

interface SessionLockModalProps extends PasswordFormModalProps {
}

type DisplayComponent = 'form' | 'result';

const SessionLockModal: React.FC<SessionLockModalProps> = props => {
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
      className="session-lock-modal"
      title={props.title}
      visible={props.visible}
      mask
      maskStyle={{
        backdropFilter: 'blur(5px)'
      }}
      keyboard={false}
      maskClosable={false}
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
                <div className="result-message">{validationErrMsg}</div>
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

export default SessionLockModal;
