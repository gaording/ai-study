import { create } from 'zustand';
import { FocusStatus } from '../types/electron';

interface FocusStore {
  status: FocusStatus;
  setStatus: (status: FocusStatus) => void;
  startFocus: (duration: number) => Promise<void>;
  stopFocus: () => Promise<void>;
  loadStatus: () => Promise<void>;
}

export const useFocusStore = create<FocusStore>((set) => ({
  status: {
    isActive: false,
    remainingTime: 0,
    plannedDuration: 0,
  },

  setStatus: (status) => set({ status }),

  startFocus: async (duration) => {
    await window.electronAPI.startFocus(duration);
    const status = await window.electronAPI.getFocusStatus();
    set({ status });
  },

  stopFocus: async () => {
    await window.electronAPI.stopFocus();
    const status = await window.electronAPI.getFocusStatus();
    set({ status });
  },

  loadStatus: async () => {
    const status = await window.electronAPI.getFocusStatus();
    set({ status });
  },
}));