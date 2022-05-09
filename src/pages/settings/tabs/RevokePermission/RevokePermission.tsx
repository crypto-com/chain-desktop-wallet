import * as React from 'react';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { hexZeroPad, Interface } from 'ethers/lib/utils';
import { Filter, Log } from '@ethersproject/abstract-provider';
import { useCronosEvmAsset } from '../../../../hooks/useCronosEvmAsset';
import CRC20TokenContract from '../../../../service/signers/abi/TokenContractABI.json';
import { getLogsFromProvider } from './utils';
import { CronosClient } from '../../../../service/cronos/CronosClient';
import CRC20TokenList from './CRC20TokenList';

const RevokePermission = () => {
  const cronosAsset = useCronosEvmAsset();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [transferEvents, setTransferEvents] = useState<Log[]>();
  const [approvalEvents, setApprovalEvents] = useState<Log[]>();
  // const [approvalForAllEvents, setApprovalForAllEvents] = useState<Log[]>()

  const fetchTxAndApprovals = async (
    nodeURL: string,
    indexingURL: string,
    chainID: string,
    inputAddress: string,
  ) => {
    setLoading(true);

    const provider = new ethers.providers.JsonRpcProvider(nodeURL);

    // const latestBlockNumber = await provider.getBlockNumber();
    const tokenInterface = new Interface(CRC20TokenContract.abi);

    const cronosClient = new CronosClient(nodeURL, indexingURL);

    const foundTransferEvents = await cronosClient.getEventLogByAddress({
      fromBlock: 0,
      toBlock: 'latest',
      topics: {
        topic0: tokenInterface.getEventTopic('Transfer'),
        topic1: hexZeroPad(inputAddress, 32).toLowerCase(),
        topic0_1_opr: 'and',
      },
    });
    setTransferEvents(foundTransferEvents);

    const foundApprovalEvents = await cronosClient.getEventLogByAddress({
      fromBlock: 0,
      toBlock: 'latest',
      topics: {
        topic0: tokenInterface.getEventTopic('Approval'),
        topic1: hexZeroPad(inputAddress, 32).toLowerCase(),
        topic0_1_opr: 'and',
      },
    });
    setApprovalEvents(foundApprovalEvents);

    // const foundApprovalForAllEvents = await cronosClient.getEventLogByAddress({
    //   fromBlock: 0,
    //   toBlock: 'latest',
    //   topics: {
    //     'topic0': tokenInterface.getEventTopic('ApprovalForAll'),
    //     'topic0_1_opr': 'and',
    //     'topic1': hexZeroPad(inputAddress, 32).toLowerCase()
    //   }
    // })
    // setApprovalForAllEvents(foundApprovalForAllEvents)
    // console.log('ApprovalForAll events', foundApprovalForAllEvents)

    setLoading(false);
  };

  useEffect(() => {
    if (!cronosAsset?.config?.nodeUrl || !cronosAsset.address || !cronosAsset.config.indexingUrl) {
      return;
    }

    fetchTxAndApprovals(
      cronosAsset.config.nodeUrl,
      cronosAsset.config.indexingUrl,
      cronosAsset.config.chainId,
      cronosAsset.address,
    );
  }, [cronosAsset]);

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
