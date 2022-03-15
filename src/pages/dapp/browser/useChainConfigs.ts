import { atom, useRecoilState } from "recoil";
import { getLocalSetting, setLocalSetting, SettingsKey } from "../../../utils/localStorage";
import { DappBrowserIPC } from "../types";


const dappChainConfigs = atom({
  key: 'dapp_chain_configs',
  default: getLocalSetting<DappBrowserIPC.EthereumChainConfig[]>(SettingsKey.DappChainConfigs),
});

const dappSelectedChain = atom({
  key: 'dapp_selected_chain',
  default: getLocalSetting<DappBrowserIPC.EthereumChainConfig>(SettingsKey.DappSelectedChain),
})

export const useChainConfigs = () => {
  const [list, setList] = useRecoilState(dappChainConfigs);

  const [selectedChain, setSelectedChain] = useRecoilState(dappSelectedChain);

  const validate = (chainId: string) => {
    return !list.some(item => item.chainId === chainId);
  };

  const updateList = (lst: DappBrowserIPC.EthereumChainConfig[]) => {
    setList(lst);
    setLocalSetting(SettingsKey.DappChainConfigs, lst);
  };

  const add = (config: DappBrowserIPC.EthereumChainConfig) => {
    if (!validate(config.chainId)) {
      return;
    }
    updateList([...list, config]);
  };

  const remove = (chainId: string) => {
    updateList(list.filter(item => item.chainId !== chainId));
  };

  return { list, add, remove, validate, selectedChain, setSelectedChain };
};
