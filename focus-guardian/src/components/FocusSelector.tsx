import React, { useEffect, useState } from 'react';
import { useFocusStore } from '../store/focus-store';

interface LastSession {
  id: number;
  startTime: number;
  endTime?: number;
  plannedDuration: number;
  status: string;
  screenshotPath?: string;
  workContext?: string;
}

const FocusSelector: React.FC = () => {
  const { startFocus } = useFocusStore();
  const [lastSession, setLastSession] = useState<LastSession | null>(null);

  useEffect(() => {
    const loadLastSession = async () => {
      try {
        const session = await window.electronAPI.getLastSession();
        if (session && (session.workContext || session.screenshotPath)) {
          setLastSession(session);
        }
      } catch (error) {
        console.error('Failed to load last session:', error);
      }
    };

    loadLastSession();
  }, []);

  const handleStart = async (minutes: number) => {
    console.log('Button clicked! Minutes:', minutes);
    console.log('window.electronAPI:', window.electronAPI);
    try {
      console.log('Calling startFocus...');
      await startFocus(minutes * 60);
      console.log('Focus started successfully!');
    } catch (error) {
      console.error('Failed to start focus:', error);
    }
  };

  const handleViewScreenshot = () => {
    if (lastSession?.screenshotPath) {
      window.electronAPI?.openPath?.(lastSession.screenshotPath);
    }
  };

  return (
    <div className="space-y-3">
      {lastSession && (lastSession.workContext || lastSession.screenshotPath) && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start justify-between mb-2">
            <p className="text-xs text-blue-600 font-medium">上次工作内容</p>
            {lastSession.screenshotPath && (
              <button
                onClick={handleViewScreenshot}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                📸 查看截图
              </button>
            )}
          </div>
          <p className="text-sm text-gray-700">
            {lastSession.workContext || '（未记录工作内容）'}
          </p>
        </div>
      )}

      <p className="text-sm text-gray-600">选择专注时长</p>
      <button
        onClick={() => handleStart(25)}
        className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        25 分钟
      </button>
      <button
        onClick={() => handleStart(50)}
        className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        50 分钟
      </button>
    </div>
  );
};

export default FocusSelector;
