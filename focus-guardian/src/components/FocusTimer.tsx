import React, { useEffect, useState } from 'react';
import { useFocusStore } from '../store/focus-store';

const FocusTimer: React.FC = () => {
  const { status, stopFocus } = useFocusStore();
  const [timeDisplay, setTimeDisplay] = useState('00:00');

  useEffect(() => {
    const minutes = Math.floor(status.remainingTime / 60);
    const seconds = status.remainingTime % 60;
    setTimeDisplay(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
  }, [status.remainingTime]);

  const handleStop = async () => {
    try {
      await stopFocus();
    } catch (error) {
      console.error('Failed to stop focus:', error);
    }
  };

  return (
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
  );
};

export default FocusTimer;
