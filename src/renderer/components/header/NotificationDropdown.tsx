import { Bell, Package, AlertCircle, DollarSign, CheckCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dropdown, DropdownDivider, DropdownHeader } from '../ui/Dropdown';
import { useNotificationViewModel } from '../../viewmodels/NotificationViewModel';
import type { Notification, NotificationType } from '../../../shared/types/notification.types';

const notificationIcons: Record<NotificationType, typeof Bell> = {
  new_order: Bell,
  overdue_order: AlertCircle,
  low_stock: Package,
  pending_payment: DollarSign,
  order_completed: CheckCircle,
  system: Bell,
};

const notificationColors: Record<NotificationType, string> = {
  new_order: 'text-theme-primary',
  overdue_order: 'text-error-600 bg-error-100',
  low_stock: 'text-warning-600 bg-warning-100',
  pending_payment: 'text-secondary-600 bg-secondary-100',
  order_completed: 'text-success-600 bg-success-100',
  system: 'text-neutral-600 bg-neutral-100',
};

function NotificationItem({ notification, onRead }: { notification: Notification; onRead: (id: string) => void }) {
  const navigate = useNavigate();
  const Icon = notificationIcons[notification.type];

  const handleClick = () => {
    onRead(notification.id);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    
    if (diff < 60) return 'الآن';
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
    if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
    return `منذ ${Math.floor(diff / 86400)} يوم`;
  };

  return (
    <button
      onClick={handleClick}
      className={`
        w-full px-3 sm:px-4 py-2.5 sm:py-3 text-right flex items-start gap-2 sm:gap-3
        hover:bg-neutral-50 transition-colors
        ${!notification.read ? '' : ''}
      `}
      style={!notification.read ? { backgroundColor: 'var(--color-primary)', opacity: 0.05 } : undefined}
    >
      <div 
        className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${notificationColors[notification.type]}`}
        style={notification.type === 'new_order' ? { backgroundColor: 'var(--color-primary)', opacity: 0.1 } : undefined}
      >
        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </div>
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-start justify-between gap-1 sm:gap-2 mb-0.5 sm:mb-1">
          <p className="text-xs sm:text-sm font-medium text-neutral-900 truncate">
            {notification.title}
          </p>
          {!notification.read && (
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: 'var(--color-primary)' }}></span>
          )}
        </div>
        <p className="text-[10px] sm:text-xs text-neutral-600 line-clamp-2 break-words">
          {notification.message}
        </p>
        <p className="text-[10px] sm:text-xs text-neutral-500 mt-0.5 sm:mt-1">
          {formatTime(notification.timestamp)}
        </p>
      </div>
    </button>
  );
}

export function NotificationDropdown() {
  const { notifications, summary, markAsRead, markAllAsRead, clearAll } = useNotificationViewModel();

  return (
    <Dropdown
      align="left"
      className="w-[360px]"
      trigger={
        <button 
          className="relative p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all hover:scale-105"
          aria-label="الإشعارات"
        >
          <Bell className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          {summary.unread > 0 && (
            <>
              <span className="absolute top-1 left-1 w-2 h-2 bg-error-500 rounded-full animate-pulse"></span>
              <span className="absolute -top-1 -left-1 min-w-[18px] h-[18px] bg-gradient-to-br from-error-500 to-error-600 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 shadow-lg shadow-error-500/50">
                {summary.unread > 9 ? '9+' : summary.unread}
              </span>
            </>
          )}
        </button>
      }
    >
      <div className="max-h-[min(70vh,500px)] w-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-3 sm:px-4 py-3 border-b border-neutral-200 flex items-center justify-between gap-2 flex-shrink-0 min-w-0">
          <h3 className="font-semibold text-neutral-900 text-sm sm:text-base truncate flex-1 min-w-0">
            الإشعارات
            {summary.unread > 0 && (
              <span className="mr-1 sm:mr-2 text-xs sm:text-sm text-theme-primary">
                ({summary.unread})
              </span>
            )}
          </h3>
          {notifications.length > 0 && (
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {summary.unread > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] sm:text-xs text-theme-primary hover:underline whitespace-nowrap"
                >
                  تعليم الكل
                </button>
              )}
              <button
                onClick={clearAll}
                className="p-1 hover:bg-neutral-100 rounded flex-shrink-0"
                aria-label="مسح الكل"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-500" />
              </button>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto flex-1 min-h-0">
          {notifications.length === 0 ? (
            <div className="py-8 sm:py-12 text-center px-4">
              <Bell className="w-10 h-10 sm:w-12 sm:h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-2 sm:mb-3" />
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                لا توجد إشعارات
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={markAsRead}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Dropdown>
  );
}