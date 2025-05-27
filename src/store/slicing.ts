import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface ViewSlice {
  slice: number;
  min: number;
  max: number;
  sliceMode: number;
}

interface SlicingState {
  slices: Record<string, ViewSlice>;
}

interface SlicingActions {
  updateSlice: (viewId: string, patch: Partial<ViewSlice>) => void;
  setSliceValue: (viewId: string, slice: number) => void;
  incrementSlice: (viewId: string) => void;
  decrementSlice: (viewId: string) => void;
  resetSlice: (viewId: string) => void;
  initializeView: (viewId: string, sliceMode: number, maxSlice: number) => void;
}

export const useSlicingStore = create<SlicingState & SlicingActions>()(
  immer((set) => ({
    slices: {},

    updateSlice: (viewId, patch) =>
      set((state) => {
        if (!state.slices[viewId]) {
          state.slices[viewId] = { slice: 0, min: 0, max: 1, sliceMode: 0 };
        }
        state.slices[viewId] = {
          ...state.slices[viewId],
          ...patch,
        };
      }),

    setSliceValue: (viewId, slice) =>
      set((state) => {
        if (!state.slices[viewId]) return;

        const { min, max } = state.slices[viewId];
        const boundedSlice = Math.max(min, Math.min(max, slice));

        if (state.slices[viewId].slice !== boundedSlice) {
          state.slices[viewId].slice = boundedSlice;
        }
      }),

    incrementSlice: (viewId) =>
      set((state) => {
        if (!state.slices[viewId]) return;

        const { slice, max } = state.slices[viewId];
        if (slice < max) {
          state.slices[viewId].slice = slice + 1;
        }
      }),

    decrementSlice: (viewId) =>
      set((state) => {
        if (!state.slices[viewId]) return;

        const { slice, min } = state.slices[viewId];
        if (slice > min) {
          state.slices[viewId].slice = slice - 1;
        }
      }),

    resetSlice: (viewId) =>
      set((state) => {
        state.slices[viewId] = { slice: 0, min: 0, max: 0, sliceMode: 0 };
      }),

    initializeView: (viewId, sliceMode, maxSlice) =>
      set((state) => {
        const initialSlice = Math.floor(maxSlice / 2);
        state.slices[viewId] = {
          slice: initialSlice,
          min: 0,
          max: maxSlice,
          sliceMode,
        };
      }),
  })),
);

export const useSlicing = (viewId: string) => {
  const viewSlice = useSlicingStore(
    (state) =>
      state.slices[viewId] || { slice: 0, min: 0, max: 0, sliceMode: 0 },
  );

  const { setSliceValue, incrementSlice, decrementSlice } = useSlicingStore();

  return {
    ...viewSlice,
    setSliceValue: (slice: number) => setSliceValue(viewId, slice),
    incrementSlice: () => incrementSlice(viewId),
    decrementSlice: () => decrementSlice(viewId),
  };
};
