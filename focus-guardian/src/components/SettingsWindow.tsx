import React, { useState, useEffect } from 'react';

const SettingsWindow: React.FC = () => {
  const [whitelistType, setWhitelistType] = useState<'contact' | 'app'>('contact');
  const [whitelistValue, setWhitelistValue] = useState('');
  const [keyword, setKeyword] = useState('');
  const [focusModeName, setFocusModeName] = useState('工作');

  useEffect(() => {
    // Load saved focus mode name on mount
    window.electronAPI.getFocusModeName().then((name) => {
      setFocusModeName(name);
    });
  }, []);

  const handleSaveFocusMode = async () => {
    try {
      await window.electronAPI.saveFocusModeName(focusModeName);
      alert('专注模式名称已保存');
    } catch (error) {
      console.error('Failed to save focus mode name:', error);
      alert('保存失败');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">设置</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">专注模式配置</h2>
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              请输入你在系统设置中创建的专注模式名称
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={focusModeName}
                onChange={(e) => setFocusModeName(e.target.value)}
                placeholder="例如：工作、深度工作"
                className="flex-1 px-3 py-2 border rounded"
              />
              <button
                onClick={handleSaveFocusMode}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                保存
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              当前设置：{focusModeName || '未设置'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">白名单管理</h2>
          <div className="flex gap-2 mb-4">
            <select
              value={whitelistType}
              onChange={(e) => setWhitelistType(e.target.value as 'contact' | 'app')}
              className="px-3 py-2 border rounded"
            >
              <option value="contact">联系人</option>
              <option value="app">应用</option>
            </select>
            <input
              type="text"
              value={whitelistValue}
              onChange={(e) => setWhitelistValue(e.target.value)}
              placeholder="输入名称"
              className="flex-1 px-3 py-2 border rounded"
            />
            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              添加
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">紧急关键词</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="输入关键词"
              className="flex-1 px-3 py-2 border rounded"
            />
            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              添加
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsWindow;
