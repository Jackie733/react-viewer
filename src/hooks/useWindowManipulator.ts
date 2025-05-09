import { useEffect, useRef } from 'react';
import vtkMouseRangeManipulator from '@kitware/vtk.js/Interaction/Manipulators/MouseRangeManipulator';
import { ViewContext } from '@/types/views';
import { useWindowingStore } from '@/store/windowing';
import { Maybe } from '@/types';
import { useDicomStore } from '@/store/dicom';

const DEFAULT_WINDOW_WIDTH = 400;
const DEFAULT_WINDOW_LEVEL = 40;
const WINDOW_SENSITIVITY_SCALE = 1;

export function useWindowManipulator(
  viewId: string,
  viewContext: Maybe<ViewContext>,
) {
  const manipulatorRef = useRef<any>(null);
  const setWindowConfig = useWindowingStore((state) => state.setConfig);
  const viewConfig = useWindowingStore((state) => state.config[viewId]);
  const level = useDicomStore((state) => state.windowLevel);
  const width = useDicomStore((state) => state.windowWidth);
  const builtImage = useDicomStore((state) => state.builtImage);

  useEffect(() => {
    if (!viewContext || !viewContext.interactorStyle || !builtImage) return;

    const range = builtImage.getPointData().getScalars().getRange();

    const { interactorStyle } = viewContext;

    if (!useWindowingStore.getState().config[viewId]) {
      setWindowConfig(viewId, {
        width: width ?? DEFAULT_WINDOW_WIDTH,
        level: level ?? DEFAULT_WINDOW_LEVEL,
        min: range[0],
        max: range[1],
      });
    }

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
        useWindowingStore.getState().config[viewId]?.level ??
        DEFAULT_WINDOW_LEVEL,
      (newLevel: number) => {
        setWindowConfig(viewId, {
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
        useWindowingStore.getState().config[viewId]?.width ??
        DEFAULT_WINDOW_WIDTH,
      (newWidth: number) => {
        setWindowConfig(viewId, {
          width: Math.round(newWidth),
        });
      },
      WINDOW_SENSITIVITY_SCALE,
    );

    interactorStyle.addMouseManipulator(manipulatorRef.current);

    return () => {
      if (manipulatorRef.current && interactorStyle) {
        interactorStyle.removeMouseManipulator(manipulatorRef.current);
        manipulatorRef.current.delete();
        manipulatorRef.current = null;
      }
    };
  }, [viewContext, viewId, setWindowConfig, level, width, builtImage]);

  useEffect(() => {
    if (!viewContext) return;
    if (viewConfig) {
      const { actor, requestRender } = viewContext;
      const property = actor.getProperty();
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
