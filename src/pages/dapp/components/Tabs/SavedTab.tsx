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
                padding: '26px 16px',
                alignItems: 'center',
                height: '100%',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                }}
              >
                <img
                  src={bookmark.faviconURL}
                  style={{
                    borderRadius: '24px',
                    width: '48px',
                    height: '48px',
                  }}
                  alt="favicon"
                />
                <div
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    wordBreak: 'break-all',
                    marginTop: '16px',
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
                    justifySelf: 'flex-end',
                    marginTop: 'auto',
                  }}
                >
                  {bookmark.url}
                </div>
              </div>
              <div
                style={{
                  marginLeft: 'auto',
                  cursor: 'pointer',
                  width: '40px',
                  flexWrap: 'nowrap',
                  alignSelf: 'flex-start',
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
