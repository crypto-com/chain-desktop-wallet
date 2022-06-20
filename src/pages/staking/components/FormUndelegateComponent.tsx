import { FormInstance } from 'antd/lib/form';
import { Form, InputNumber, Checkbox } from 'antd';
import { useTranslation } from 'react-i18next';
import React, { useEffect } from 'react';

import Big from 'big.js';

import { Session } from '../../../models/Session';
import { TransactionUtils } from '../../../utils/TransactionUtils';
import { UNBLOCKING_PERIOD_IN_DAYS } from '../../../config/StaticConfig';
import { GasInfoTendermint } from '../../../components/GasCustomize/Tendermint/GasConfig';

export const FormUndelegateComponent = (props: {
  currentSession: Session;
  // eslint-disable-next-line
  undelegateFormValues: { validatorAddress: string; undelegateAmount: string };
  // eslint-disable-next-line
  setUndelegateFormValues: React.Dispatch<React.SetStateAction<any>>;
  isChecked: boolean;
  setIsChecked;
  form: FormInstance;
}) => {
  const [t] = useTranslation();

  const { form: undelegationForm } = props;

  let customMaxValidator = TransactionUtils.maxValidator(
    undelegationForm.getFieldValue('undelegateAmount'),
    t('general.undelegateFormComponent.maxValidator.error'),
  );

  useEffect(() => {
    // undelegationForm.resetFields();

    customMaxValidator = TransactionUtils.maxValidator(
      undelegationForm.getFieldValue('undelegateAmount'),
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
        <div className="address">{undelegationForm.getFieldValue('validatorAddress')}</div>
      </div>
      <div className="item">
        <Form
          form={undelegationForm}
          layout="vertical"
          requiredMark={false}
          initialValues={{
            undelegateAmount: undelegationForm.getFieldValue('undelegateAmount'),
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
                const curAddress = undelegationForm.getFieldValue('validatorAddress');
                undelegationForm.setFieldsValue({
                  validatorAddress: curAddress,
                  undelegateAmount: curval,
                });
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
