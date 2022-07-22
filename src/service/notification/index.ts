import { atom, useRecoilState } from 'recoil';
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

export const useNotification = () => {
  const [notifications, setNotifications] = useRecoilState(notificationsState);

  const getNotificationById = (id: number) => {
    return notifications.find(n => n.id === id);
  };

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
  };

  const postRemoteNotifications = (remoteNotifications: RemoteNotification[]) => {
    const newNotifications: NotificationItem[] = remoteNotifications.map(n => ({
      id: n.id,
      content: n.content,
      isRead: false,
      type: 'remote',
      createdAt: Date.now(),
    }));
    updateNotifications([...notifications, ...newNotifications]);
  };

  const postNotifications = (aNotifications: NotificationItem[]) => {
    const newNotifications = [...notifications, ...aNotifications];
    updateNotifications(newNotifications);
  };

  const updateNotifications = (lst: NotificationItem[]) => {
    setNotifications(lst);
    setNotificationsInSettings(lst);
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
    postLocalNotification,
    fetchNotifications
  };
};
