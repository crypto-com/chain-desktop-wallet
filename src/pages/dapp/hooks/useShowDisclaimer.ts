import { atom, useRecoilState } from 'recoil';
import { getLocalSetting, setLocalSetting, SettingsKey } from '../../../utils/localStorage';

const disclaimerDisableList = atom({
  key: 'dapp_disclaimer_list',
  default: getLocalSetting<string[]>(SettingsKey.DappDisclaimerDisabledList),
});

export const useShowDisclaimer = () => {
  const [list, setList] = useRecoilState(disclaimerDisableList);

  const validate = (url: string) => {
    return !list.some(item => item === url);
  };

  const updateList = (lst: string[]) => {
    setList(lst);
    setLocalSetting(SettingsKey.DappDisclaimerDisabledList, lst);
  };

  const shouldShowDisclaimer = (url: string) => {
    return validate(url);
  };

  const setDisableDisclaimer = (url: string) => {
    if (!validate(url)) {
      return;
    }
    updateList([...list, url]);
  };

  return { list, shouldShowDisclaimer, setDisableDisclaimer, validate };
};
