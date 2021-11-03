import React, { useEffect, useState } from 'react';
import Big from 'big.js';
import { useTranslation } from 'react-i18next';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { FormInstance, Table, Tooltip } from 'antd';
import numeral from 'numeral';

import { CUMULATIVE_SHARE_PERCENTAGE_THRESHOLD } from '../../../config/StaticConfig';
import { ellipsis, middleEllipsis } from '../../../utils/utils';
import { renderExplorerUrl } from '../../../models/Explorer';
import { ValidatorModel } from '../../../models/Transaction';
import { Session } from '../../../models/Session';
import { scaledAmount } from '../../../models/UserAsset';
import { isValidatorAddressSuspicious, ModerationConfig } from '../../../models/ModerationConfig';
import ValidatorPowerPercentBar from '../../../components/ValidatorPowerPercentBar/ValidatorPowerPercentBar';
import { ChainIndexingAPI } from '../../../service/rpc/ChainIndexingAPI';

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
                <ExclamationCircleOutlined style={{ color: 'red' }} />
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
      sorter: (a, b) => new Big(a.currentTokens).cmp(new Big(b.currentTokens)),
      defaultSortOrder: 'descend' as any,
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
      title: t('staking.validatorList.table.validatorApy'),
      key: 'apy',
      sorter: (a, b) => new Big(a.apy).cmp(new Big(b.apy)),
      render: record => {
        return <span>{new Big(record.apy).times(100).toFixed(2)}%</span>;
      },
    },
    {
      title: t('staking.validatorList.table.validatorUptime'),
      key: 'uptime',
      sorter: (a, b) => new Big(a.uptime).cmp(new Big(b.uptime)),
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
      const apiClient = ChainIndexingAPI.init(currentSession.wallet.config.indexingUrl);

      return await Promise.all(
        validatorList.map(async (validator, idx) => {
          if (
            new Big(validator.cumulativeSharesIncludePercentage!).gte(
              CUMULATIVE_SHARE_PERCENTAGE_THRESHOLD,
            ) &&
            !displayedWarningColumn
          ) {
            displayedWarningColumn = true;
            willDisplayWarningColumn = true;
          }
          const [validatorApyRaw, validatorUptime] = await Promise.all([
            apiClient.getValidatorsAverageApy([validator.validatorAddress]),
            apiClient.getValidatorUptimeByAddress(validator.validatorAddress),
          ]);

          const validatorModel = {
            ...validator,
            apy: validatorApyRaw ? new Big(validatorApyRaw).toString() : '0',
            uptime: validatorUptime ? new Big(validatorUptime).toString() : '0',
            key: `${idx}`,
            displayWarningColumn: willDisplayWarningColumn,
          };

          willDisplayWarningColumn = false;

          return validatorModel;
        }),
      );
    }
    return [];
  };

  useEffect(() => {
    const syncValidatorsData = async () => {
      const validatorList = await processValidatorList(currentValidatorList);
      setValidatorTopList(validatorList);
    };

    syncValidatorsData();
  }, currentValidatorList);

  return (
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
          new Big(record.cumulativeSharesIncludePercentage!).lte(
            CUMULATIVE_SHARE_PERCENTAGE_THRESHOLD,
          ) || record.displayWarningColumn;
        return greyBackground ? 'grey-background' : '';
      }}
      defaultExpandAllRows
    />
  );
};

export default ValidatorListTable;
