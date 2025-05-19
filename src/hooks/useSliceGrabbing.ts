import { useEffect } from 'react';
import { Maybe } from '@/types';
import { ViewContext } from '@/types/views';
import vtkInteractorStyleManipulator from '@kitware/vtk.js/Interaction/Style/InteractorStyleManipulator';
import vtkMouseCameraTrackballPanManipulator from '@kitware/vtk.js/Interaction/Manipulators/MouseCameraTrackballPanManipulator';

export function useSliceGrabbing(viewContext: Maybe<ViewContext>) {
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
