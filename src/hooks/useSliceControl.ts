import { useState, useEffect } from 'react';
import { useImageStore } from '@/store/image';
import { LPSAxisDir } from '@/types/lps';
import { SlicingMode } from '@kitware/vtk.js/Rendering/Core/ImageMapper/Constants';
import { getLPSAxisFromDir } from '@/utils/lps';
import vtkImageMapper from '@kitware/vtk.js/Rendering/Core/ImageMapper';

interface SliceControlState {
  sliceIndex: number;
  maxSlice: number;
  sliceMode: number;
  updateSlice: (newIndex: number) => void;
  incrementSlice: () => void;
  decrementSlice: () => void;
}

/**
 * 切片控制Hook，用于管理切片索引和相关操作
 * @param viewDirection 视图方向
 * @param mapper VTK图像映射器实例
 * @param renderCallback 渲染回调函数
 * @returns 切片控制状态和方法
 */
export function useSliceControl(
  viewDirection: LPSAxisDir,
  mapper?: vtkImageMapper | null,
  renderCallback?: () => void,
): SliceControlState {
  const metadata = useImageStore((state) => state.metadata);

  const [sliceIndex, setSliceIndex] = useState(0);
  const [maxSlice, setMaxSlice] = useState(0);
  const [sliceMode, setSliceMode] = useState(0);

  useEffect(() => {
    if (!metadata) return;

    const viewAxis = getLPSAxisFromDir(viewDirection);
    const ijkIndex = metadata.lpsOrientation[viewAxis];
    const mode = [SlicingMode.I, SlicingMode.J, SlicingMode.K][ijkIndex];

    setSliceMode(mode);
    setMaxSlice(metadata.dimensions[mode] - 1);

    const initialSlice = Math.floor(metadata.dimensions[mode] / 2);
    setSliceIndex(initialSlice);

    if (mapper) {
      mapper.setSlicingMode(mode);
      mapper.setSlice(initialSlice);
      if (renderCallback) renderCallback();
    }
  }, [metadata, viewDirection, mapper, renderCallback]);

  useEffect(() => {
    if (!mapper) return;
    mapper.setSlice(sliceIndex);
    if (renderCallback) renderCallback();
  }, [sliceIndex, mapper, renderCallback]);

  const updateSlice = (newIndex: number) => {
    const boundedIndex = Math.max(0, Math.min(newIndex, maxSlice));
    if (boundedIndex !== sliceIndex) {
      setSliceIndex(boundedIndex);
    }
  };

  const incrementSlice = () => {
    updateSlice(sliceIndex + 1);
  };

  const decrementSlice = () => {
    updateSlice(sliceIndex - 1);
  };

  return {
    sliceIndex,
    maxSlice,
    sliceMode,
    updateSlice,
    incrementSlice,
    decrementSlice,
  };
}
