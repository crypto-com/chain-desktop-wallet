import { Card } from 'antd';
import * as React from 'react';
import { useState } from 'react';
import { useCronosTendermintAsset } from '../../../../hooks/useAsset';
import { UserAssetType } from '../../../../models/UserAsset';
import ChainSelect from '../../components/ChainSelect';
import { CronosNFTTransactionList } from './Cronos';
import { CryptoOrgNFTTransactionList } from './CryptoOrg';

const NFTTransactionsTab = () => {
  const cronosTendermintAsset = useCronosTendermintAsset();
  const [currentAsset, setCurrentAsset] = useState(cronosTendermintAsset);

  return (
    <Card>
      <ChainSelect onChangeAsset={asset => setCurrentAsset(asset)} />
      <div style={{ paddingTop: '6px' }}>
        {currentAsset?.assetType === UserAssetType.TENDERMINT && <CryptoOrgNFTTransactionList />}
        {currentAsset?.assetType === UserAssetType.EVM && <CronosNFTTransactionList />}
      </div>
    </Card>
  );
};

export default NFTTransactionsTab;
