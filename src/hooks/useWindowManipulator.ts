import { useEffect, useRef } from 'react';
import vtkMouseRangeManipulator from '@kitware/vtk.js/Interaction/Manipulators/MouseRangeManipulator';
import { ViewContext } from '@/types/views';
import { useWindowingStore } from '@/store/windowing';
import { Maybe } from '@/types';
import { useDicomStore } from '@/store/dicom';
import vtkImageProperty from '@kitware/vtk.js/Rendering/Core/ImageProperty';
import { DEFAULT_WINDOW_LEVEL, DEFAULT_WINDOW_WIDTH } from '@/store/windowing';

const WINDOW_SENSITIVITY_SCALE = 1;

export function useWindowManipulator(
  viewId: string,
  viewContext: Maybe<ViewContext<'slice'>>,
  disabled: boolean = false,
) {
  const manipulatorRef = useRef<any>(null);
  const setWindowConfig = useWindowingStore((state) => state.setConfig);
  const viewConfig = useWindowingStore((state) => state.config);
  const level = useDicomStore((state) => state.windowLevel);
  const width = useDicomStore((state) => state.windowWidth);
  const builtImage = useDicomStore((state) => state.builtImage);

  useEffect(() => {
    if (!viewContext || !viewContext.interactorStyle || !builtImage) return;

    const range = builtImage.getPointData().getScalars().getRange();

    const { interactorStyle } = viewContext;

    if (!useWindowingStore.getState().config) {
      setWindowConfig({
        width: width ?? DEFAULT_WINDOW_WIDTH,
        level: level ?? DEFAULT_WINDOW_LEVEL,
        min: range[0],
        max: range[1],
      });
    }

    if (disabled) {
      if (manipulatorRef.current) {
        interactorStyle.removeMouseManipulator(manipulatorRef.current);
        manipulatorRef.current.delete();
        manipulatorRef.current = null;
      }
      return;
    }

    if (!manipulatorRef.current) {
      manipulatorRef.current = vtkMouseRangeManipulator.newInstance({
        button: 1,
        dragEnabled: true,
        scrollEnabled: false,
      });

      manipulatorRef.current.setHorizontalListener(
        range[0],
        range[1],
        1,
        () =>
          useWindowingStore.getState().config?.level ?? DEFAULT_WINDOW_LEVEL,
        (newLevel: number) => {
          setWindowConfig({
            level: Math.round(newLevel),
          });
        },
        WINDOW_SENSITIVITY_SCALE,
      );

      manipulatorRef.current.setVerticalListener(
        1e-12,
        range[1] - range[0],
        1,
        () =>
          useWindowingStore.getState().config?.width ?? DEFAULT_WINDOW_WIDTH,
        (newWidth: number) => {
          setWindowConfig({
            width: Math.round(newWidth),
          });
        },
        WINDOW_SENSITIVITY_SCALE,
      );

      interactorStyle.addMouseManipulator(manipulatorRef.current);
    }

    return () => {
      if (manipulatorRef.current && interactorStyle) {
        interactorStyle.removeMouseManipulator(manipulatorRef.current);
        manipulatorRef.current.delete();
        manipulatorRef.current = null;
      }
    };
  }, [
    viewContext,
    viewId,
    setWindowConfig,
    level,
    width,
    builtImage,
    disabled,
  ]);

  useEffect(() => {
    if (!viewContext) return;
    if (viewConfig) {
      const { actor, requestRender } = viewContext;
      const property = actor.getProperty() as vtkImageProperty;
      if (
        property.getColorWindow() !== viewConfig.width ||
        property.getColorLevel() !== viewConfig.level
      ) {
        property.setColorWindow(viewConfig.width);
        property.setColorLevel(viewConfig.level);
        requestRender();
      }
    }
  }, [viewContext, viewId, viewConfig]);
}
