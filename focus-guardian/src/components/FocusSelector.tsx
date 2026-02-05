import React from 'react';
import { useFocusStore } from '../store/focus-store';

const FocusSelector: React.FC = () => {
  const { startFocus } = useFocusStore();

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

  return (
    <div className="space-y-3">
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
