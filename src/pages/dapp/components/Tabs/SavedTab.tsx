import { StarOutlined } from '@ant-design/icons';
import { Card } from 'antd';
import { Content } from 'antd/lib/layout/layout';
import * as React from 'react';
import { Bookmark } from '../../../../models/DappBrowser';
import { IconBookmarkFilled } from '../../../../svg/IconBookmark';
import { useBookmark } from '../../hooks/useBookmark';

interface ISavedTabProps {
  onClick: (bookmark: Bookmark) => void;
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

  const { list: bookmarks, remove } = useBookmark();

  const BookmarkList = () => {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(312px, 1fr))',
          gridGap: '32px',
        }}
      >
        {bookmarks.map(bookmark => {
          return (
            <Card
              onClick={() => {
                onClick(bookmark);
              }}
              key={bookmark.url}
              bodyStyle={{
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'row',
                padding: '16px',
                alignItems: 'center',
              }}
            >
              <img
                src={bookmark.faviconURL}
                style={{
                  borderRadius: '16px',
                  width: '32px',
                  height: '32px',
                  marginRight: '20px',
                }}
                alt="favicon"
              />
              <div
                style={{
                  minWidth: '10px',
                  whiteSpace: 'nowrap',
                }}
              >
                <div
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontWeight: 600,
                    fontSize: '16px',
                  }}
                >
                  {bookmark.title}
                </div>
                <div
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontSize: '12px',
                    color: '#1199FA',
                  }}
                >
                  {bookmark.url}
                </div>
              </div>
              <div
                style={{
                  marginLeft: 'auto',
                  cursor: 'pointer',
                }}
                onClick={e => {
                  e.stopPropagation();
                  remove(bookmark.url);
                }}
              >
                <IconBookmarkFilled width={30} height={30} />
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <Content
      style={{
        marginBottom: '20px',
      }}
    >
      {bookmarks.length < 1 ? <EmptyState /> : <BookmarkList />}
    </Content>
  );
};

export default SavedTab;
