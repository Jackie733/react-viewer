import { create } from 'zustand';
import { RTROI } from '@/io/dicomRTParser';

interface ROIVisibilityState {
  // 使用 roiNumber 作为键，存储可见性状态
  visibleRois: Map<number, boolean>;
  // 设置指定ROI的可见性
  setRoiVisibility: (roiNumber: number, isVisible: boolean) => void;
  // 切换ROI的可见性
  toggleRoiVisibility: (roiNumber: number) => void;
  // 获取ROI的可见性
  isRoiVisible: (roiNumber: number) => boolean;
  // 清空所有可见性状态
  clearAllVisibility: () => void;
  // 设置所有ROI的可见性
  setAllRoiVisibility: (rois: RTROI[], isVisible: boolean) => void;
}

export const useRoiStore = create<ROIVisibilityState>((set, get) => ({
  visibleRois: new Map<number, boolean>(),

  setRoiVisibility: (roiNumber: number, isVisible: boolean) => {
    set((state) => {
      const newMap = new Map(state.visibleRois);
      newMap.set(roiNumber, isVisible);
      return { visibleRois: newMap };
    });
  },

  toggleRoiVisibility: (roiNumber: number) => {
    set((state) => {
      const newMap = new Map(state.visibleRois);
      const currentValue = newMap.get(roiNumber) ?? false;
      newMap.set(roiNumber, !currentValue);
      return { visibleRois: newMap };
    });
  },

  isRoiVisible: (roiNumber: number) => {
    return get().visibleRois.get(roiNumber) ?? false;
  },

  clearAllVisibility: () => {
    set({ visibleRois: new Map<number, boolean>() });
  },

  setAllRoiVisibility: (rois: RTROI[], isVisible: boolean) => {
    set((state) => {
      const newMap = new Map(state.visibleRois);
      for (const roi of rois) {
        newMap.set(roi.roiNumber, isVisible);
      }
      return { visibleRois: newMap };
    });
  },
}));
