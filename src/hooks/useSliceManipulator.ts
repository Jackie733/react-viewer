import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { SlicingMode } from '@kitware/vtk.js/Rendering/Core/ImageMapper/Constants';
import vtkMouseRangeManipulator from '@kitware/vtk.js/Interaction/Manipulators/MouseRangeManipulator';
import { useImageStore } from '@/store/image';
import { useSlicingStore } from '@/store/slicing';
import { getLPSAxisFromDir } from '@/utils/lps';
import { LPSAxisDir } from '@/types/lps';
import { ViewContext } from '@/types/views';
import { Maybe } from '@/types';

export function useSliceManipulator(
  viewId: string,
  viewDirection: LPSAxisDir,
  viewContext: Maybe<ViewContext<'slice'>>,
) {
  const [localSliceIndex, setLocalSliceIndex] = useState(0);
  const [localMaxSlice, setLocalMaxSlice] = useState(0);

  const isInitializedRef = useRef(false);
  const rangeManipRef = useRef<vtkMouseRangeManipulator | null>(null);
  const debounceTimeoutRef = useRef<number | null>(null);
  // 用于VTK回调中获取最新的切片值，避免闭包问题
  const localSliceRef = useRef(0);

  const metadata = useImageStore((state) => state.metadata);
  const initializeView = useSlicingStore((state) => state.initializeView);
  const setSliceValue = useSlicingStore((state) => state.setSliceValue);

  const storeSlice = useSlicingStore(
    (state) => state.slices[viewId]?.slice ?? 0,
  );
  const storeMax = useSlicingStore((state) => state.slices[viewId]?.max ?? 1);
  const storeMin = useSlicingStore((state) => state.slices[viewId]?.min ?? 0);

  // 同步本地状态和ref
  const updateLocalSlice = useCallback((newSlice: number) => {
    setLocalSliceIndex(newSlice);
    localSliceRef.current = newSlice;
  }, []);

  const updateVTKSlice = useCallback(
    (newSlice: number) => {
      if (!viewContext || !isInitializedRef.current) return false;
      const boundedValue = Math.max(storeMin, Math.min(newSlice, storeMax));
      if (boundedValue !== localSliceRef.current) {
        const { mapper, requestRender } = viewContext;
        mapper.setSlice(boundedValue);
        requestRender();
        updateLocalSlice(boundedValue);
        return true;
      }
      return false;
    },
    [viewContext, storeMin, storeMax, updateLocalSlice],
  );

  const debouncedUpdateStore = useCallback(
    (newSlice: number) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = window.setTimeout(() => {
        setSliceValue(viewId, newSlice);
        debounceTimeoutRef.current = null;
      }, 100);
    },
    [viewId, setSliceValue],
  );

  useEffect(() => {
    if (!viewContext || !metadata || isInitializedRef.current) return;

    const viewAxis = getLPSAxisFromDir(viewDirection);
    const ijkIndex = metadata.lpsOrientation?.[viewAxis];
    if (ijkIndex === undefined) return;

    const mode = [SlicingMode.I, SlicingMode.J, SlicingMode.K][ijkIndex];
    const maxSliceValue = (metadata.dimensions?.[mode] ?? 1) - 1;

    const { mapper } = viewContext;
    mapper.setSlicingMode(mode);

    const initialSlice = Math.floor(maxSliceValue / 2);
    mapper.setSlice(initialSlice);

    updateLocalSlice(initialSlice);
    setLocalMaxSlice(maxSliceValue);

    initializeView(viewId, mode, maxSliceValue);
    isInitializedRef.current = true;

    return () => {
      isInitializedRef.current = false;
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
    };
  }, [
    viewContext,
    metadata,
    viewDirection,
    viewId,
    initializeView,
    updateLocalSlice,
  ]);

  useEffect(() => {
    if (!viewContext || !isInitializedRef.current) return;

    const { interactorStyle } = viewContext;

    if (!rangeManipRef.current) {
      rangeManipRef.current = vtkMouseRangeManipulator.newInstance({
        button: 1,
        dragEnabled: false,
        scrollEnabled: true,
      });
      interactorStyle.addMouseManipulator(rangeManipRef.current);
    }

    const handleSliceChange = (newValue: number) => {
      const roundedValue = Math.round(newValue);

      updateVTKSlice(roundedValue);
      debouncedUpdateStore(roundedValue);

      return roundedValue;
    };

    rangeManipRef.current.setScrollListener(
      storeMin,
      storeMax,
      1,
      () => localSliceRef.current,
      handleSliceChange,
      -1,
    );

    return () => {
      if (rangeManipRef.current && interactorStyle) {
        try {
          if (typeof interactorStyle.removeMouseManipulator === 'function') {
            interactorStyle.removeMouseManipulator(rangeManipRef.current);
          }
        } catch (error) {
          console.warn('Failed to cleanup slice manipulator:', error);
        } finally {
          rangeManipRef.current = null;
        }
      }

      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
    };
  }, [viewContext, storeMin, storeMax, updateVTKSlice, debouncedUpdateStore]);

  useEffect(() => {
    if (!viewContext || !isInitializedRef.current) return;

    if (storeSlice !== localSliceRef.current) {
      updateVTKSlice(storeSlice);
    }
  }, [viewContext, storeSlice, updateVTKSlice]);

  return useMemo(
    () => ({
      sliceIndex: localSliceIndex,
      maxSlice: localMaxSlice,
      setSliceValue: (newSlice: number) => {
        updateVTKSlice(newSlice);
        setSliceValue(viewId, newSlice);
      },
    }),
    [localSliceIndex, localMaxSlice, viewId, setSliceValue, updateVTKSlice],
  );
}
