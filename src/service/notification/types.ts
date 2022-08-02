export type NotificationType = 'remote' | 'customerService'

export interface NotificationItem {
  id: number;
  content: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: number;
}

export interface LocalNotification {
  content: string;
  type: NotificationType;
}

export interface RemoteNotification {
  id: number;
  content: string;
  created_at: number;
  expire_at: number;
}
