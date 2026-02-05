import React from 'react';
import { Notification } from '../types/electron';

interface NotificationCardProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onClick: (id: string) => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({ notification, onMarkRead, onClick }) => {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const cardClass = `p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
    notification.isUrgent ? 'border-red-500 bg-red-50' : 'border-gray-200'
  } ${!notification.isRead ? 'font-semibold' : ''}`;

  return (
    <div className={cardClass} onClick={() => onClick(notification.id)}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm font-medium text-gray-900">{notification.appName}</span>
        <span className="text-xs text-gray-500">{formatTime(notification.timestamp)}</span>
      </div>
      <div className="mb-1">
        <p className="text-sm text-gray-800">{notification.title}</p>
      </div>
      <div className="mb-2">
        <p className="text-sm text-gray-600">{notification.body}</p>
      </div>
      {notification.isUrgent && notification.urgencyReason && (
        <div className="text-xs text-red-600 mb-2">
          🔴 {notification.urgencyReason}
        </div>
      )}
      {!notification.isRead && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMarkRead(notification.id);
          }}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          标记已读
        </button>
      )}
    </div>
  );
};

export default NotificationCard;
