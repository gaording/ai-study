const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script is running!');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Focus session methods
  startFocus: (duration: number) => ipcRenderer.invoke('focus:start', duration),
  stopFocus: () => ipcRenderer.invoke('focus:stop'),
  getFocusStatus: () => ipcRenderer.invoke('focus:status'),
  onFocusUpdate: (callback: (status: any) => void) => {
    ipcRenderer.on('focus:update', (_event: any, status: any) => callback(status));
  },
  captureScreenshot: () => ipcRenderer.invoke('focus:captureScreenshot'),
  saveWorkContext: (sessionId: number, screenshotPath: string | null, workContext: string) =>
    ipcRenderer.invoke('focus:saveWorkContext', sessionId, screenshotPath, workContext),
  getLastSession: () => ipcRenderer.invoke('focus:getLastSession'),
  getHistory: () => ipcRenderer.invoke('focus:getHistory'),

  // Notification methods
  getNotifications: () => ipcRenderer.invoke('notifications:get'),
  markAsRead: (id: string) => ipcRenderer.invoke('notifications:markRead', id),
  clearNotifications: () => ipcRenderer.invoke('notifications:clear'),

  // Settings methods
  getWhitelist: () => ipcRenderer.invoke('settings:getWhitelist'),
  addToWhitelist: (type: string, value: string) => ipcRenderer.invoke('settings:addWhitelist', type, value),
  removeFromWhitelist: (id: number) => ipcRenderer.invoke('settings:removeWhitelist', id),
  getKeywords: () => ipcRenderer.invoke('settings:getKeywords'),
  addKeyword: (keyword: string) => ipcRenderer.invoke('settings:addKeyword', keyword),
  removeKeyword: (id: number) => ipcRenderer.invoke('settings:removeKeyword', id),
  saveFocusModeName: (name: string) => ipcRenderer.invoke('settings:saveFocusModeName', name),
  getFocusModeName: () => ipcRenderer.invoke('settings:getFocusModeName'),

  // Shell methods
  openPath: (path: string) => ipcRenderer.invoke('shell:openPath', path),
});

console.log('electronAPI exposed successfully!');
console.log('Available methods:', Object.keys((window as any).electronAPI || {}));
