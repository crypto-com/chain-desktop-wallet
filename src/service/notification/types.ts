export interface NotificationItem {
  id: number;
  content: string;
  isRead: boolean;
  icon: string;
  createdAt: number;
}

export interface LocalNotification {
  content: string;
  icon: string; // https://ant.design/components/icon/
}

export interface RemoteNotification {
  id: number;
  content: string;
  created_at: number;
  expire_at: number;
}
