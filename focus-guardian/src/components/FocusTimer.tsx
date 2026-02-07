import React, { useEffect, useState } from 'react';
import { useFocusStore } from '../store/focus-store';
import WorkContextDialog from './WorkContextDialog';

const FocusTimer: React.FC = () => {
  const { status, stopFocus } = useFocusStore();
  const [timeDisplay, setTimeDisplay] = useState('00:00');
  const [showDialog, setShowDialog] = useState(false);
  const [screenshotPath, setScreenshotPath] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);

  useEffect(() => {
    const minutes = Math.floor(status.remainingTime / 60);
    const seconds = status.remainingTime % 60;
    setTimeDisplay(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
  }, [status.remainingTime]);

  const handleStop = async () => {
    try {
      // Get current session ID
      const sessionId = status.sessionId;
      if (!sessionId) {
        await stopFocus();
        return;
      }

      setCurrentSessionId(sessionId);

      // Capture screenshot
      const screenshot = await window.electronAPI.captureScreenshot();
      setScreenshotPath(screenshot);

      // Show dialog
      setShowDialog(true);
    } catch (error) {
      console.error('Failed to stop focus:', error);
    }
  };

  const handleSaveContext = async (workContext: string) => {
    try {
      if (currentSessionId) {
        // Save work context
        await window.electronAPI.saveWorkContext(
          currentSessionId,
          screenshotPath,
          workContext
        );
      }

      // Stop focus
      await stopFocus();

      // Reset state
      setShowDialog(false);
      setScreenshotPath(null);
      setCurrentSessionId(null);
    } catch (error) {
      console.error('Failed to save context:', error);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-blue-600 mb-2">
            {timeDisplay}
          </div>
          <p className="text-sm text-gray-600">专注中...</p>
        </div>
        <button
          onClick={handleStop}
          className="w-full py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          停止专注
        </button>
      </div>

      <WorkContextDialog
        isOpen={showDialog}
        screenshotPath={screenshotPath}
        onSave={handleSaveContext}
      />
    </>
  );
};

export default FocusTimer;
