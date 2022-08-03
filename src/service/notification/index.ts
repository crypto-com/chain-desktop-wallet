import { atom, useRecoilState } from 'recoil';
import { getRecoil, setRecoil } from 'recoil-nexus'
import { getLocalSetting, setLocalSetting, SettingsKey } from '../../utils/localStorage';
import { fetchRemoteNotifications, isRemoteNotificationExpired } from './remote';
import { LocalNotification, NotificationItem, RemoteNotification } from './types';

export const getNotificationsInSettings = () => {
  return getLocalSetting<NotificationItem[]>(SettingsKey.Notification);
};

export const setNotificationsInSettings = (notifications: NotificationItem[]) => {
  setLocalSetting(SettingsKey.Notification, notifications);
};

const notificationsState = atom({
  key: 'notifications',
  default: getLocalSetting<NotificationItem[]>(SettingsKey.Notification),
});

const notificationHasUnRead = atom({
  key: 'notificationHasUnRead',
  default: false,
})

// use outside hooks
export const postLocalNotification = (notification: LocalNotification) => {

  const notifications = getRecoil(notificationsState);
  const newNotification = {
      id: Date.now(),
      content: notification.content,
      isRead: false,
      type: notification.type,
      createdAt: Date.now(),
  }

  const newNotifications = [...notifications, newNotification];

  setRecoil(notificationsState, newNotifications);
  setNotificationsInSettings(newNotifications);

  // update read status
  const hasUnRead = notifications.some(n => n.isRead === false);
  setRecoil(notificationHasUnRead, hasUnRead);

  // eslint-disable-next-line no-new
  new Notification(notification.content);
}

export const useNotification = () => {
  const [notifications, setNotifications] = useRecoilState(notificationsState);
  const [hasUnread, setHasUnread] = useRecoilState(notificationHasUnRead);

  const markAllAsRead = () => {
    setHasUnread(false);
    const newNotifications = notifications.map((n) => {
      return { ...n, isRead: true };
    })

    updateNotifications(newNotifications);
  }

  const getNotificationById = (id: number) => {
    return notifications.find(n => n.id === id);
  };

  const updateHasUnRead = (notifications: NotificationItem[]) => {
    const hasUnRead = notifications.some(n => n.isRead === false);
    setHasUnread(hasUnRead);
  }

  const markAsRead = (notification: NotificationItem) => {
    const newNotifications = notifications.map(n => {
      if (n.id === notification.id) {
        return { ...n, isRead: true };
      }
      return n;
    });
    updateNotifications(newNotifications);
  };

  const postLocalNotification = (notification: LocalNotification) => {
    postNotifications([
      {
        id: Date.now(),
        content: notification.content,
        isRead: false,
        type: notification.type,
        createdAt: Date.now(),
      },
    ]);

    // eslint-disable-next-line no-new
    new Notification(notification.content);
  };

  const postRemoteNotifications = (remoteNotifications: RemoteNotification[]) => {
    const newNotifications: NotificationItem[] = remoteNotifications.map(n => ({
      id: n.id,
      content: n.content,
      isRead: false,
      type: 'remote',
      createdAt: Date.now(),
    }));
    newNotifications.forEach((n) => {
      // eslint-disable-next-line no-new
      new Notification(n.content);
    })
    updateNotifications([...notifications, ...newNotifications]);
  };

  const postNotifications = (aNotifications: NotificationItem[]) => {
    const newNotifications = [...notifications, ...aNotifications];
    updateNotifications(newNotifications);
  };

  const updateNotifications = (lst: NotificationItem[]) => {
    setNotifications(lst);
    setNotificationsInSettings(lst);
    updateHasUnRead(lst);
  };

  const loadRemoteNotifications = async (providerURL: string) => {
    const remoteNotifications = await fetchRemoteNotifications(providerURL);

    return remoteNotifications.filter(noti => {
      if (isRemoteNotificationExpired(noti)) {
        return false;
      }

      const notification = getNotificationById(noti.id);
      if (notification) {
        return false;
      }

      return true;
    });

  };

    const fetchNotifications = async (providerURL: string) => {
      const notifications = await loadRemoteNotifications(providerURL);
      postRemoteNotifications(notifications);
    }

  return {
    notifications,
    loadRemoteNotifications,
    postNotifications,
    postRemoteNotifications,
    getNotificationById,
    markAsRead,
    markAllAsRead,
    postLocalNotification,
    fetchNotifications,
    hasUnread
  };
};
