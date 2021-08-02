import { FormInstance } from 'antd/lib/form';
import { Alert, Form, InputNumber } from 'antd';
import { useTranslation } from 'react-i18next';
import React from 'react';
import { Session } from '../../../models/Session';
import { TransactionUtils } from '../../../utils/TransactionUtils';

export const UndelegateFormComponent = (props: {
  currentSession: Session;
  undelegateFormValues: { validatorAddress: string; undelegateAmount: string };
  form: FormInstance;
}) => {
  const [t] = useTranslation();

  const customMaxValidator = TransactionUtils.maxValidator(
    props.undelegateFormValues.undelegateAmount,
    t('general.undelegateFormComponent.maxValidator.error'),
  );

  const undelegatePeriod = props.currentSession.wallet.config.name === 'MAINNET' ? '28' : '21';

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
      <div>
        <Alert
          type="info"
          message={`${t(
            'general.undelegateFormComponent.alert1.message1',
          )} (${undelegatePeriod} ${t('general.undelegateFormComponent.alert1.message2')}) ${t(
            'general.undelegateFormComponent.alert1.message3',
          )}`}
          showIcon
        />
      </div>
    </>
  );
};
