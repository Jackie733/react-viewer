import { Layouts } from '@/config';
import { Layout } from '@/types/layout';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface ViewState {
  controlsExpanded: boolean;
  layout: Layout;
  toggleControlsExpanded: () => void;
  setLayout: (name: string) => void;
}

const DEFAULT_LAYOUT_NAME = 'Axial Only';

export const useViewStore = create<ViewState>()(
  immer((set) => ({
    controlsExpanded: true,
    layout: Layouts[DEFAULT_LAYOUT_NAME],

    toggleControlsExpanded: () =>
      set((state) => ({ controlsExpanded: !state.controlsExpanded })),
    setLayout: (name: string) => set({ layout: Layouts[name] }),
  })),
);
