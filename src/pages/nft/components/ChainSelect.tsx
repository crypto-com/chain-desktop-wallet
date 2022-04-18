import { Select } from 'antd';
import React, { useState } from 'react';
import { useCronosEvmAsset, useCronosTendermintAsset } from '../../../hooks/useCronosEvmAsset';
import { UserAsset } from '../../../models/UserAsset';

interface IChainSelectProps {
  onChangeAsset: (asset: UserAsset | undefined) => void;
}

const ChainSelect = (props: IChainSelectProps) => {
  const cronosTendermintAsset = useCronosTendermintAsset();
  const cronosEvmAsset = useCronosEvmAsset();
  const [currentAsset, setCurrentAsset] = useState(cronosTendermintAsset);
  const selectableAssets = [cronosTendermintAsset, cronosEvmAsset];

  return (
    <Select
      style={{ minWidth: '180px' }}
      showArrow
      onChange={value => {
        const selectedAsset: UserAsset | undefined =
          selectableAssets.find(asset => asset?.identifier === value) ?? cronosTendermintAsset;
        props.onChangeAsset(selectedAsset);
        setCurrentAsset(selectedAsset);
      }}
      options={selectableAssets.map(a => {
        return {
          label: a?.name ?? '',
          key: a?.identifier ?? '',
          value: a?.identifier ?? '',
        };
      })}
      value={currentAsset?.identifier}
    />
  );
};

export default ChainSelect;
