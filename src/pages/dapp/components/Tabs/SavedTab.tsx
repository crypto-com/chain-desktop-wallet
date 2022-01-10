import { StarOutlined } from '@ant-design/icons';
import { Content } from 'antd/lib/layout/layout';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SavedBrowserBookmark } from '../../../../models/DappBrowser';
import { DappBrowserService } from '../../../../service/DappBrowserService';
import { walletService } from '../../../../service/WalletService';

interface ISavedTabProps {
  onClick: () => void;
}

const EmptyState = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: '200px',
        color: '#7B849B',
      }}
    >
      <StarOutlined style={{ fontSize: '20px' }} />
      <div
        style={{
          marginTop: '6px',
          fontSize: '16px',
        }}
      >
        You dont have any saved DApps yet
      </div>
    </div>
  );
};

const SavedTab = (props: ISavedTabProps) => {
  const { onClick } = props;

  const [bookmarks, setBookmarks] = useState<SavedBrowserBookmark[]>([]);

  const browserService = useMemo(() => {
    return new DappBrowserService(walletService.storageService);
  }, [walletService]);

  const fetchBrowserBookmarks = useCallback(async () => {
    const savedBookmarks = await browserService.retrieveBookmarks();
    setBookmarks([...savedBookmarks]);
  }, [browserService]);

  useEffect(() => {}, [fetchBrowserBookmarks]);

  return (
    <Content onClick={onClick}>
      {bookmarks.length < 1 ? <EmptyState /> : <div>Bookmarks</div>}
    </Content>
  );
};

export default SavedTab;
