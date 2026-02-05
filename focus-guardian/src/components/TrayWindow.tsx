import React, { useEffect } from 'react';
import { useFocusStore } from '../store/focus-store';
import FocusTimer from './FocusTimer';
import FocusSelector from './FocusSelector';

const TrayWindow: React.FC = () => {
  const { status, loadStatus } = useFocusStore();

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  return (
    <div className="w-80 bg-white rounded-lg shadow-xl p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Focus Guardian
      </h2>
      {status.isActive ? (
        <FocusTimer />
      ) : (
        <FocusSelector />
      )}
    </div>
  );
};

export default TrayWindow;