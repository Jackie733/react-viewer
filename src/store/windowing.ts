import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export const DEFAULT_WINDOW_WIDTH = 400;
export const DEFAULT_WINDOW_LEVEL = 40;

interface WindowingConfig {
  level: number;
  width: number;
  min: number;
  max: number;
}
interface WindowingState {
  config: WindowingConfig | null;
}

interface WindowingActions {
  setConfig: (patch: Partial<WindowingConfig>) => void;
}

const defaultConfig: WindowingConfig = {
  level: DEFAULT_WINDOW_LEVEL,
  width: DEFAULT_WINDOW_WIDTH,
  min: 0,
  max: 1000,
};

export const useWindowingStore = create<WindowingState & WindowingActions>()(
  immer((set) => ({
    config: null,

    setConfig: (patch) =>
      set((state) => {
        if (state.config) {
          state.config = { ...state.config, ...patch };
        } else {
          state.config = { ...defaultConfig, ...patch };
        }
      }),
  })),
);
