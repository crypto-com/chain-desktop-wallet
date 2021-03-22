import { FormInstance } from 'antd/lib/form';
import { Alert, Form, InputNumber } from 'antd';
import React from 'react';
import { Session } from '../../models/Session';

export const UndelegateFormComponent = (props: {
  currentSession: Session;
  undelegateFormValues: { validatorAddress: string; undelegateAmount: string };
  form: FormInstance;
}) => (
  <>
    <div className="title">Confirm Undelegate Transaction</div>
    <div className="description">Please review the below information.</div>
    <div className="item">
      <div className="label">Sender Address</div>
      <div className="address">{`${props.currentSession.wallet.address}`}</div>
    </div>
    <div className="item">
      <div className="label">Undelegate From Validator</div>
      <div className="address">{`${props.undelegateFormValues?.validatorAddress}`}</div>
    </div>
    <div className="item">
      <Form
        form={props.form}
        layout="vertical"
        requiredMark={false}
        initialValues={{
          undelegateAmount: props.undelegateFormValues.undelegateAmount,
        }}
      >
        <Form.Item
          name="undelegateAmount"
          label="Undelegate Amount"
          validateFirst
          rules={[
            { required: true, message: 'Undelegate amount is required' },
            {
              pattern: /[^0]+/,
              message: 'Undelegate amount cannot be 0',
            },
            {
              max: Number(props.undelegateFormValues.undelegateAmount),
              type: 'number',
              message: 'Undelegate amount cannot be bigger than currently delegated',
            },
          ]}
        >
          <InputNumber />
        </Form.Item>
      </Form>
    </div>
    <div>
      <Alert
        type="info"
        message="Please do understand that undelegation is fully completed a number of days (~21) after the transaction has been broadcasted."
        showIcon
      />
    </div>
  </>
);
