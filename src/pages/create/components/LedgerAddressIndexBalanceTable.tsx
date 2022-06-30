import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, FormInstance, Spin, Table } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import './LedgerAddressIndexBalanceTable.less';

import { UserAssetType, scaledAmountByAsset } from '../../../models/UserAsset';
import { CronosClient } from '../../../service/cronos/CronosClient';
import {
  CRONOS_TENDERMINT_ASSET,
  CRONOS_EVM_ASSET,
  MainNetEvmConfig,
} from '../../../config/StaticAssets';
import { DefaultWalletConfigs, SupportedChainName } from '../../../config/StaticConfig';
import { NodeRpcService } from '../../../service/rpc/NodeRpcService';
import { LedgerSigner } from '../../../service/signers/LedgerSigner';
import { ISignerProvider } from '../../../service/signers/SignerProvider';
import { createLedgerDevice } from '../../../service/LedgerService';
import { ledgerNotificationWithoutCheck } from '../../../components/LedgerNotification/LedgerNotification';
import { renderExplorerUrl } from '../../../models/Explorer';

const LedgerAddressIndexBalanceTable = (props: {
  addressIndexBalanceList;
  form?: FormInstance;
  assetType: UserAssetType;
  setisHWModeSelected?: (value: boolean) => void;
  setDerivationPath?: ({ tendermint, evm }) => void;
  setAddressIndexBalanceList: (list: any[]) => void;
}) => {
  const DEFAULT_START_INDEX = 10;
  const DEFAULT_GAP = 10;
  const {
    addressIndexBalanceList: rawAddressIndexBalanceList,
    setAddressIndexBalanceList: setRawAddressIndexBalanceList,
    assetType,
    form,
    setisHWModeSelected,
    setDerivationPath,
  } = props;
  const [addressIndexBalanceList, setAddressIndexBalanceList] = useState<any[]>([]);
  const [startIndex, setStartIndex] = useState<number>(DEFAULT_START_INDEX);
  const [loading, setLoading] = useState<boolean>(false);
  const [t] = useTranslation();

  const network = props.form?.getFieldValue('network');
  const isTestnet = network === DefaultWalletConfigs.TestNetCroeseid4Config.name;
  const config = isTestnet
    ? DefaultWalletConfigs.TestNetCroeseid4Config
    : DefaultWalletConfigs.MainNetConfig;
  const cronosTendermintAsset = {
    ...CRONOS_TENDERMINT_ASSET(config),
    walletId: '',
  };

  const cronosEvmAsset = {
    ...CRONOS_EVM_ASSET(config),
    walletId: '',
  };

  const tableColumns = [
    {
      title: t('wallet.table1.address'),
      dataIndex: 'publicAddress',
      key: 'publicAddress',
      render: publicAddress => {
        let url;
        switch (assetType) {
          case UserAssetType.EVM:
            url = `${renderExplorerUrl(cronosEvmAsset.config, 'address')}/${publicAddress}`;
            break;
          case UserAssetType.TENDERMINT:
          default:
            url = `${renderExplorerUrl(cronosTendermintAsset.config, 'address')}/${publicAddress}`;
        }
        return (
          <a data-original={publicAddress} target="_blank" rel="noreferrer" href={url}>
            {publicAddress}
          </a>
        );
      },
    },
    {
      title: t('create.formCustomConfig.derivationPath.label'),
      dataIndex: 'derivationPath',
      key: 'derivationPath',
      render: derivationPath => {
        return <span>{derivationPath}</span>;
      },
    },
    {
      title: t('home.assetList.table.amount'),
      dataIndex: 'balance',
      key: 'balance',
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
            if (form && setDerivationPath) {
              form.setFieldsValue({
                addressIndex: record.index,
              });
              setDerivationPath({
                tendermint: LedgerSigner.getDerivationPath(
                  record.index,
                  UserAssetType.TENDERMINT,
                  form.getFieldValue('derivationPathStandard'),
                ),
                evm: LedgerSigner.getDerivationPath(
                  record.index,
                  UserAssetType.EVM,
                  form.getFieldValue('derivationPathStandard'),
                ),
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
    setLoading(true);
    switch (assetType) {
      case UserAssetType.TENDERMINT: {
        const nodeUrl = isTestnet
          ? DefaultWalletConfigs.TestNetCroeseid4Config.nodeUrl
          : DefaultWalletConfigs.MainNetConfig.nodeUrl;
        const nodeRpc = await NodeRpcService.init({ baseUrl: nodeUrl });

        await Promise.all(
          ledgerAccountList.map(async account => {
            const { publicAddress } = account;
            const nativeBalance = await nodeRpc.loadAccountBalance(
              publicAddress,
              isTestnet ? 'basetcro' : 'basecro',
            );
            account.balance = `${scaledAmountByAsset(nativeBalance, cronosTendermintAsset)} ${
              cronosTendermintAsset.symbol
            }`;
          }),
        ).then(() => {
          setAddressIndexBalanceList(ledgerAccountList);
          setLoading(false);
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
          setLoading(false);
        });
      }
    }
  };

  const onLoadMoreAddressList = async () => {
    const device: ISignerProvider = createLedgerDevice();
    const standard = form?.getFieldValue('derivationPathStandard');

    try {
      switch (assetType) {
        case UserAssetType.EVM:
          {
            const ethAddressList = await device.getEthAddressList(
              startIndex,
              DEFAULT_GAP,
              standard,
            );
            if (ethAddressList) {
              const returnList = ethAddressList.map((address, idx) => {
                return {
                  index: startIndex + idx,
                  publicAddress: address,
                  derivationPath: LedgerSigner.getDerivationPath(
                    startIndex + idx,
                    UserAssetType.EVM,
                    standard,
                  ),
                  balance: '0',
                };
              });
              setStartIndex(startIndex + DEFAULT_GAP);
              setRawAddressIndexBalanceList(rawAddressIndexBalanceList.concat(returnList));
            }
          }
          break;
        case UserAssetType.TENDERMINT:
          {
            const tendermintAddressList = await device.getAddressList(
              startIndex,
              DEFAULT_GAP,
              isTestnet ? 'tcro' : 'cro',
              SupportedChainName.CRYPTO_ORG,
              standard,
            );
            if (tendermintAddressList) {
              const returnList = tendermintAddressList.map((address, idx) => {
                return {
                  index: startIndex + idx,
                  publicAddress: address,
                  derivationPath: LedgerSigner.getDerivationPath(
                    startIndex + idx,
                    UserAssetType.TENDERMINT,
                    standard,
                  ),
                  balance: '0',
                };
              });
              setStartIndex(startIndex + DEFAULT_GAP);
              setRawAddressIndexBalanceList(rawAddressIndexBalanceList.concat(returnList));
            }
          }
          break;
        default:
      }
    } catch {
      ledgerNotificationWithoutCheck(assetType, SupportedChainName.CRYPTO_ORG);
    }
  };

  useEffect(() => {
    const syncAddressIndexBalanceList = () => {
      processLedgerAccountsList(rawAddressIndexBalanceList);
    };

    syncAddressIndexBalanceList();
  }, [rawAddressIndexBalanceList]);

  useEffect(() => {
    setStartIndex(DEFAULT_START_INDEX);
  }, [assetType]);

  return (
    <div className="address-index-balance-list">
      {rawAddressIndexBalanceList.length > 0 ? (
        <>
          <Table
            locale={{
              triggerDesc: t('general.table.triggerDesc'),
              triggerAsc: t('general.table.triggerAsc'),
              cancelSort: t('general.table.cancelSort'),
            }}
            dataSource={addressIndexBalanceList}
            columns={tableColumns}
            pagination={{ showSizeChanger: false }}
            defaultExpandAllRows
            loading={{
              indicator: <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />,
              spinning: loading,
            }}
          />
          <Button
            type="ghost"
            style={{ float: 'right', marginRight: '0', border: '0', boxShadow: 'none' }}
            loading={loading}
            onClick={async () => {
              setLoading(true);
              setTimeout(() => {
                onLoadMoreAddressList();
                setLoading(false);
              }, 500);
            }}
          >
            {t('general.loadMore')}
          </Button>
        </>
      ) : (
        <></>
      )}
    </div>
  );
};

export default LedgerAddressIndexBalanceTable;
