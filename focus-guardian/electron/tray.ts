import { Tray, Menu, BrowserWindow, app, nativeImage } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class TrayManager {
  private tray: Tray | null = null;
  private trayWindow: BrowserWindow | null = null;

  constructor() {
    this.createTray();
  }

  private createTray(): void {
    const iconPath = path.join(__dirname, '../resources/tray-icon.png');
    const icon = nativeImage.createFromPath(iconPath);
    this.tray = new Tray(icon.resize({ width: 16, height: 16 }));
    this.tray.setToolTip('Focus Guardian');

    this.tray.on('click', () => {
      this.toggleWindow();
    });

    this.createMenu();
  }

  private createMenu(): void {
    const menu = Menu.buildFromTemplate([
      { label: '开始专注', click: () => this.toggleWindow() },
      { label: '查看通知队列', click: () => this.showQueueWindow() },
      { type: 'separator' },
      { label: '设置', click: () => this.showSettings() },
      { label: '退出', click: () => app.quit() }
    ]);
    this.tray?.setContextMenu(menu);
  }

  private toggleWindow(): void {
    if (this.trayWindow && !this.trayWindow.isDestroyed()) {
      if (this.trayWindow.isVisible()) {
        this.trayWindow.hide();
      } else {
        this.showTrayWindow();
      }
    } else {
      this.createTrayWindow();
      this.showTrayWindow();
    }
  }

  private createTrayWindow(): void {
    this.trayWindow = new BrowserWindow({
      width: 320,
      height: 400,
      show: false,
      frame: false,
      resizable: false,
      transparent: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
      },
    });

    if (process.env.VITE_DEV_SERVER_URL) {
      this.trayWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}#/tray`);
    } else {
      this.trayWindow.loadFile(path.join(__dirname, '../dist/index.html'), { hash: '/tray' });
    }
  }

  private showTrayWindow(): void {
    if (!this.trayWindow || !this.tray) return;

    const bounds = this.tray.getBounds();
    const x = Math.round(bounds.x + bounds.width / 2 - 160);
    const y = Math.round(bounds.y + bounds.height);

    this.trayWindow.setPosition(x, y);
    this.trayWindow.show();
  }

  updateIcon(isFocusing: boolean): void {
    if (!this.tray) return;
    const iconName = isFocusing ? 'tray-icon-focus.png' : 'tray-icon.png';
    const iconPath = path.join(__dirname, '../resources', iconName);
    const icon = nativeImage.createFromPath(iconPath);
    this.tray.setImage(icon.resize({ width: 16, height: 16 }));
  }

  private showQueueWindow(): void {
    // TODO: Implement queue window
    console.log('Show queue window');
  }

  private showSettings(): void {
    // TODO: Implement settings window
    console.log('Show settings');
  }
}