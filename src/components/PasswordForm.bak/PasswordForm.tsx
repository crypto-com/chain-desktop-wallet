import React from 'react';
import { Form, Input } from 'antd';
import './PasswordForm.less';

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
}

const PasswordForm: React.FC<PasswordFormProps> = props => {
  const [form] = Form.useForm();
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
        onChange={props.onChange}
        onFinish={onFormFinish}
      >
        <Form.Item name="password" label="App Password" rules={[{ required: true }]}>
          <Input.Password placeholder="App password" />
        </Form.Item>
        {props.confirmPassword && (
          <Form.Item name="passwordConfirm" label="Confirm Password" rules={[{ required: true }]}>
            <Input.Password placeholder="Confirm the password" />
          </Form.Item>
        )}
        <Form.Item wrapperCol={{ span: 12, offset: 6 }}>{props.children}</Form.Item>
      </Form>
    </div>
  );
};

export default PasswordForm;
