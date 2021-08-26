import React, { useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { FormInstance } from 'antd/lib/form';
import { Form, InputNumber, Alert, Table, Input } from 'antd';
import { useTranslation } from 'react-i18next';
import { OrderedListOutlined } from '@ant-design/icons';
import numeral from 'numeral';
import Big from 'big.js';
import { AddressType } from '@crypto-org-chain/chain-jslib/lib/dist/utils/address';
import { validatorListState, fetchingDBState } from '../../../recoil/atom';
import { Session } from '../../../models/Session';
import { UserAsset, scaledAmount } from '../../../models/UserAsset';
import { ValidatorModel } from '../../../models/Transaction';
import { TransactionUtils } from '../../../utils/TransactionUtils';
import { middleEllipsis, ellipsis } from '../../../utils/utils';
import { CUMULATIVE_SHARE_PERCENTAGE_THRESHOLD } from '../../../config/StaticConfig';
import ModalPopup from '../../../components/ModalPopup/ModalPopup';
import ValidatorPowerPercentBar from '../../../components/ValidatorPowerPercentBar/ValidatorPowerPercentBar';

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
  const currentValidatorList = useRecoilValue(validatorListState);
  const fetchingDB = useRecoilValue(fetchingDBState);
  const [validatorTopList, setValidatorTopList] = useState<ValidatorModel[]>([]);
  const [isValidatorListVisible, setIsValidatorListVisible] = useState(false);

  const [t] = useTranslation();

  const redelegatePeriod = props.currentSession.wallet.config.name === 'MAINNET' ? '28' : '21';

  const validatorColumns = [
    {
      title: t('staking.validatorList.table.validatorName'),
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
      title: t('staking.validatorList.table.validatorWebsite'),
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
      title: t('staking.validatorList.table.validatorAddress'),
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
      title: t('staking.validatorList.table.currentTokens'),
      dataIndex: 'currentTokens',
      key: 'currentTokens',
      sorter: (a, b) => new Big(a.currentTokens).cmp(new Big(b.currentTokens)),
      defaultSortOrder: 'descend' as any,
      render: currentTokens => {
        return (
          <span>
            {numeral(scaledAmount(currentTokens, 8)).format('0,0')}{' '}
            {props.currentSession.wallet.config.network.coin.croDenom.toUpperCase()}
          </span>
        );
      },
    },
    {
      title: 'Cumulative Shares',
      // dataIndex: 'cumulativeShares',
      key: 'cumulativeShares',
      // sorter: (a, b) => new Big(a.cumulativeShares).cmp(new Big(b.cumulativeShares)),
      defaultSortOrder: 'descend' as any,
      render: record => {
        return (
          <>
            {/* <span>{record.cumulativeShares} %</span> */}
            <ValidatorPowerPercentBar
              percentExcludeCurrent={record.cumulativeSharesExcludePercentage} // light blue
              percentIncludeCurrent={record.cumulativeSharesIncludePercentage} // primary blue
            />
          </>
        );
      },
    },
    {
      title: t('staking.validatorList.table.currentCommissionRate'),
      dataIndex: 'currentCommissionRate',
      key: 'currentCommissionRate',
      sorter: (a, b) => new Big(a.currentCommissionRate).cmp(new Big(b.currentCommissionRate)),
      render: currentCommissionRate => (
        <span>{new Big(currentCommissionRate).times(100).toFixed(2)}%</span>
      ),
    },
    {
      title: t('general.action'),
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
          {t('general.select')}
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
    t('general.redelegateFormComponent.maxValidator.error'),
  );

  const processValidatorList = (validatorList: ValidatorModel[] | null) => {
    if (validatorList) {
      let willDisplayWarningColumn = false;
      let displayedWarningColumn = false;

      return validatorList.map((validator, idx) => {
        if (
          new Big(validator.cumulativeSharesIncludePercentage!).gte(
            CUMULATIVE_SHARE_PERCENTAGE_THRESHOLD,
          ) &&
          !displayedWarningColumn
        ) {
          displayedWarningColumn = true;
          willDisplayWarningColumn = true;
        }

        const validatorModel = {
          ...validator,
          key: `${idx}`,
          displayWarningColumn: willDisplayWarningColumn,
        };

        willDisplayWarningColumn = false;

        return validatorModel;
      });
    }
    return [];
  };

  useEffect(() => {
    const syncValidatorsData = async () => {
      const validatorList = processValidatorList(currentValidatorList);
      setValidatorTopList(validatorList);
    };

    syncValidatorsData();
  }, [fetchingDB, currentValidatorList]);

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
            <Table
              locale={{
                triggerDesc: t('general.table.triggerDesc'),
                triggerAsc: t('general.table.triggerAsc'),
                cancelSort: t('general.table.cancelSort'),
              }}
              dataSource={validatorTopList}
              columns={validatorColumns}
              pagination={{ showSizeChanger: false }}
              expandable={{
                rowExpandable: record => record.displayWarningColumn!,
                expandedRowRender: record =>
                  record.displayWarningColumn && (
                    <div className="cumulative-stake33">
                      Cumulative stake above can halt the network: improve decentralization and
                      delegate to validators below
                    </div>
                  ),
                expandIconColumnIndex: -1,
              }}
              rowClassName={record => {
                const greyBackground =
                  new Big(record.cumulativeSharesIncludePercentage!).lte(
                    CUMULATIVE_SHARE_PERCENTAGE_THRESHOLD,
                  ) || record.displayWarningColumn;
                return greyBackground ? 'grey-background' : '';
              }}
              defaultExpandAllRows
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
            <InputNumber stringMode />
          </Form.Item>
        </Form>
      </div>
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

export default RedelegateFormComponent;
