import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface ViewSlice {
  slice: number;
  min: number;
  max: number;
}

interface SlicingState {
  slices: Record<string, ViewSlice>;
}

interface SlicingActions {
  updateSlice: (viewId: string, patch: Partial<ViewSlice>) => void;
  resetSlice: (viewId: string) => void;
}

export const useSlicingStore = create<SlicingState & SlicingActions>()(
  immer((set) => ({
    slices: {},

    updateSlice: (viewId, patch) =>
      set((state) => {
        state.slices[viewId] = {
          ...state.slices[viewId],
          ...patch,
        };
      }),

    resetSlice: (viewId) =>
      set((state) => {
        state.slices[viewId] = { slice: 0, min: 0, max: 0 };
      }),
  })),
);

export const useSlicing = (viewId: string) => {
  const viewSlice = useSlicingStore((state) => state.slices[viewId]);

  return viewSlice;
};
