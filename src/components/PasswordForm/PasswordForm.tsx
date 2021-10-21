import React, { useState } from 'react';
import { Checkbox, Form, Input, Progress } from 'antd';
import { useTranslation } from 'react-i18next';
import './PasswordForm.less';

const zxcvbn = require('zxcvbn');

interface PasswordFormProps {
  className?: string;
  children?: React.ReactNode;

  // Control form visibility
  visible: boolean;

  // Display extra input field to confirm password
  confirmPassword?: boolean;

  // TODO: use secure-string
  onOk: (password: string) => void;
  onErr: (errMsg: string) => void;
  onChange: () => void;

  shouldValidate?: boolean;
}

const PasswordForm: React.FC<PasswordFormProps> = props => {
  const [form] = Form.useForm();
  const [strength, setStrength] = useState<number>(0);
  const [t] = useTranslation();

  const onFormFinish = ({ password, passwordConfirm }) => {
    if (props.confirmPassword && password !== passwordConfirm) {
      props.onErr('Password Mismatch');
      return;
    }
    props.onOk(password);
  };

  if (!props.visible) {
    return <div />;
  }
  return (
    <div className={`password-form${props.className ? props.className : ''}`}>
      <Form
        layout="vertical"
        form={form}
        name="control-ref"
        onChange={() => {
          const { password } = form.getFieldsValue();

          if (password) {
            // `score` ranges from 0-4
            setStrength(zxcvbn(password).score);
          }

          props.onChange();
        }}
        onFinish={onFormFinish}
      >
        <Form.Item
          name="password"
          label={t('general.passwordForm.password.label')}
          rules={[
            {
              required: true,
              message: `${t('general.passwordForm.password.label')} ${t('general.required')}`,
            },
            props.shouldValidate
              ? {
                  pattern: /^(?=.*?[A-Za-z])(?=.*?[0-9])(?=.*?[^\w\s]).{8,}$/,
                  message: t('general.passwordForm.password.error1'),
                }
              : {},
          ]}
        >
          <Input.Password placeholder={t('general.passwordForm.password.placeholder')} />
        </Form.Item>

        {props.confirmPassword && (
          <>
            <div className="password-strength-meter">
              {t('general.passwordForm.passwordStrength.title')}
              <Progress
                strokeColor={{
                  '0%': '#1199fa',
                  '100%': '#20bca4',
                }}
                format={percent => {
                  if (percent! < 25) {
                    return t('general.passwordForm.passwordStrength.worst');
                  }
                  if (percent! < 50) {
                    return t('general.passwordForm.passwordStrength.bad');
                  }
                  if (percent! < 75) {
                    return t('general.passwordForm.passwordStrength.weak');
                  }
                  if (percent! < 100) {
                    return t('general.passwordForm.passwordStrength.good');
                  }
                  return t('general.passwordForm.passwordStrength.strong');
                }}
                percent={(strength / 4) * 100}
              />
            </div>
            <Form.Item
              name="passwordConfirm"
              label={t('general.passwordForm.passwordConfirm.label')}
              rules={[
                {
                  required: true,
                  message: `${t('general.passwordForm.passwordConfirm.label')} ${t(
                    'general.required',
                  )}`,
                },
                ({ getFieldValue }) => ({
                  validator(rule, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    // eslint-disable-next-line prefer-promise-reject-errors
                    return Promise.reject(t('general.passwordForm.passwordConfirm.error1'));
                  },
                }),
              ]}
            >
              <Input.Password placeholder={t('general.passwordForm.passwordConfirm.label')} />
            </Form.Item>

            <Form.Item
              name="agreement"
              valuePropName="checked"
              rules={[
                {
                  validator: (_, value) =>
                    value
                      ? Promise.resolve()
                      : Promise.reject(
                          new Error(
                            `${t('signup.passwordFormContainer.tAndC')} ${t('general.required')}`,
                          ),
                        ),
                },
              ]}
            >
              <Checkbox
                style={{
                  width: '100%',
                }}
              >
                {t('signup.passwordFormContainer.agreeTermsLabel')}{' '}
                <a href="https://crypto.org/desktopwallet/terms" target="_blank" rel="noreferrer">
                  {t('signup.passwordFormContainer.tAndC')}
                </a>
              </Checkbox>
            </Form.Item>
          </>
        )}
        <Form.Item wrapperCol={{ span: 12, offset: 6 }}>{props.children}</Form.Item>
      </Form>
    </div>
  );
};

export default PasswordForm;
