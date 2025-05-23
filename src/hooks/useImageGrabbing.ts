import { useEffect } from 'react';
import vtkInteractorStyleManipulator from '@kitware/vtk.js/Interaction/Style/InteractorStyleManipulator';
import vtkMouseCameraTrackballPanManipulator from '@kitware/vtk.js/Interaction/Manipulators/MouseCameraTrackballPanManipulator';
import { Maybe } from '@/types';
import { ViewContext } from '@/types/views';

export function useImageGrabbing(viewContext: Maybe<ViewContext<'slice'>>) {
  useEffect(() => {
    if (!viewContext || !viewContext.interactorStyle) {
      return;
    }

    const interactorStyle =
      viewContext.interactorStyle as vtkInteractorStyleManipulator;

    const panManipulator = vtkMouseCameraTrackballPanManipulator.newInstance();
    panManipulator.setButton(2);

    interactorStyle.addMouseManipulator(panManipulator);

    return () => {
      if (viewContext.interactorStyle) {
        (
          viewContext.interactorStyle as vtkInteractorStyleManipulator
        ).removeMouseManipulator(panManipulator);
      }
    };
  }, [viewContext]);
}
