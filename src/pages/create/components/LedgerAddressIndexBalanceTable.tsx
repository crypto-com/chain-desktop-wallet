import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FormInstance, Table } from 'antd';

import './LedgerAddressIndexBalanceTable.less';

import { UserAssetType, scaledAmountByAsset } from '../../../models/UserAsset';
import { CronosClient } from '../../../service/cronos/CronosClient';
import {
  CRONOS_TENDERMINT_ASSET,
  CRONOS_EVM_ASSET,
  MainNetEvmConfig,
} from '../../../config/StaticAssets';
import { DefaultWalletConfigs } from '../../../config/StaticConfig';
import { NodeRpcService } from '../../../service/rpc/NodeRpcService';

const LedgerAddressIndexBalanceTable = (props: {
  addressIndexBalanceList;
  form?: FormInstance;
  // eslint-disable-next-line react/no-unused-prop-types
  assetType: UserAssetType;
  setisHWModeSelected?: (value: boolean) => void;
}) => {
  const {
    addressIndexBalanceList: rawAddressIndexBalanceList,
    assetType,
    form,
    setisHWModeSelected,
  } = props;
  const [addressIndexBalanceList, setAddressIndexBalanceList] = useState<any[]>([]);

  const [t] = useTranslation();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const cronosTendermintAsset = {
    ...CRONOS_TENDERMINT_ASSET(DefaultWalletConfigs.MainNetConfig),
    walletId: '',
  };
  const cronosEvmAsset = { ...CRONOS_EVM_ASSET(DefaultWalletConfigs.MainNetConfig), walletId: '' };

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
    switch (assetType) {
      case UserAssetType.TENDERMINT: {
        const nodeRpc = await NodeRpcService.init(DefaultWalletConfigs.MainNetConfig.nodeUrl);

        await Promise.all(
          ledgerAccountList.map(async account => {
            const { publicAddress } = account;
            const nativeBalance = await nodeRpc.loadAccountBalance(publicAddress, 'basecro');
            account.balance = `${scaledAmountByAsset(nativeBalance, cronosTendermintAsset)} ${
              cronosEvmAsset.symbol
            }`;
          }),
        ).then(() => {
          setAddressIndexBalanceList(ledgerAccountList);
        });
        break;
      }
      case UserAssetType.EVM:
      default: {
        const cronosClient = new CronosClient(
          MainNetEvmConfig.nodeUrl,
          MainNetEvmConfig.indexingUrl,
        );

        await Promise.all(
          ledgerAccountList.map(async account => {
            const { publicAddress } = account;
            const nativeBalance = await cronosClient.getNativeBalanceByAddress(publicAddress);
            account.balance = `${scaledAmountByAsset(nativeBalance, cronosEvmAsset)} ${
              cronosEvmAsset.symbol
            }`;
          }),
        ).then(() => {
          setAddressIndexBalanceList(ledgerAccountList);
        });
      }
    }
  };

  useEffect(() => {
    const syncAddressIndexBalanceList = () => {
      processLedgerAccountsList(rawAddressIndexBalanceList);
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
