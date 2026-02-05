import React, { useEffect } from 'react';
import { useNotificationStore } from '../store/notification-store';
import NotificationCard from './NotificationCard';

const QueueWindow: React.FC = () => {
  const { notifications, loadNotifications, markAsRead, clearAll } = useNotificationStore();

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const urgentNotifications = notifications.filter(n => n.isUrgent);
  const normalNotifications = notifications.filter(n => !n.isUrgent);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">通知队列</h1>
          <button
            onClick={clearAll}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            清空队列
          </button>
        </div>

        {urgentNotifications.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-red-600 mb-3">紧急通知</h2>
            <div className="space-y-3">
              {urgentNotifications.map(notif => (
                <NotificationCard
                  key={notif.id}
                  notification={notif}
                  onMarkRead={markAsRead}
                  onClick={() => {}}
                />
              ))}
            </div>
          </div>
        )}

        {normalNotifications.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">普通通知</h2>
            <div className="space-y-3">
              {normalNotifications.map(notif => (
                <NotificationCard
                  key={notif.id}
                  notification={notif}
                  onMarkRead={markAsRead}
                  onClick={() => {}}
                />
              ))}
            </div>
          </div>
        )}

        {notifications.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            暂无通知
          </div>
        )}
      </div>
    </div>
  );
};

export default QueueWindow;
