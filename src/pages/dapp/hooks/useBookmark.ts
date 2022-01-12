import { atom, useRecoilState } from 'recoil';
import { Bookmark } from '../../../models/DappBrowser';
import { getLocalSetting, setLocalSetting, SettingsKey } from '../../../utils/localStorage';

const bookmarkList = atom({
  key: 'dapp_bookmark_list',
  default: getLocalSetting<Bookmark[]>(SettingsKey.DappBookmarks),
});

export const useBookmark = () => {
  const [list, setList] = useRecoilState(bookmarkList);

  const validate = (url: string) => {
    return !list.some(item => item.url === url);
  };

  const updateList = (lst: Bookmark[]) => {
    setList(lst);
    setLocalSetting(SettingsKey.DappBookmarks, lst);
  };

  const add = (bookmark: Bookmark) => {
    if (!validate(bookmark.url)) {
      return;
    }
    updateList([...list, bookmark]);
  };

  const remove = (url: string) => {
    updateList(list.filter(item => item.url !== url));
  };

  return { list, add, remove, validate };
};
