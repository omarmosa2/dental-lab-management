// Notification Types

export type NotificationType = 
  | 'new_order'
  | 'overdue_order'
  | 'low_stock'
  | 'pending_payment'
  | 'order_completed'
  | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
  metadata?: {
    orderId?: number;
    materialId?: number;
    dentistId?: number;
    amount?: number;
  };
}

export interface NotificationSummary {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
}