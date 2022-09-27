import * as React from 'react';
import { Log } from '@ethersproject/abstract-provider';
import { Button } from 'antd';
import { hexZeroPad, Interface } from 'ethers/lib/utils';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ErrorXmark from '../../../../components/ErrorXmark/ErrorXmark';
import { useCronosEvmAsset } from '../../../../hooks/useAsset';
import { CronosClient } from '../../../../service/cronos/CronosClient';
import CRC20TokenContract from '../../../../service/signers/abi/TokenContractABI.json';
import CRC20TokenList from './CRC20TokenList';

const RevokePermission = () => {
  const cronosAsset = useCronosEvmAsset();
  const [error, setError] = useState<Error | null>(null);
  const [transferEvents, setTransferEvents] = useState<Log[]>();
  const [approvalEvents, setApprovalEvents] = useState<Log[]>();
  const [t] = useTranslation();

  const fetchTxAndApprovals = async (
    nodeURL: string,
    indexingURL: string,
    inputAddress: string,
  ) => {
    setError(null);

    try {
      const tokenInterface = new Interface(CRC20TokenContract.abi);

      const cronosClient = new CronosClient(nodeURL, indexingURL);

      const [foundTransferEvents, foundApprovalEvents] = await Promise.all([
        cronosClient.getEventLogByAddress({
          fromBlock: 0,
          toBlock: 'latest',
          topics: {
            topic0: tokenInterface.getEventTopic('Transfer'),
            topic1: hexZeroPad(inputAddress, 32).toLowerCase(),
            topic0_1_opr: 'and',
          },
        }),
        cronosClient.getEventLogByAddress({
          fromBlock: 0,
          toBlock: 'latest',
          topics: {
            topic0: tokenInterface.getEventTopic('Approval'),
            topic1: hexZeroPad(inputAddress, 32).toLowerCase(),
            topic0_1_opr: 'and',
          },
        }),
      ]);
      setTransferEvents(foundTransferEvents);
      setApprovalEvents(foundApprovalEvents);
    } catch (e) {
      setError((e as unknown) as any);
    }
  };

  const fetch = useCallback(() => {
    if (!cronosAsset?.config?.nodeUrl || !cronosAsset.address || !cronosAsset.config.indexingUrl) {
      return;
    }

    fetchTxAndApprovals(
      cronosAsset.config.nodeUrl,
      cronosAsset.config.indexingUrl,
      cronosAsset.address,
    );
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  if (error) {
    return (
      <div
        className="site-layout-background settings-content"
        style={{
          padding: '10px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ErrorXmark />
          <div>{error.toString()}</div>
          <div>
            <Button type="primary" onClick={() => fetch()}>
              {t('general.retry')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (
    !cronosAsset ||
    !cronosAsset.config?.nodeUrl ||
    !cronosAsset.config.indexingUrl ||
    !transferEvents ||
    !approvalEvents
  ) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px',
          color: '#777777',
        }}
      >
        {t('settings.noApproval')}
      </div>
    );
  }

  return (
    <div
      className="site-layout-background settings-content"
      style={{
        padding: '10px',
      }}
    >
      <CRC20TokenList
        onError={e => {
          setError(e);
        }}
        onRevokeSuccess={() => {
          fetch();
        }}
        cronosAsset={cronosAsset}
        explorerURL={cronosAsset.config?.explorerUrl ?? ''}
        transferEvents={transferEvents}
        approvalEvents={approvalEvents}
        inputAddress={cronosAsset.address}
        nodeURL={cronosAsset.config?.nodeUrl}
        indexingURL={cronosAsset.config?.indexingUrl}
      />
    </div>
  );
};

export default RevokePermission;
