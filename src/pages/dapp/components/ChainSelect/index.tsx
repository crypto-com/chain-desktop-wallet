import { Select } from 'antd';
import * as React from 'react';
import { isHexEqual } from '../../../../utils/utils';
import { useChainConfigs } from '../../browser/useChainConfigs';
import './index.less';

const { Option } = Select;

const ChainSelect = () => {
  const { list: chainConfigs, selectedChain, setSelectedChain } = useChainConfigs();

  return (
    <div
      className="chain-select"
      style={{
        width: '200px',
        margin: 'auto 10px',
      }}
    >
      <Select
        value={selectedChain.chainId}
        onChange={(chainId: string) => {
          const config = chainConfigs.find(chainConfig => isHexEqual(chainConfig.chainId, chainId));
          if (config) {
            setSelectedChain(config);
          }
        }}
        style={{
          width: '100%',
          border: 'none',
        }}
      >
        {chainConfigs.map(c => {
          return (
            <Option key={c.chainId} value={c.chainId}>
              {c.chainName}
            </Option>
          );
        })}
      </Select>
    </div>
  );
};

export default ChainSelect;
