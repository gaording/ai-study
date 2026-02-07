import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class DNDController {
  private focusModeName: string = '工作';

  setFocusModeName(name: string): void {
    this.focusModeName = name;
    console.log('Focus mode name set to:', name);
  }

  async enableDND(): Promise<void> {
    console.log(`Attempting to enable Focus mode: ${this.focusModeName}`);

    try {
      // Method 1: Try using shortcuts command (macOS 12+)
      const shortcutScript = `
        tell application "System Events"
          tell process "ControlCenter"
            -- Try to activate the focus mode
            -- This is a simplified approach
            keystroke "${this.focusModeName}"
          end tell
        end tell
      `;

      await execAsync(`osascript -e '${shortcutScript}'`);
      console.log('Focus mode enabled successfully');
    } catch (error) {
      console.error('Failed to enable Focus mode:', error);
      console.log('Please manually enable Focus mode:', this.focusModeName);
      console.log('You can do this from Control Center in the menu bar');
    }
  }

  async disableDND(): Promise<void> {
    // Temporarily disabled automatic DND control
    console.log('Automatic DND control is disabled. Please manually disable DND if needed.');
  }
}