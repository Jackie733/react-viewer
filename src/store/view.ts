import { Layouts } from '@/config';
import { Layout } from '@/types/layout';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface ViewState {
  layout: Layout;
  setLayout: (name: string) => void;
}

const DEFAULT_LAYOUT_NAME = 'Axial Only';

export const useViewStore = create<ViewState>()(
  immer((set) => ({
    layout: Layouts[DEFAULT_LAYOUT_NAME],

    setLayout: (name: string) => set({ layout: Layouts[name] }),
  })),
);
