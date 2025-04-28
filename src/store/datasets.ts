import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { DataSelection } from '@/utils/dataSelection';

interface DatasetStore {
  primarySelection: DataSelection | null;
  setPrimarySelection: (selection: DataSelection | null) => void;
  remove: (id: string) => void;
}

export const useDatasetStore = create(
  immer<DatasetStore>((set) => ({
    primarySelection: null,

    setPrimarySelection: (selection) => {
      set({ primarySelection: selection });
    },

    remove: (id) =>
      set((state) => {
        if (id === state.primarySelection) {
          state.primarySelection = null;
        }
      }),
  })),
);
