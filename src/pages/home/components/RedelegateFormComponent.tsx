import { FormInstance } from 'antd/lib/form';
import { AutoComplete, Form, InputNumber, Alert } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { AddressType } from '@crypto-com/chain-jslib/lib/dist/utils/address';
import { Session } from '../../../models/Session';
import { TransactionUtils } from '../../../utils/TransactionUtils';
import { UserAsset } from '../../../models/UserAsset';
import { ValidatorModel } from '../../../models/Transaction';
import { walletService } from '../../../service/WalletService';

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
  const customMaxValidator = TransactionUtils.maxValidator(
    props.redelegateFormValues.redelegateAmount,
    'Undelegate amount cannot be bigger than currently delegated',
  );

  const [validatorTopList, setValidatorTopList] = useState<ValidatorModel[]>([]);

  const didMountRef = useRef(false);

  const redelegatePeriod = props.currentSession.wallet.config.name === 'MAINNET' ? '28' : '21';

  useEffect(() => {
    let unmounted = false;

    const syncValidatorsData = async () => {
      const currentValidatorList = await walletService.retrieveTopValidators(
        props.currentSession.wallet.config.network.chainId,
      );

      if (!unmounted) {
        setValidatorTopList(currentValidatorList);
      }
    };

    if (!didMountRef.current) {
      syncValidatorsData();
      didMountRef.current = true;
    }

    return () => {
      unmounted = true;
    };
  }, [validatorTopList, setValidatorTopList]);

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
            <AutoComplete
              options={[
                {
                  label: 'Top Validators',
                  options: validatorTopList.map(e => {
                    return {
                      value: e.validatorAddress,
                    };
                  }),
                },
              ]}
              placeholder="Enter validator address"
            />
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
              customMaxValidator,
            ]}
          >
            <InputNumber stringMode />
          </Form.Item>
        </Form>
      </div>
      <div>
        <Alert
          type="info"
          message={`Funds can be redelegated once every ${redelegatePeriod} days. At any time, one account can only have at most 7 records of redelegation and unbonding that is in the ${redelegatePeriod} days effective unbonding periods.`}
          showIcon
        />
      </div>
    </>
  );
}
