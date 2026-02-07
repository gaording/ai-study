import React, { useState } from 'react';

interface WorkContextDialogProps {
  isOpen: boolean;
  screenshotPath: string | null;
  onSave: (workContext: string) => void;
}

const WorkContextDialog: React.FC<WorkContextDialogProps> = ({
  isOpen,
  screenshotPath,
  onSave,
}) => {
  const [workContext, setWorkContext] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(workContext);
    setWorkContext('');
  };

  const handleSkip = () => {
    onSave('');
    setWorkContext('');
  };

  const openScreenshot = () => {
    if (screenshotPath) {
      window.electronAPI?.openPath?.(screenshotPath);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      style={{ WebkitAppRegion: 'no-drag' } as any}
    >
      <div className="bg-white rounded-lg p-3 w-[260px] mx-2 max-h-[180px] overflow-y-auto">
        <h2 className="text-sm font-bold mb-2">保存工作上下文</h2>

        <div className="mb-2">
          {screenshotPath && (
            <div className="mb-2">
              <button
                onClick={openScreenshot}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                📸 查看截图
              </button>
            </div>
          )}

          <textarea
            value={workContext}
            onChange={(e) => setWorkContext(e.target.value)}
            placeholder="输入工作内容（可选）"
            className="w-full h-16 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSkip}
            className="flex-1 py-1.5 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            跳过
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkContextDialog;
