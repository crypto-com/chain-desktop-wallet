import { useState } from 'react';
import { getLocalSetting, setLocalSetting, SettingsKey } from '../../utils/localStorage';

export const getNotifications = () => {
  return getLocalSetting<Notification[]>(SettingsKey.Notification);
};

export const setNotifications = (notifications: Notification[]) => {
  setLocalSetting(SettingsKey.Notification, notifications);
};

export const useNotification = () => {
  const notifications = useState<Notification[]>([]);

  return {
    notifications,
  };
};
