import { FormInstance } from 'antd/lib/form';
import { Form, InputNumber, Checkbox } from 'antd';
import { useTranslation } from 'react-i18next';
import React from 'react';
import { Session } from '../../../models/Session';
import { TransactionUtils } from '../../../utils/TransactionUtils';
import { UNBLOCKING_PERIOD_IN_DAYS } from '../../../config/StaticConfig';

export const UndelegateFormComponent = (props: {
  currentSession: Session;
  undelegateFormValues: { validatorAddress: string; undelegateAmount: string };
  isChecked: boolean;
  setIsChecked;
  form: FormInstance;
}) => {
  const [t] = useTranslation();

  const customMaxValidator = TransactionUtils.maxValidator(
    props.undelegateFormValues.undelegateAmount,
    t('general.undelegateFormComponent.maxValidator.error'),
  );

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
        <div className="address">{`${props.currentSession.wallet.address}`}</div>
      </div>
      <div className="item">
        <div className="label">{t('general.undelegateFormComponent.label2')}</div>
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
            <InputNumber />
          </Form.Item>
        </Form>
      </div>
      <div className="item">
        <Checkbox checked={props.isChecked} onChange={() => props.setIsChecked(!props.isChecked)}>
          {t('general.undelegateFormComponent.checkbox1', { unbondingPeriod: undelegatePeriod })}
        </Checkbox>
      </div>
    </>
  );
};
