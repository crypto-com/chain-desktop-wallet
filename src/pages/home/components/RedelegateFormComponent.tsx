import React, { useEffect, useRef, useState } from 'react';
import { FormInstance } from 'antd/lib/form';
import { Form, InputNumber, Alert, Table, Input } from 'antd';
import { OrderedListOutlined } from '@ant-design/icons';
import numeral from 'numeral';
import Big from 'big.js';
import { AddressType } from '@crypto-com/chain-jslib/lib/dist/utils/address';
import { Session } from '../../../models/Session';
import { UserAsset, scaledAmount } from '../../../models/UserAsset';
import { ValidatorModel } from '../../../models/Transaction';
import { walletService } from '../../../service/WalletService';
import { TransactionUtils } from '../../../utils/TransactionUtils';
import { middleEllipsis, ellipsis } from '../../../utils/utils';
import ModalPopup from '../../../components/ModalPopup/ModalPopup';

const { Search } = Input;

const RedelegateFormComponent = (props: {
  currentSession: Session;
  walletAsset: UserAsset;
  redelegateFormValues: {
    validatorOriginAddress: string;
    validatorDestinationAddress: string;
    redelegateAmount: string;
  };
  form: FormInstance;
}) => {
  const [validatorTopList, setValidatorTopList] = useState<ValidatorModel[]>([]);
  const [isValidatorListVisible, setIsValidatorListVisible] = useState(false);

  const didMountRef = useRef(false);

  const redelegatePeriod = props.currentSession.wallet.config.name === 'MAINNET' ? '28' : '21';

  const validatorColumns = [
    {
      title: 'Name',
      dataIndex: 'validatorName',
      key: 'validatorName',
      render: (validatorName, record) => (
        <a
          data-original={record.validatorAddress}
          target="_blank"
          rel="noreferrer"
          href={`${props.currentSession.wallet.config.explorerUrl}/validator/${record.validatorAddress}`}
        >
          {ellipsis(validatorName, 24)}
        </a>
      ),
    },
    {
      title: 'Website',
      dataIndex: 'validatorWebSite',
      key: 'validatorWebSite',
      render: validatorWebSite => {
        return validatorWebSite === '' ? (
          'n.a.'
        ) : (
          <a
            data-original={validatorWebSite}
            target="_blank"
            rel="noreferrer"
            href={`${validatorWebSite}`}
          >
            {ellipsis(validatorWebSite, 24)}
          </a>
        );
      },
    },
    {
      title: 'Address',
      dataIndex: 'validatorAddress',
      key: 'validatorAddress',
      render: validatorAddress => (
        <a
          data-original={validatorAddress}
          title={validatorAddress}
          target="_blank"
          rel="noreferrer"
          href={`${props.currentSession.wallet.config.explorerUrl}/validator/${validatorAddress}`}
        >
          {middleEllipsis(validatorAddress, 10)}
        </a>
      ),
    },
    {
      title: 'Voting Power',
      dataIndex: 'currentTokens',
      key: 'currentTokens',
      sorter: (a, b) => new Big(a.currentTokens).cmp(new Big(b.currentTokens)),
      defaultSortOrder: 'descend' as any,
      render: currentTokens => {
        return (
          <span>
            {numeral(scaledAmount(currentTokens, 8)).format('0,0.00')}{' '}
            {props.currentSession.wallet.config.network.coin.croDenom.toUpperCase()}
          </span>
        );
      },
    },
    {
      title: 'Commission',
      dataIndex: 'currentCommissionRate',
      key: 'currentCommissionRate',
      sorter: (a, b) => new Big(a.currentCommissionRate).cmp(new Big(b.currentCommissionRate)),
      render: currentCommissionRate => (
        <span>{new Big(currentCommissionRate).times(100).toFixed(2)}%</span>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: record => (
        <a
          onClick={() => {
            setIsValidatorListVisible(false);
            props.form.setFieldsValue({
              validatorDestinationAddress: record.validatorAddress,
            });
          }}
        >
          Select
        </a>
      ),
    },
  ];

  const customAddressValidator = TransactionUtils.addressValidator(
    props.currentSession,
    props.walletAsset,
    AddressType.VALIDATOR,
  );
  const customMaxValidator = TransactionUtils.maxValidator(
    props.redelegateFormValues.redelegateAmount,
    'Undelegate amount cannot be bigger than currently delegated',
  );

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
    <div className="redelegate-form">
      <>
        <ModalPopup
          isModalVisible={isValidatorListVisible}
          handleCancel={() => setIsValidatorListVisible(false)}
          handleOk={() => setIsValidatorListVisible(false)}
          className="validator-modal"
          footer={[]}
          okText="Confirm"
          width={1000}
        >
          <div className="title">Validator List</div>
          <div className="description">Please select one of the validator.</div>
          <div className="item">
            <Table
              dataSource={validatorTopList}
              columns={validatorColumns}
              pagination={{ showSizeChanger: false }}
            />
          </div>
        </ModalPopup>
      </>
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
            label="Validator address"
            hasFeedback
            validateFirst
            rules={[
              { required: true, message: 'Validator address is required' },
              customAddressValidator,
            ]}
            className="input-validator-address"
          >
            <Search
              placeholder="Enter validator address"
              enterButton={<OrderedListOutlined />}
              onSearch={() => setIsValidatorListVisible(true)}
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
    </div>
  );
};

export default RedelegateFormComponent;
