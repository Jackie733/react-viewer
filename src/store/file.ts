import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { DataSourceWithFile } from '@/io/import/dataSource';

interface FileState {
  byDataID: Record<string, DataSourceWithFile[]>;
}

interface FileActions {
  addFiles(dataID: string, files: DataSourceWithFile[]): void;
  removeFiles(dataID: string): void;
}

export const useFileStore = create<FileState & FileActions>()(
  immer((set) => ({
    byDataID: {},

    addFiles: (dataID, files) =>
      set((state) => {
        state.byDataID[dataID] = files;
      }),
    removeFiles: (dataID) =>
      set((state) => {
        if (dataID in state.byDataID) {
          delete state.byDataID[dataID];
        }
      }),
  })),
);

export const fileStore = useFileStore.getState();

export const getDataSources = (dataID: string) => {
  return fileStore.byDataID[dataID] ?? [];
};
export const getFiles = (dataID: string) => {
  return (fileStore.byDataID[dataID] ?? []).map((ds) => ds.fileSrc.file);
};
