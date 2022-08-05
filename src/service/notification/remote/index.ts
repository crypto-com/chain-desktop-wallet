import axios from 'axios';
import { RemoteNotification } from '../types';

export const fetchRemoteNotifications = async (providerURL: string) => {
  const response = await axios.get<RemoteNotification[]>(providerURL);
  const notifications = response.data;
  return notifications.sort((a, b) => a.id - b.id);
};

export const isRemoteNotificationExpired = (
  notification: RemoteNotification,
  comparedDate = new Date(),
) => {
  const targetTimeStamp = Math.floor(comparedDate.getTime() / 1000);

  return notification.expire_at < targetTimeStamp;
};
