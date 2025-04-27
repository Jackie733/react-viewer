import { create } from 'zustand';

interface LoadDataStore {
  isLoading: boolean;
  segmentGroupExtension: string;
  setIsLoading: (isLoading: boolean) => void;
  setSegmentGroupExtension: (segmentGroupExtension: string) => void;
}

export const useLoadDataStore = create<LoadDataStore>((set) => ({
  isLoading: false,
  segmentGroupExtension: '',

  setIsLoading: (isLoading: boolean) => set({ isLoading }),
  setSegmentGroupExtension: (segmentGroupExtension: string) =>
    set({ segmentGroupExtension }),
}));

export const loadDataStore = useLoadDataStore.getState();
