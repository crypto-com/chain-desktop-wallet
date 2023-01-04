import { BellOutlined, SyncOutlined, TeamOutlined } from '@ant-design/icons';
import { Avatar, List, Popover, Typography, Badge } from 'antd';
import * as React from 'react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useIntercom } from 'react-use-intercom';
import {
  NOTIFICATION_DEV_CONFIG_FILE_URL,
  NOTIFICATION_RELEASE_CONFIG_FILE_URL,
  ThemeColor,
} from '../../config/StaticConfig';
import useInterval from '../../hooks/useInterval';
import { useNotification } from '../../service/notification';
import { NotificationItem } from '../../service/notification/types';
import './style.less';

interface INotificationCenterProps {
  onClick?: () => void;
}

const IconFromNotification = (notification: NotificationItem) => {
  switch (notification.type) {
    case 'remote':
      return <SyncOutlined />;
    case 'customerService':
      return <TeamOutlined />;

    default:
      return <SyncOutlined />;
  }
};

const NotificationCenter = ({ onClick }: INotificationCenterProps) => {
  const { notifications, fetchNotifications, hasUnread, markAllAsRead } = useNotification();

  const [t] = useTranslation();

  const { show } = useIntercom();

  const fetch = () => {
    const providerURL =
      process.env.NODE_ENV === 'development'
        ? NOTIFICATION_DEV_CONFIG_FILE_URL
        : NOTIFICATION_RELEASE_CONFIG_FILE_URL;
    fetchNotifications(providerURL);
  };

  useEffect(() => {
    fetch();
  }, []);

  useInterval(() => {
    fetch();
  }, 5 * 60_000);

  const NotificationList = () => {
    return (
      <div style={{ width: '500px', padding: '10px' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '10px' }}>
          {t('general.notification.title')}
        </div>
        <List
          itemLayout="vertical"
          size="large"
          pagination={{
            pageSize: 5,
          }}
          dataSource={notifications.slice().reverse()}
          renderItem={item => (
            <List.Item key={item.id} style={{ padding: '16px 10px' }}>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                <div
                  style={{
                    display: 'flex',
                    alignSelf: 'start',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div style={{ position: 'absolute', left: '-10px' }}>
                    {!item.isRead && (
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '4px',
                          backgroundColor: ThemeColor.BLUE,
                          marginRight: '10px',
                        }}
                      />
                    )}
                  </div>
                  <div style={{ width: '48px', height: '48px' }}>
                    <Avatar
                      size={48}
                      icon={IconFromNotification(item)}
                      style={{ backgroundColor: '#7B849B' }}
                    />
                  </div>
                </div>
                <div style={{ marginLeft: '10px', overflow: 'hidden' }}>
                  <Typography.Paragraph
                    style={{ fontSize: '14px' }}
                    ellipsis={{ rows: 1, expandable: true, symbol: t('general.notification.expand') }}
                  >
                    {item.content}
                  </Typography.Paragraph>
                  <div style={{ fontSize: '10px', color: '#626973' }}>
                    {new Date(item.createdAt).toLocaleString()}
                  </div>
                  {item.type === 'customerService' && (
                    <a
                      onClick={() => {
                        show();
                      }}
                      style={{ fontSize: '13px', color: ThemeColor.BLUE }}
                    >
                      {t('general.notification.viewMessage')}
                    </a>
                  )}
                </div>
              </div>
            </List.Item>
          )}
        />
      </div>
    );
  };

  return (
    <>
      <Popover
        onVisibleChange={visible => {
          if (!visible) {
            markAllAsRead();
          }
        }}
        destroyTooltipOnHide
        overlayClassName="notification-popover"
        placement="topLeft"
        content={<NotificationList />}
        trigger="click"
      >
        <Badge
          dot
          style={{
            display: hasUnread ? 'block' : 'none',
          }}
        >
          <BellOutlined
            style={{ fontSize: 24 }}
            onClick={() => {
              onClick?.();
            }}
          />
        </Badge>
      </Popover>
    </>
  );
};

export default NotificationCenter;
