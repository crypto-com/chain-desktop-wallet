import { FormInstance } from 'antd/lib/form';
import { Form, InputNumber, Checkbox } from 'antd';
import { useTranslation } from 'react-i18next';
import React, { useEffect } from 'react';

import Big from 'big.js';

import { Session } from '../../../models/Session';
import { TransactionUtils } from '../../../utils/TransactionUtils';
import { UNBLOCKING_PERIOD_IN_DAYS } from '../../../config/StaticConfig';
import { GasInfoTendermint } from '../../../components/GasStepSelect/GasStepSelectTendermint';

export const FormUndelegateComponent = (props: {
  currentSession: Session;
  undelegateFormValues: { validatorAddress: string; undelegateAmount: string };
  setUndelegateFormValues: React.Dispatch<React.SetStateAction<any>>;
  isChecked: boolean;
  setIsChecked;
  form: FormInstance;
}) => {
  const [t] = useTranslation();

  let customMaxValidator = TransactionUtils.maxValidator(
    props.undelegateFormValues.undelegateAmount,
    t('general.undelegateFormComponent.maxValidator.error'),
  );

  useEffect(() => {
    props.form.resetFields();

    customMaxValidator = TransactionUtils.maxValidator(
      props.undelegateFormValues.undelegateAmount,
      t('general.undelegateFormComponent.maxValidator.error'),
    );
  }, [props]);

  const undelegatePeriod =
    props.currentSession.wallet.config.name === 'MAINNET'
      ? UNBLOCKING_PERIOD_IN_DAYS.UNDELEGATION.MAINNET
      : UNBLOCKING_PERIOD_IN_DAYS.UNDELEGATION.OTHERS;

  return (
    <>
      <div className="title">{t('general.undelegateFormComponent.title')}</div>
      <div className="description">{t('general.undelegateFormComponent.description')}</div>
      <div className="item">
        <div className="label">{t('general.undelegateFormComponent.label1')}</div>
        <div className="address">{props.currentSession.wallet.address}</div>
      </div>
      <div className="item">
        <div className="label">{t('general.undelegateFormComponent.label2')}</div>
        <div className="address">{props.undelegateFormValues?.validatorAddress}</div>
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
            label={t('general.undelegateFormComponent.table.undelegateAmount.label')}
            validateFirst
            rules={[
              {
                required: true,
                message: `${t('general.undelegateFormComponent.table.undelegateAmount.label')} ${t(
                  'general.required',
                )}`,
              },
              {
                pattern: /[^0]+/,
                message: `${t('general.undelegateFormComponent.table.undelegateAmount.label')} ${t(
                  'general.cannot0',
                )}`,
              },
              customMaxValidator,
            ]}
          >
            <InputNumber
              stringMode
              onChange={(val: string) => {
                const curval = val ? Big(val.toString()).toString() : '0';
                const curAddress = props.undelegateFormValues.validatorAddress;
                const newFormValues = {
                  validatorAddress: curAddress,
                  undelegateAmount: curval,
                };

                props.setUndelegateFormValues(newFormValues);
              }}
            />
          </Form.Item>
        </Form>
      </div>
      <GasInfoTendermint />
      <div className="item">
        <Checkbox checked={props.isChecked} onChange={() => props.setIsChecked(!props.isChecked)}>
          {t('general.undelegateFormComponent.checkbox1', { unbondingPeriod: undelegatePeriod })}
        </Checkbox>
      </div>
    </>
  );
};
