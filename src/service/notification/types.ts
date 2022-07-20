export interface Notification {
  id: string;
  content: string;
  isRead: boolean;
  icon: string;
  createdAt: number;
}

export interface LocalNotification {
  content: string;
  hasRead: boolean;
  icon: string; // https://ant.design/components/icon/
  createdAt: number;
}

export interface RemoteNotification {
  id: number;
  content: string;
  created_at: number;
  expire_at: number;
}
