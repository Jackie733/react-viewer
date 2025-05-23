import { useEffect } from 'react';
import vtkInteractorStyleManipulator from '@kitware/vtk.js/Interaction/Style/InteractorStyleManipulator';
import vtkMouseCameraTrackballZoomManipulator from '@kitware/vtk.js/Interaction/Manipulators/MouseCameraTrackballZoomManipulator';
import { Maybe } from '@/types';
import { ViewContext } from '@/types/views';

export function useImageZoom(viewContext: Maybe<ViewContext<'slice'>>) {
  useEffect(() => {
    if (!viewContext || !viewContext.interactorStyle) {
      return;
    }

    const interactorStyle =
      viewContext.interactorStyle as vtkInteractorStyleManipulator;

    const zoomManipulator =
      vtkMouseCameraTrackballZoomManipulator.newInstance();
    zoomManipulator.setButton(3);

    interactorStyle.addMouseManipulator(zoomManipulator);

    return () => {
      if (viewContext.interactorStyle) {
        (
          viewContext.interactorStyle as vtkInteractorStyleManipulator
        ).removeMouseManipulator(zoomManipulator);
      }
    };
  }, [viewContext]);
}
