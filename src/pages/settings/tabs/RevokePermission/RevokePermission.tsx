import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { hexZeroPad, Interface } from 'ethers/lib/utils';
import { Log } from '@ethersproject/abstract-provider';
import { Button } from 'antd';
import { useCronosEvmAsset } from '../../../../hooks/useCronosEvmAsset';
import CRC20TokenContract from '../../../../service/signers/abi/TokenContractABI.json';
import { CronosClient } from '../../../../service/cronos/CronosClient';
import CRC20TokenList from './CRC20TokenList';
import ErrorXmark from '../../../../components/ErrorXmark/ErrorXmark';

const RevokePermission = () => {
  const cronosAsset = useCronosEvmAsset();
  const [error, setError] = useState<Error | null>(null);
  const [transferEvents, setTransferEvents] = useState<Log[]>();
  const [approvalEvents, setApprovalEvents] = useState<Log[]>();

  const fetchTxAndApprovals = async (
    nodeURL: string,
    indexingURL: string,
    chainID: string,
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
      cronosAsset.config.chainId,
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
              Retry
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
    return <React.Fragment />;
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
        filterUnverifiedTokens={false}
        filterZeroBalances={false}
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
