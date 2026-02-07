import React, { useEffect, useState } from 'react';
import { useFocusStore } from '../store/focus-store';
import WorkContextDialog from './WorkContextDialog';
import { FocusSession } from '../types/electron';

const TrayWindow: React.FC = () => {
  const { status, loadStatus, startFocus, stopFocus } = useFocusStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showContextDialog, setShowContextDialog] = useState(false);
  const [screenshotPath, setScreenshotPath] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<FocusSession[]>([]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleStart = async (minutes: number) => {
    try {
      await startFocus(minutes * 60);
      setShowMenu(false);
    } catch (error) {
      console.error('Failed to start focus:', error);
    }
  };

  const handleStop = async () => {
    try {
      // Get current session ID from status
      if (status.sessionId) {
        setCurrentSessionId(status.sessionId);
      }

      // Capture screenshot
      const screenshot = await window.electronAPI.captureScreenshot();
      setScreenshotPath(screenshot);

      // Show context dialog
      setShowContextDialog(true);
      setShowMenu(false);
    } catch (error) {
      console.error('Failed to prepare stop focus:', error);
    }
  };

  const handleSaveContext = async (workContext: string) => {
    try {
      // Save work context if we have a session ID
      if (currentSessionId) {
        await window.electronAPI.saveWorkContext(
          currentSessionId,
          screenshotPath,
          workContext
        );
      }

      // Actually stop the focus session
      await stopFocus();

      // Close dialog and reset state
      setShowContextDialog(false);
      setScreenshotPath(null);
      setCurrentSessionId(null);
    } catch (error) {
      console.error('Failed to save context and stop focus:', error);
    }
  };

  const handleShowHistory = async () => {
    try {
      const sessions = await window.electronAPI.getHistory();
      setHistory(sessions);
      setShowHistory(true);
      setShowMenu(false);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const handleBackToMenu = () => {
    setShowHistory(false);
    setShowMenu(true);
  };

  return (
    <>
      <div
        className="relative"
        style={{ width: '280px', height: '200px', WebkitAppRegion: 'drag' } as any}
        onMouseEnter={() => setShowMenu(true)}
        onMouseLeave={() => setShowMenu(false)}
      >
      {/* Draggable circular button */}
      <div
        className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg cursor-pointer flex items-center justify-center hover:shadow-xl transition-all hover:scale-105"
        style={{ WebkitAppRegion: 'no-drag' } as any}
      >
        <div className="text-white text-center pointer-events-none">
          {status.isActive ? (
            <div className="text-xs font-bold">
              {Math.floor(status.remainingTime / 60)}:{String(status.remainingTime % 60).padStart(2, '0')}
            </div>
          ) : (
            <div className="text-2xl">🎯</div>
          )}
        </div>
      </div>

      {/* Hover menu */}
      {showMenu && !showHistory && (
        <div
          className="absolute left-20 top-0 bg-white rounded-lg shadow-xl py-2 min-w-[160px] z-50"
          style={{ WebkitAppRegion: 'no-drag' } as any}
          onMouseEnter={() => setShowMenu(true)}
          onMouseLeave={() => setShowMenu(false)}
        >
          {status.isActive ? (
            <>
              <div className="px-4 py-2 text-sm text-gray-700 border-b">
                专注中 {Math.floor(status.remainingTime / 60)} 分钟
              </div>
              <button
                onClick={handleStop}
                className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 transition-colors"
              >
                ⏹ 停止专注
              </button>
            </>
          ) : (
            <>
              <div className="px-4 py-2 text-xs text-gray-500 border-b">
                开始专注
              </div>
              <button
                onClick={() => handleStart(25)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 text-gray-800 transition-colors"
              >
                ⏱ 25 分钟
              </button>
              <button
                onClick={() => handleStart(50)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 text-gray-800 transition-colors"
              >
                ⏱ 50 分钟
              </button>
              <div className="border-t my-1"></div>
              <button
                onClick={handleShowHistory}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-gray-700 transition-colors"
              >
                📋 历史记录
              </button>
            </>
          )}
        </div>
      )}

      {/* History view */}
      {showHistory && (
        <div
          className="absolute left-20 top-0 bg-white rounded-lg shadow-xl py-2 w-[220px] max-h-[180px] overflow-y-auto z-50"
          style={{ WebkitAppRegion: 'no-drag' } as any}
        >
          <div className="flex items-center justify-between px-3 py-1 border-b">
            <span className="text-xs font-bold text-gray-700">历史记录</span>
            <button
              onClick={handleBackToMenu}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              返回
            </button>
          </div>

          {history.length === 0 ? (
            <div className="px-3 py-4 text-xs text-gray-500 text-center">
              暂无历史记录
            </div>
          ) : (
            <div className="py-1">
              {history.map((session) => {
                const date = new Date(session.start_time * 1000);
                const duration = Math.floor(session.planned_duration / 60);
                return (
                  <div
                    key={session.id}
                    className="px-3 py-2 hover:bg-gray-50 border-b last:border-b-0"
                  >
                    <div className="text-xs text-gray-600">
                      {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-xs text-gray-800 mt-0.5">
                      ⏱ {duration} 分钟
                    </div>
                    {session.work_context && (
                      <div className="text-xs text-gray-600 mt-0.5 truncate">
                        {session.work_context}
                      </div>
                    )}
                    {session.screenshot_path && (
                      <button
                        onClick={() => window.electronAPI.openPath(session.screenshot_path!)}
                        className="text-xs text-blue-600 hover:text-blue-800 mt-0.5"
                      >
                        📸 查看截图
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>

    <WorkContextDialog
      isOpen={showContextDialog}
      screenshotPath={screenshotPath}
      onSave={handleSaveContext}
    />
  </>
);
};

export default TrayWindow;