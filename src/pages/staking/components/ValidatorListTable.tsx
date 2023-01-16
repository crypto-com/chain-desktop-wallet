import React, { useEffect, useState } from 'react';
import Big from 'big.js';
import { useTranslation } from 'react-i18next';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { AutoComplete, FormInstance, Table, Tooltip } from 'antd';
import numeral from 'numeral';

import './ValidatorListTable.less';

import {
  ThemeColor,
  VALIDATOR_CUMULATIVE_SHARE_PERCENTAGE_THRESHOLD,
  VALIDATOR_UPTIME_THRESHOLD,
} from '../../../config/StaticConfig';
import { ellipsis, middleEllipsis } from '../../../utils/utils';
import { renderExplorerUrl } from '../../../models/Explorer';
import { ValidatorModel } from '../../../models/Transaction';
import { Session } from '../../../models/Session';
import { scaledAmount } from '../../../models/UserAsset';
import { isValidatorAddressSuspicious, ModerationConfig } from '../../../models/ModerationConfig';
import ValidatorPowerPercentBar from '../../../components/ValidatorPowerPercentBar/ValidatorPowerPercentBar';

const ValidatorListTable = (props: {
  currentSession: Session;
  currentValidatorList;
  form?: FormInstance;
  moderationConfig?: ModerationConfig;
  setIsValidatorListVisible?: (value: boolean) => void;
}) => {
  const {
    currentSession,
    currentValidatorList,
    moderationConfig,
    form,
    setIsValidatorListVisible,
  } = props;
  const [validatorTopList, setValidatorTopList] = useState<ValidatorModel[]>([]);
  const [displayWarning, setDisplayWarning] = useState(true);

  const [t] = useTranslation();

  const validatorColumns = [
    {
      title: t('staking.validatorList.table.validatorName'),
      dataIndex: 'validatorName',
      key: 'validatorName',
      render: (validatorName, record: ValidatorModel) => (
        <a
          data-original={record.validatorAddress}
          target="_blank"
          rel="noreferrer"
          href={`${renderExplorerUrl(currentSession.wallet.config, 'validator')}/${
            record.validatorAddress
          }`}
        >
          {ellipsis(validatorName, 24)}{' '}
          {isValidatorAddressSuspicious(record.validatorAddress, moderationConfig) && (
            <Tooltip title={t('staking.model1.warning')}>
              <span>
                <ExclamationCircleOutlined style={{ color: ThemeColor.BLUE }} />
              </span>
            </Tooltip>
          )}
        </a>
      ),
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
          href={`${renderExplorerUrl(
            currentSession.wallet.config,
            'validator',
          )}/${validatorAddress}`}
        >
          {middleEllipsis(validatorAddress, 6)}
        </a>
      ),
    },
    {
      title: t('staking.validatorList.table.currentTokens'),
      dataIndex: 'currentTokens',
      key: 'currentTokens',
      // sorter: (a, b) => new Big(a.currentTokens).cmp(new Big(b.currentTokens)),
      // defaultSortOrder: 'descend' as any,
      render: currentTokens => {
        return (
          <span>
            {numeral(scaledAmount(currentTokens, 8)).format('0,0')}{' '}
            {currentSession.wallet.config.network.coin.croDenom.toUpperCase()}
          </span>
        );
      },
    },
    {
      title: t('staking.validatorList.table.cumulativeShares'),
      // dataIndex: 'cumulativeShares',
      key: 'cumulativeShares',
      // sorter: (a, b) => new Big(a.cumulativeShares).cmp(new Big(b.cumulativeShares)),
      // defaultSortOrder: 'descend' as any,
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
      // sorter: (a, b) => new Big(a.currentCommissionRate).cmp(new Big(b.currentCommissionRate)),
      render: currentCommissionRate => (
        <span>{new Big(currentCommissionRate).times(100).toFixed(2)}%</span>
      ),
    },
    {
      title: t('staking.validatorList.table.validatorApy'),
      key: 'apy',
      // sorter: (a, b) => new Big(a.apy).cmp(new Big(b.apy)),
      render: record => {
        return <span>{new Big(record.apy).times(100).toFixed(2)}%</span>;
      },
    },
    {
      title: t('staking.validatorList.table.validatorUptime'),
      key: 'uptime',
      // sorter: (a, b) => new Big(a.uptime).cmp(new Big(b.uptime)),
      render: record => {
        return <span>{new Big(record.uptime).times(100).toFixed(2)}%</span>;
      },
    },
    {
      title: t('general.action'),
      key: 'action',
      render: record => (
        <a
          onClick={() => {
            if (setIsValidatorListVisible) {
              setIsValidatorListVisible(false);
            }
            if (form) {
              form.setFieldsValue({
                validatorAddress: record.validatorAddress,
                validatorDestinationAddress: record.validatorAddress,
              });
            }
          }}
        >
          {t('general.select')}
        </a>
      ),
    },
  ];

  const processValidatorList = async (validatorList: ValidatorModel[] | null) => {
    if (validatorList) {
      let willDisplayWarningColumn = false;
      let displayedWarningColumn = false;

      return validatorList.map((validator, idx) => {
        if (
          new Big(validator.cumulativeSharesIncludePercentage!).gte(
            VALIDATOR_CUMULATIVE_SHARE_PERCENTAGE_THRESHOLD,
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

  const onSearch = value => {
    const newWalletList = currentValidatorList.filter(validator => {
      return (
        validator.validatorName.toLowerCase().indexOf(value.toLowerCase()) !== -1 ||
        validator.validatorAddress.toLowerCase().indexOf(value.toLowerCase()) !== -1 ||
        value === ''
      );
    });
    setValidatorTopList(newWalletList);
  };

  useEffect(() => {
    const syncValidatorsData = async () => {
      const validatorList = await processValidatorList(currentValidatorList);
      setValidatorTopList(validatorList);
    };

    syncValidatorsData();
  }, currentValidatorList);

  return (
    <div className="validator-list">
      <AutoComplete
        style={{ width: 400 }}
        onSearch={onSearch}
        placeholder={t('wallet.search.placeholder')}
      />
      <Table
        locale={{
          triggerDesc: t('general.table.triggerDesc'),
          triggerAsc: t('general.table.triggerAsc'),
          cancelSort: t('general.table.cancelSort'),
        }}
        dataSource={validatorTopList}
        columns={validatorColumns}
        pagination={{ showSizeChanger: false }}
        onChange={(pagination, filters, sorter: any) => {
          if (
            (sorter.order === 'descend' && sorter.field === 'currentTokens') ||
            sorter.order === undefined
          ) {
            setDisplayWarning(true);
          } else {
            setDisplayWarning(false);
          }
        }}
        expandable={{
          rowExpandable: record => record.displayWarningColumn! && displayWarning,
          expandedRowRender: record =>
            record.displayWarningColumn &&
            displayWarning && (
              <div className="cumulative-stake33">
                {t('staking.validatorList.table.warningCumulative')}
              </div>
            ),
          expandIconColumnIndex: -1,
        }}
        rowClassName={record => {
          const greyBackground =
            Big(record.uptime ?? '0').lt(VALIDATOR_UPTIME_THRESHOLD) ||
            isValidatorAddressSuspicious(record.validatorAddress, moderationConfig);
          // new Big(record.cumulativeSharesIncludePercentage!).lte(
          //   VALIDATOR_CUMULATIVE_SHARE_PERCENTAGE_THRESHOLD,
          // )
          // || record.displayWarningColumn;
          return greyBackground ? 'grey-background' : '';
        }}
        defaultExpandAllRows
      />
    </div>
  );
};

export default ValidatorListTable;
