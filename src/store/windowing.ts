import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface WindowingConfig {
  level: number;
  width: number;
  min: number;
  max: number;
}
interface WindowingState {
  sync: boolean;
  config: Record<string, WindowingConfig>;
}

interface WindowingActions {
  setSync: (sync: boolean) => void;
  setConfig: (viewId: string, patch: Partial<WindowingConfig>) => void;
}

export const useWindowingStore = create<WindowingState & WindowingActions>()(
  immer((set) => ({
    sync: true,
    config: {},

    setSync: (s) => set((state) => (state.sync = s)),
    setConfig: (viewId, patch) =>
      set((state) => {
        if (state.sync) {
          for (const key in state.config) {
            state.config[key] = { ...state.config[key], ...patch };
          }
          state.config[viewId] = { ...state.config[viewId], ...patch };
        } else {
          state.config[viewId] = { ...state.config[viewId], ...patch };
        }
      }),
  })),
);
