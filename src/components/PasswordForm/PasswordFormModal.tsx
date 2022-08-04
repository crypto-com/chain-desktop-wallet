import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './PasswordFormModal.less';
import { Button, Modal } from 'antd';
import PasswordForm from './PasswordForm';
import SuccessCheckmark from '../SuccessCheckmark/SuccessCheckmark';
import ErrorXmark from '../ErrorXmark/ErrorXmark';
import { secretStoreService } from '../../service/storage/SecretStoreService';

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
  skipRepeatValidation?: boolean;

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

const PasswordResult = (props: {
  validationErrMsg?: string;
  successText: string;
  resultButtonText?: string;
  isButtonLoading?: boolean;
  onModalFinish: () => void;
}) => {
  const { validationErrMsg } = props;
  return (
    <div className="result">
      {validationErrMsg ? (
        <div>
          <ErrorXmark />
          <div className="result-message">
            {validationErrMsg.includes('*break*')
              ? validationErrMsg.split('*break*').map((err, idx) => {
                return <div key={idx}> {err}</div>;
              })
              : validationErrMsg}
          </div>
        </div>
      ) : (
        <div>
          <SuccessCheckmark />
          <div className="result-message">{props.successText}</div>
        </div>
      )}
      <div style={{ textAlign: 'center' }}>
        <Button
          key="submit"
          type="primary"
          onClick={props.onModalFinish}
          loading={props.isButtonLoading}
        >
          {props.resultButtonText}
        </Button>
      </div>
    </div>
  );
};

const PasswordFormWithResult = (props: {
  onValidatePassword: (
    password: string,
  ) => Promise<{
    valid: boolean;
    errMsg?: string;
  }>;
  // Callback on password is ok
  onSuccess: (password: string) => void;

  successButtonText?: string;
  confirmPassword?: boolean;
  okButtonText?: string;
  skipRepeatValidation?: boolean;
  isButtonLoading?: boolean;
  successText: string;
}) => {
  const [appPassword, setAppPassword] = useState<string>();
  const [displayComponent, setDisplayComponent] = useState<DisplayComponent>('form');
  const [validationErrMsg, setValidatorErrMsg] = useState<string>();
  const [resultButtonText, setResultButtonText] = useState<string>();

  const [t] = useTranslation();

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

  return displayComponent === 'form' ? (
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
    <PasswordResult
      validationErrMsg={validationErrMsg}
      successText={props.successText}
      resultButtonText={resultButtonText}
      isButtonLoading={props.isButtonLoading}
      onModalFinish={async () => {
        if (validationErrMsg !== '') {
          setValidatorErrMsg('');
          setDisplayComponent('form');
          return;
        }
        await props.onSuccess(appPassword!);
        if (!props.skipRepeatValidation) {
          setTimeout(() => {
            setAppPassword('');
            setDisplayComponent('form');
          }, 200);
        }
      }}
    />
  );
};

const PasswordFormModal: React.FC<PasswordFormModalProps> = props => {
  return (
    <Modal
      className="password-form-modal"
      footer={null}
      title={props.title}
      visible={props.visible}
      confirmLoading={props.isButtonLoading}
      closable={props.closable}
      onCancel={props.onCancel}
      mask={props.mask}
      maskStyle={props.maskStyle}
      keyboard={props.keyboard}
      maskClosable={props.maskClosable}
    >
      <PasswordFormWithResult {...props} />
    </Modal>
  );
};

const usePasswordModal = () => {
  const [modalRef, setModalRef] = useState({
    destroy: () => {},
  });

  const [isShowing, setIsShowing] = useState(false);
  const [t] = useTranslation();
  const [passphrase, setPassphrase] = useState('');

  function show(props: { onCancel?: () => void; onSuccess: (password: string) => void }) {
    if (passphrase.length > 0) {
      props.onSuccess(passphrase);
      return;
    }

    if (isShowing) {
      return;
    }
    const modal = Modal.info({
      className: 'password-form-modal',
      visible: isShowing,
      icon: null,
      closable: true,
      width: 520,
      title: t('general.passwordFormModal.title'),
      onCancel: () => {
        modal.destroy();
        setIsShowing(false);
        props.onCancel?.();
      },
      okButtonProps: {
        hidden: true,
      },
      content: (
        <PasswordFormWithResult
          okButtonText={t('general.passwordFormModal.okButton')}
          onSuccess={password => {
            props.onSuccess(password);
            setPassphrase(password);
            setIsShowing(false);
            modal.destroy();
          }}
          successText={t('general.passwordFormModal.success')}
          successButtonText={t('general.continue')}
          confirmPassword={false}
          onValidatePassword={async (password: string) => {
            const isValid = await secretStoreService.checkIfPasswordIsValid(password);
            return {
              valid: isValid,
              errMsg: !isValid ? t('general.passwordFormModal.error') : '',
            };
          }}
        />
      ),
    });
    setIsShowing(true);
    setModalRef(modal);
  }

  function dismiss() {
    setIsShowing(false);
    modalRef.destroy();
  }

  return {
    show,
    dismiss,
    passphrase,
  };
};

export { usePasswordModal };
export default PasswordFormModal;
