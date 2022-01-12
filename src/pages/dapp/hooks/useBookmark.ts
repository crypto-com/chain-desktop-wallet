import { atom, useRecoilState } from 'recoil';
import { Bookmark } from '../../../models/DappBrowser';
import { getLocalSetting, setLocalSetting, SettingsKey } from '../../../utils/localStorage';

export const bookmarkList = atom({
  key: 'dapp_bookmark_list',
  default: getLocalSetting<Bookmark[]>(SettingsKey.DappBookmarks),
});

export const useBookmark = () => {
  const [list, setList] = useRecoilState(bookmarkList);

  const validate = (bookmark: Bookmark) => {
    return !list.some(item => item.url === bookmark.url);
  };

  const updateList = (lst: Bookmark[]) => {
    setList(lst);
    setLocalSetting(SettingsKey.DappBookmarks, lst);
  };

  const add = (bookmark: Bookmark) => {
    if (!validate(bookmark)) {
      throw new Error('URL already exists');
    }
    updateList([...list, bookmark]);
  };

  const remove = (url: string) => {
    updateList(list.filter(item => item.url !== url));
  };

  return { list, add, remove, validate };
};
