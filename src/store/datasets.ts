import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { DataSelection, isDicomImage } from '@/utils/dataSelection';
import { dicomStore, useDicomStore } from './dicom';
import { imageStore } from './image';
import { fileStore } from './file';

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
      if (!selection) return;
      if (isDicomImage(selection)) {
        useDicomStore.getState().buildVolume(selection);
      }
    },
    remove: (id) =>
      set((state) => {
        if (id === state.primarySelection) {
          state.primarySelection = null;
        }
        if (isDicomImage(id)) {
          dicomStore.deleteVolume(id);
        }
        imageStore.deleteData(id);

        fileStore.removeFiles(id);
      }),
  })),
);

export const datasetStore = useDatasetStore.getState();
