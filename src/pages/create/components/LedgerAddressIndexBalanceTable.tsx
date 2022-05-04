import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FormInstance, Table } from 'antd';

import './LedgerAddressIndexBalanceTable.less';

import { UserAssetType } from '../../../models/UserAsset';
import { CronosClient } from '../../../service/cronos/CronosClient';
import { MainNetEvmConfig } from '../../../config/StaticAssets';

const LedgerAddressIndexBalanceTable = (props: {
  addressIndexBalanceList;
  form?: FormInstance;
  // eslint-disable-next-line react/no-unused-prop-types
  assetType: UserAssetType;
  setisHWModeSelected?: (value: boolean) => void;
}) => {
  const { addressIndexBalanceList: rawAddressIndexBalanceList, form, setisHWModeSelected } = props;
  const [addressIndexBalanceList, setAddressIndexBalanceList] = useState<any[]>([]);

  const [t] = useTranslation();

  const tableColumns = [
    {
      title: 'Address',
      dataIndex: 'publicAddress',
      key: 'publicAddress',
      render: publicAddress => publicAddress,
    },
    {
      title: 'Derivation Path',
      dataIndex: 'derivationPath',
      key: 'derivationPath',
      // sorter: (a, b) => new Big(a.currentTokens).cmp(new Big(b.currentTokens)),
      // defaultSortOrder: 'descend' as any,
      render: derivationPath => {
        return <span>{derivationPath}</span>;
      },
    },
    {
      title: 'Balance',
      dataIndex: 'balance',
      key: 'balance',
      // sorter: (a, b) => new Big(a.cumulativeShares).cmp(new Big(b.cumulativeShares)),
      // defaultSortOrder: 'descend' as any,
      render: balance => {
        return (
          <>
            <span>{balance.toString()}</span>
          </>
        );
      },
    },
    {
      title: t('general.action'),
      key: 'action',
      render: record => (
        <a
          onClick={() => {
            if (setisHWModeSelected) {
              setisHWModeSelected(false);
            }
            if (form) {
              const lastIndexOfSlash = record.derivationPath.lastIndexOf('/');
              const [rootPath, index] = [
                record.derivationPath.substring(0, lastIndexOfSlash),
                record.derivationPath.substring(lastIndexOfSlash + 1),
              ];
              form.setFieldsValue({
                derivationPath: rootPath,
                addressIndex: index,
              });
            }
          }}
        >
          {t('general.select')}
        </a>
      ),
    },
  ];

  const processLedgerAccountsList = async (ledgerAccountList: any[]) => {
    // if (ledgerAccountList) {
    const cronosClient = new CronosClient(MainNetEvmConfig.nodeUrl, MainNetEvmConfig.indexingUrl);

    await ledgerAccountList.forEach(async account => {
      const { publicAddress } = account;
      account.balance = await cronosClient.getNativeBalanceByAddress(publicAddress);
      console.log(`Balance - ${publicAddress}:`, account.balance);
    });

    // }
    return ledgerAccountList || [];
  };

  useEffect(() => {
    const syncAddressIndexBalanceList = async () => {
      const addressList = await processLedgerAccountsList(rawAddressIndexBalanceList);
      console.log('addressList', addressList);
      setAddressIndexBalanceList(addressList);
    };

    syncAddressIndexBalanceList();
  }, [rawAddressIndexBalanceList]);

  return (
    <div className="address-index-balance-list">
      {rawAddressIndexBalanceList.length > 0 ? (
        <Table
          locale={{
            triggerDesc: t('general.table.triggerDesc'),
            triggerAsc: t('general.table.triggerAsc'),
            cancelSort: t('general.table.cancelSort'),
          }}
          dataSource={addressIndexBalanceList}
          columns={tableColumns}
          pagination={{ showSizeChanger: false }}
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          onChange={(pagination, filters, sorter: any) => {}}
          defaultExpandAllRows
        />
      ) : (
        <div>Please connect app</div>
      )}
    </div>
  );
};

export default LedgerAddressIndexBalanceTable;
