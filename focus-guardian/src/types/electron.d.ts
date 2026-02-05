export interface FocusStatus {
  isActive: boolean;
  remainingTime: number;
  plannedDuration: number;
  sessionId?: number;
}

export interface Notification {
  id: string;
  appName: string;
  title: string;
  body: string;
  sender: string;
  timestamp: number;
  isRead: boolean;
  isUrgent: boolean;
  urgencyReason?: string;
}

export interface WhitelistItem {
  id: number;
  type: 'contact' | 'app';
  value: string;
}

export interface Keyword {
  id: number;
  keyword: string;
}

export interface ElectronAPI {
  startFocus: (duration: number) => Promise<void>;
  stopFocus: () => Promise<void>;
  getFocusStatus: () => Promise<FocusStatus>;
  onFocusUpdate: (callback: (status: FocusStatus) => void) => void;

  getNotifications: () => Promise<Notification[]>;
  markAsRead: (id: string) => Promise<void>;
  clearNotifications: () => Promise<void>;

  getWhitelist: () => Promise<WhitelistItem[]>;
  addToWhitelist: (type: string, value: string) => Promise<void>;
  removeFromWhitelist: (id: number) => Promise<void>;
  getKeywords: () => Promise<Keyword[]>;
  addKeyword: (keyword: string) => Promise<void>;
  removeKeyword: (id: number) => Promise<void>;
  saveFocusModeName: (name: string) => Promise<void>;
  getFocusModeName: () => Promise<string>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
