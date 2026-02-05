import { create } from 'zustand';
import { Notification } from '../types/electron';

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  loadNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications) => {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    set({ notifications, unreadCount });
  },

  loadNotifications: async () => {
    const notifications = await window.electronAPI.getNotifications();
    get().setNotifications(notifications);
  },

  markAsRead: async (id) => {
    await window.electronAPI.markAsRead(id);
    await get().loadNotifications();
  },

  clearAll: async () => {
    await window.electronAPI.clearNotifications();
    set({ notifications: [], unreadCount: 0 });
  },
}));
