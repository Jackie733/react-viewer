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
        try {
          // 检查interactorStyle是否仍然有效
          const interactorStyle =
            viewContext.interactorStyle as vtkInteractorStyleManipulator;
          if (typeof interactorStyle.removeMouseManipulator === 'function') {
            interactorStyle.removeMouseManipulator(zoomManipulator);
          }
        } catch (error) {
          // 静默处理错误，因为interactorStyle可能已经被删除
          console.warn('清理缩放操作器时出错（可能是由于组件卸载）:', error);
        }
      }
    };
  }, [viewContext]);
}
