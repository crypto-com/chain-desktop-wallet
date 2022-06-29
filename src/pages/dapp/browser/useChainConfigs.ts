import { atom, useRecoilState } from 'recoil';
import { EVMChainConfig } from '../../../models/Chain';
import { getLocalSetting, setLocalSetting, SettingsKey } from '../../../utils/localStorage';
import { isHexEqual } from '../../../utils/utils';


const dappChainConfigs = atom({
  key: 'dapp_chain_configs',
  default: getLocalSetting<EVMChainConfig[]>(SettingsKey.DappChainConfigs),
});

const dappSelectedChain = atom({
  key: 'dapp_selected_chain',
  default: getLocalSetting<EVMChainConfig>(SettingsKey.DappSelectedChain),
});

export const useChainConfigs = () => {
  const [list, setList] = useRecoilState(dappChainConfigs);

  const [selectedChain, setSelectedChainState] = useRecoilState(dappSelectedChain);

  const setSelectedChain = (chainConfig: EVMChainConfig) => {
    setSelectedChainState(chainConfig);
    setLocalSetting(SettingsKey.DappSelectedChain, chainConfig);
  };

  const validate = (chainId: string) => {
    return !list.some(item => isHexEqual(item.chainId, chainId));
  };

  const updateList = (lst: EVMChainConfig[]) => {
    setList(lst);
    setLocalSetting(SettingsKey.DappChainConfigs, lst);
  };

  const add = (config: EVMChainConfig) => {
    if (!validate(config.chainId)) {
      return false;
    }
    updateList([...list, config]);
    return true;
  };

  const remove = (chainId: string) => {
    updateList(list.filter(item => item.chainId !== chainId));
  };

  return { list, updateList, add, remove, validate, selectedChain, setSelectedChain };
};
