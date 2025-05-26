import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { LPSAxisDir } from '@/types/lps';
import { ViewContext } from '@/types/views';
import { getLPSAxisFromDir } from '@/utils/lps';
import { SlicingMode } from '@kitware/vtk.js/Rendering/Core/ImageMapper/Constants';
import vtkMouseRangeManipulator from '@kitware/vtk.js/Interaction/Manipulators/MouseRangeManipulator';
import { useSlicingStore } from '@/store/slicing';
import { Maybe } from '@/types';
import vtkImageMapper from '@kitware/vtk.js/Rendering/Core/ImageMapper';
import { useImageStore } from '@/store/image';

export function useSliceManipulator(
  viewId: string,
  viewDirection: LPSAxisDir,
  viewContext: Maybe<ViewContext<'slice'>>,
) {
  const [localSliceIndex, setLocalSliceIndex] = useState(0);
  const [localMaxSlice, setLocalMaxSlice] = useState(0);

  const sliceRef = useRef(0);
  const isInitializedRef = useRef(false);
  const rangeManipRef = useRef<any>(null);
  const timeoutRef = useRef<number | null>(null);

  const metadata = useImageStore((state) => state.metadata);
  const initializeView = useSlicingStore((state) => state.initializeView);
  const setSliceValue = useSlicingStore((state) => state.setSliceValue);
  const storeSlice = useSlicingStore(
    (state) => state.slices[viewId]?.slice ?? 0,
  );
  const storeMax = useSlicingStore((state) => state.slices[viewId]?.max ?? 0);
  const storeMin = useSlicingStore((state) => state.slices[viewId]?.min ?? 0);

  const updateVTKSlice = useCallback(
    (newSlice: number) => {
      if (!viewContext || !isInitializedRef.current) return;

      const boundedValue = Math.max(storeMin, Math.min(newSlice, storeMax));

      // 只有当值真正变化时才更新
      if (boundedValue !== sliceRef.current) {
        const { mapper, requestRender } = viewContext;

        // 直接更新VTK视图
        (mapper as vtkImageMapper).setSlice(boundedValue);
        requestRender();

        // 更新本地状态
        sliceRef.current = boundedValue;
        setLocalSliceIndex(boundedValue);

        return true;
      }
      return false;
    },
    [viewContext, storeMin, storeMax],
  );

  // 初始化 - 只在组件挂载和必要的依赖变化时执行
  useEffect(() => {
    if (!viewContext || !metadata || isInitializedRef.current) return;

    // 1. 确定切片模式
    const viewAxis = getLPSAxisFromDir(viewDirection);
    const ijkIndex = metadata.lpsOrientation?.[viewAxis];
    if (ijkIndex === undefined) return;

    const mode = [SlicingMode.I, SlicingMode.J, SlicingMode.K][ijkIndex];
    const maxSliceValue = metadata.dimensions?.[mode] - 1 || 0;

    // 2. 设置切片模式
    const { mapper } = viewContext;
    (mapper as vtkImageMapper).setSlicingMode(mode);

    // 3. 初始化slice位置
    const initialSlice = Math.floor(maxSliceValue / 2);
    (mapper as vtkImageMapper).setSlice(initialSlice);

    setLocalSliceIndex(initialSlice);
    setLocalMaxSlice(maxSliceValue);

    sliceRef.current = initialSlice;
    isInitializedRef.current = true;

    // 6. 更新Store
    initializeView(viewId, mode, maxSliceValue);

    return () => {
      // 清理
      isInitializedRef.current = false;
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [viewContext, metadata, viewDirection, viewId, initializeView]);

  // 设置鼠标操作 - 滚轮控制切片
  useEffect(() => {
    if (!viewContext || !isInitializedRef.current) return;

    const { interactorStyle } = viewContext;

    // 1. 创建滚轮操作控制器
    if (!rangeManipRef.current) {
      rangeManipRef.current = vtkMouseRangeManipulator.newInstance({
        button: 1,
        dragEnabled: false,
        scrollEnabled: true,
      });
      interactorStyle.addMouseManipulator(rangeManipRef.current);
    }

    // 2. 定义滚轮回调函数
    const handleSliceChange = (newValue: number) => {
      const roundedValue = Math.round(newValue);

      // 直接更新VTK视图
      updateVTKSlice(roundedValue);

      // 使用去抖动更新全局状态
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        setSliceValue(viewId, roundedValue);
        timeoutRef.current = null;
      }, 100); // 100ms去抖动，平衡性能和响应性

      return roundedValue;
    };

    // 3. 设置滚轮监听
    rangeManipRef.current.setScrollListener(
      storeMin,
      storeMax,
      1, // 步长
      () => sliceRef.current, // 使用引用获取最新值
      handleSliceChange,
      -1, // 缩放因子
      false, // 不使用指数滚动，保持行为稳定
    );

    return () => {
      if (rangeManipRef.current && interactorStyle) {
        try {
          // 检查interactorStyle是否仍然有效
          if (typeof interactorStyle.removeMouseManipulator === 'function') {
            interactorStyle.removeMouseManipulator(rangeManipRef.current);
          }
        } catch (error) {
          // 静默处理错误，因为interactorStyle可能已经被删除
          console.warn('清理切片操作器时出错（可能是由于组件卸载）:', error);
        } finally {
          rangeManipRef.current = null;
        }
      }

      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [viewContext, storeMin, storeMax, viewId, setSliceValue, updateVTKSlice]);

  // 同步Store的slice值到VTK视图
  // 这主要用于外部控制（如滑块）引起的变化
  useEffect(() => {
    if (!viewContext || !isInitializedRef.current) return;

    // 只有当store值与本地值不同时才更新
    if (storeSlice !== sliceRef.current) {
      updateVTKSlice(storeSlice);
    }
  }, [viewContext, storeSlice, updateVTKSlice]);

  // 暴露给组件的API
  return useMemo(
    () => ({
      sliceIndex: localSliceIndex,
      maxSlice: localMaxSlice,
      setSliceValue: (newSlice: number) => {
        // 先直接更新VTK视图以获得即时响应
        updateVTKSlice(newSlice);

        // 然后更新store状态
        setSliceValue(viewId, newSlice);
      },
    }),
    [localSliceIndex, localMaxSlice, viewId, setSliceValue, updateVTKSlice],
  );
}
