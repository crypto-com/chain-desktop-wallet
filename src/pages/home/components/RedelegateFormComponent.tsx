import { FormInstance } from 'antd/lib/form';
import { Form, Input, InputNumber } from 'antd';
import React from 'react';
import { AddressType } from '@crypto-com/chain-jslib/lib/dist/utils/address';
import { Session } from '../../../models/Session';
import { TransactionUtils } from '../../../utils/TransactionUtils';
import { UserAsset } from '../../../models/UserAsset';

export function RedelegateFormComponent(props: {
  currentSession: Session;
  walletAsset: UserAsset;
  redelegateFormValues: {
    validatorOriginAddress: string;
    validatorDestinationAddress: string;
    redelegateAmount: string;
  };
  form: FormInstance;
}) {
  const customAddressValidator = TransactionUtils.addressValidator(
    props.currentSession,
    props.walletAsset,
    AddressType.VALIDATOR,
  );
  return (
    <>
      <div className="title">Confirm Redelegate Transaction</div>
      <div className="description">Please review the below information.</div>
      <div className="item">
        <div className="label">Sender Address</div>
        <div className="address">{`${props.currentSession.wallet.address}`}</div>
      </div>
      <div className="item">
        <div className="label">Source Validator</div>
        <div className="address">{`${props.redelegateFormValues?.validatorOriginAddress}`}</div>
      </div>
      <div className="item">
        <Form
          form={props.form}
          layout="vertical"
          requiredMark={false}
          initialValues={{
            redelegateAmount: props.redelegateFormValues.redelegateAmount,
          }}
        >
          <Form.Item
            name="validatorDestinationAddress"
            label="Destination Validator"
            hasFeedback
            validateFirst
            rules={[
              { required: true, message: 'Validator address is required' },
              customAddressValidator,
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="redelegateAmount"
            label="Redelegate Amount"
            validateFirst
            rules={[
              { required: true, message: 'Undelegate amount is required' },
              {
                pattern: /[^0]+/,
                message: 'Undelegate amount cannot be 0',
              },
              {
                max: Number(props.redelegateFormValues.redelegateAmount),
                type: 'number',
                message: 'Undelegate amount cannot be bigger than currently delegated',
              },
            ]}
          >
            <InputNumber />
          </Form.Item>
        </Form>
      </div>
    </>
  );
}
