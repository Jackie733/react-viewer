import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { LPSAxisDir } from '@/types/lps';
import { ImageMetadata } from '@/types/image';
import { ViewContext } from '@/types/views';
import { getLPSAxisFromDir } from '@/utils/lps';
import { SlicingMode } from '@kitware/vtk.js/Rendering/Core/ImageMapper/Constants';
import vtkMouseRangeManipulator from '@kitware/vtk.js/Interaction/Manipulators/MouseRangeManipulator';
import { useSlicingStore } from '@/store/slicing';
import { Maybe } from '@/types';
import vtkImageMapper from '@kitware/vtk.js/Rendering/Core/ImageMapper';

/**
 * 处理DICOM切片操作的自定义Hook
 *
 * 设计原则：
 * 1. VTK渲染和状态管理分离，优先保证VTK渲染的流畅性
 * 2. 使用本地状态进行即时反馈，全局状态用于组件间协调
 * 3. 使用去抖动和节流技术减少不必要的状态更新
 */
export function useSliceManipulator(
  viewId: string,
  viewDirection: LPSAxisDir,
  viewContext: Maybe<ViewContext>,
  metadata: Maybe<ImageMetadata>,
) {
  // React本地状态，用于组件内部渲染
  const [localSliceIndex, setLocalSliceIndex] = useState(0);
  const [localMaxSlice, setLocalMaxSlice] = useState(0);

  // 引用变量，避免频繁的状态更新
  const sliceRef = useRef(0);
  const sliceModeRef = useRef(0);
  const isInitializedRef = useRef(false);
  const rangeManipRef = useRef<any>(null);
  const timeoutRef = useRef<number | null>(null);

  // Store操作
  const initializeView = useSlicingStore((state) => state.initializeView);
  const setSliceValue = useSlicingStore((state) => state.setSliceValue);

  // 从store读取状态，用于同步
  const storeSlice = useSlicingStore(
    (state) => state.slices[viewId]?.slice ?? 0,
  );
  const storeMax = useSlicingStore((state) => state.slices[viewId]?.max ?? 0);
  const storeMin = useSlicingStore((state) => state.slices[viewId]?.min ?? 0);

  // 直接更新VTK视图的函数
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

    // 4. 更新本地状态
    setLocalSliceIndex(initialSlice);
    setLocalMaxSlice(maxSliceValue);

    // 5. 保存到ref
    sliceRef.current = initialSlice;
    sliceModeRef.current = mode;
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
        interactorStyle.removeMouseManipulator(rangeManipRef.current);
        rangeManipRef.current = null;
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
