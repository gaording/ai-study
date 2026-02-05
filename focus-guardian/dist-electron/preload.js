const { contextBridge, ipcRenderer } = require("electron");
console.log("Preload script is running!");
contextBridge.exposeInMainWorld("electronAPI", {
  // Focus session methods
  startFocus: (duration) => ipcRenderer.invoke("focus:start", duration),
  stopFocus: () => ipcRenderer.invoke("focus:stop"),
  getFocusStatus: () => ipcRenderer.invoke("focus:status"),
  onFocusUpdate: (callback) => {
    ipcRenderer.on("focus:update", (_event, status) => callback(status));
  },
  // Notification methods
  getNotifications: () => ipcRenderer.invoke("notifications:get"),
  markAsRead: (id) => ipcRenderer.invoke("notifications:markRead", id),
  clearNotifications: () => ipcRenderer.invoke("notifications:clear"),
  // Settings methods
  getWhitelist: () => ipcRenderer.invoke("settings:getWhitelist"),
  addToWhitelist: (type, value) => ipcRenderer.invoke("settings:addWhitelist", type, value),
  removeFromWhitelist: (id) => ipcRenderer.invoke("settings:removeWhitelist", id),
  getKeywords: () => ipcRenderer.invoke("settings:getKeywords"),
  addKeyword: (keyword) => ipcRenderer.invoke("settings:addKeyword", keyword),
  removeKeyword: (id) => ipcRenderer.invoke("settings:removeKeyword", id),
  saveFocusModeName: (name) => ipcRenderer.invoke("settings:saveFocusModeName", name),
  getFocusModeName: () => ipcRenderer.invoke("settings:getFocusModeName")
});
console.log("electronAPI exposed successfully!");
console.log("Available methods:", Object.keys(window.electronAPI || {}));
