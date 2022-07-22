
import { BellOutlined, SyncOutlined, TeamOutlined } from '@ant-design/icons';
import { Avatar, List, Popover, Typography } from 'antd';
import * as React from 'react';
import { useEffect } from 'react';
import { useNotification } from '../../service/notification';
import { NotificationItem } from '../../service/notification/types';
import "./style.less"

interface INotificationCenterProps {
  onClick?: () => void;
}

const DEV_NOTIFICATION_LIST_PROVIDER = "https://gist.githubusercontent.com/XinyuCRO/8bb2405059681fdd6e2e2812a2c5aed6/raw/notification.dev.json"

const IconFromNotification = (notification: NotificationItem) => {
  switch (notification.type) {
    case 'remote':
      return <SyncOutlined />
    case 'customerService':
      return <TeamOutlined />

    default:
      return <SyncOutlined />
  }
}

const NotificationCenter = ({ onClick }: INotificationCenterProps) => {

  const { notifications, fetchNotifications } = useNotification();

  useEffect(() => {
    fetchNotifications(DEV_NOTIFICATION_LIST_PROVIDER)
  }, [])

  const NotificationList = () => {

    return <div style={{ width: "500px", padding: "10px" }}>
      <div style={{ fontSize: "24px", fontWeight: "bold", marginTop: "10px" }}>Notifications</div>
      <List
        itemLayout="vertical"
        size="large"
        pagination={{
          pageSize: 5,
        }}
        dataSource={notifications.slice().reverse()}
        renderItem={item => (
          <List.Item key={item.id} style={{ padding: "16px 10px" }}>
            <div style={{ display: 'flex', flexDirection: "row", alignItems: "center" }}>
              <div style={{ display: 'flex', alignSelf: "start", alignItems: 'center', justifyContent: "center" }}>
                <div>
                  {
                    !item.isRead && <div style={{ width: "8px", height: "8px", borderRadius: "4px", backgroundColor: "#1199FA", marginRight: "10px" }} />
                  }
                </div>
                <div style={{ width: "48px", height: "48px", }}>
                  <Avatar size={48} icon={IconFromNotification(item)} style={{ backgroundColor: "#7B849B" }} />
                </div>
              </div>
              <div style={{ marginLeft: "10px", overflow: "hidden" }}>
                <Typography.Paragraph style={{ fontSize: "14px" }} ellipsis={{ rows: 1, expandable: true }}>
                  {item.content}
                </Typography.Paragraph>
                <div style={{ fontSize: "10px", color: "#626973" }}>{new Date(item.createdAt).toLocaleString()}</div>
              </div>
            </div>
          </List.Item>
        )}
      />
    </div>
  }

  return <>
    <Popover destroyTooltipOnHide overlayClassName='notification-popover' placement="topLeft" content={<NotificationList />} trigger="click">
      <BellOutlined onClick={() => {
        onClick?.()
      }} />
    </Popover>
  </>
}

export default NotificationCenter;
