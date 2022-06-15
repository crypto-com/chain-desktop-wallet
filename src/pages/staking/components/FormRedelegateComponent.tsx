import React, { useState, useEffect } from 'react';
import { useRecoilValue } from 'recoil';
import { FormInstance } from 'antd/lib/form';
import { Form, InputNumber, Alert, Input } from 'antd';
import { useTranslation } from 'react-i18next';
import { OrderedListOutlined } from '@ant-design/icons';
import { AddressType } from '@crypto-org-chain/chain-jslib/lib/dist/utils/address';

import Big from 'big.js';

import { validatorListState } from '../../../recoil/atom';
import { Session } from '../../../models/Session';
import { UserAsset } from '../../../models/UserAsset';
import { ModerationConfig } from '../../../models/ModerationConfig';
import { TransactionUtils } from '../../../utils/TransactionUtils';
import { UNBLOCKING_PERIOD_IN_DAYS } from '../../../config/StaticConfig';
import ModalPopup from '../../../components/ModalPopup/ModalPopup';
import ValidatorListTable from './ValidatorListTable';
import { GasInfoTendermint } from '../../../components/GasStepSelect/GasStepSelectTendermint';

const { Search } = Input;

export const FormRedelegateComponent = (props: {
  currentSession: Session;
  walletAsset: UserAsset;
  moderationConfig: ModerationConfig;
  redelegateFormValues: {
    validatorOriginAddress: string;
    validatorDestinationAddress: string;
    redelegateAmount: string;
  };
  setRedelegateFormValues: React.Dispatch<React.SetStateAction<any>>;
  form: FormInstance;
}) => {
  useEffect(() => props.form.resetFields(), [props]);

  const currentValidatorList = useRecoilValue(validatorListState);
  const [isValidatorListVisible, setIsValidatorListVisible] = useState(false);
  const [t] = useTranslation();

  const redelegatePeriod =
    props.currentSession.wallet.config.name === 'MAINNET'
      ? UNBLOCKING_PERIOD_IN_DAYS.REDELEGATION.MAINNET
      : UNBLOCKING_PERIOD_IN_DAYS.REDELEGATION.OTHERS;

  const customAddressValidator = TransactionUtils.addressValidator(
    props.currentSession,
    props.walletAsset,
    AddressType.VALIDATOR,
  );
  const customMaxValidator = TransactionUtils.maxValidator(
    props.redelegateFormValues.redelegateAmount,
    t('general.redelegateFormComponent.maxValidator.error'),
  );

  return (
    <div className="redelegate-form">
      <>
        <ModalPopup
          isModalVisible={isValidatorListVisible}
          handleCancel={() => setIsValidatorListVisible(false)}
          handleOk={() => setIsValidatorListVisible(false)}
          className="validator-modal"
          footer={[]}
          okText="Confirm"
          width={1200}
        >
          <div className="title">{t('staking.validatorList.table.title')}</div>
          <div className="description">{t('staking.validatorList.table.description')}</div>
          <div className="item">
            <ValidatorListTable
              currentSession={props.currentSession}
              currentValidatorList={currentValidatorList}
              moderationConfig={props.moderationConfig}
              setIsValidatorListVisible={setIsValidatorListVisible}
              form={props.form}
            />
          </div>
        </ModalPopup>
      </>
      <div className="title">{t('general.redelegateFormComponent.title')}</div>
      <div className="description">{t('general.redelegateFormComponent.description')}</div>
      <div className="item">
        <div className="label">{t('general.redelegateFormComponent.label1')}</div>
        <div className="address">{`${props.currentSession.wallet.address}`}</div>
      </div>
      <div className="item">
        <div className="label">{t('general.redelegateFormComponent.label2')}</div>
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
            label={t('general.redelegateFormComponent.table.validatorDestinationAddress.label')}
            hasFeedback
            validateFirst
            rules={[
              {
                required: true,
                message: `${t(
                  'general.redelegateFormComponent.table.validatorDestinationAddress.label',
                )} ${t('general.required')}`,
              },
              customAddressValidator,
            ]}
            className="input-validator-address"
          >
            <Search
              placeholder={t(
                'general.redelegateFormComponent.table.validatorDestinationAddress.placeholder',
              )}
              enterButton={<OrderedListOutlined />}
              onSearch={() => setIsValidatorListVisible(true)}
            />
          </Form.Item>
          <Form.Item
            name="redelegateAmount"
            label={t('general.redelegateFormComponent.table.redelegateAmount.label')}
            validateFirst
            rules={[
              {
                required: true,
                message: `${t('general.redelegateFormComponent.table.redelegateAmount.label')} ${t(
                  'general.required',
                )}`,
              },
              {
                pattern: /[^0]+/,
                message: `${t('general.redelegateFormComponent.table.redelegateAmount.label')} ${t(
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
                const curOrigin = props.redelegateFormValues.validatorOriginAddress;
                const curDestination = props.redelegateFormValues.validatorDestinationAddress;
                const newFormValues = {
                  validatorOriginAddress: curOrigin,
                  validatorDestinationAddress: curDestination,
                  redelegateAmount: curval,
                };

                props.setRedelegateFormValues(newFormValues);
              }}
            />
          </Form.Item>
        </Form>
      </div>
      <GasInfoTendermint />
      <div>
        <Alert
          type="info"
          message={`${t('general.redelegateFormComponent.alert1.message1')} ${redelegatePeriod} ${t(
            'general.redelegateFormComponent.alert1.message2',
          )} (${redelegatePeriod} ${t('general.redelegateFormComponent.alert1.message3')})`}
          showIcon
        />
      </div>
    </div>
  );
};
