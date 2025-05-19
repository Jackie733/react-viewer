import { useEffect, useState } from 'react';
import { Maybe } from '@/types';
import { ViewContext } from '@/types/views';
import vtkImageMapper from '@kitware/vtk.js/Rendering/Core/ImageMapper';
import vtkImageSlice from '@kitware/vtk.js/Rendering/Core/ImageSlice';
import vtkRenderer from '@kitware/vtk.js/Rendering/Core/Renderer';
import vtkRenderWindow from '@kitware/vtk.js/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from '@kitware/vtk.js/Rendering/Core/RenderWindowInteractor';
import vtkOpenGLRenderWindow from '@kitware/vtk.js/Rendering/OpenGL/RenderWindow';
import vtkWidgetManager from '@kitware/vtk.js/Widgets/Core/WidgetManager';
import vtkInteractorStyleManipulator from '@kitware/vtk.js/Interaction/Style/InteractorStyleManipulator';
import vtkVolume from '@kitware/vtk.js/Rendering/Core/Volume';
import vtkVolumeMapper from '@kitware/vtk.js/Rendering/Core/VolumeMapper';

export function useVtkView<T extends 'slice' | 'volume'>(
  container: Maybe<HTMLElement>,
  type: T,
): Maybe<ViewContext<T>> {
  const [viewContext, setViewContext] = useState<Maybe<ViewContext<T>>>(null);

  useEffect(() => {
    if (!container) return;

    const renderer = vtkRenderer.newInstance();
    const renderWindow = vtkRenderWindow.newInstance();
    renderWindow.addRenderer(renderer);

    const renderWindowView = vtkOpenGLRenderWindow.newInstance();
    renderWindowView.setContainer(container);
    renderWindow.addView(renderWindowView);

    const interactor = vtkRenderWindowInteractor.newInstance();
    renderWindow.setInteractor(interactor);
    interactor.setView(renderWindowView);
    interactor.initialize();
    interactor.setContainer(container);

    const interactorStyle = vtkInteractorStyleManipulator.newInstance();
    interactor.setInteractorStyle(interactorStyle);

    const widgetManager = vtkWidgetManager.newInstance();
    widgetManager.setRenderer(renderer);

    let actor: T extends 'slice' ? vtkImageSlice : vtkVolume;
    let mapper: T extends 'slice' ? vtkImageMapper : vtkVolumeMapper;

    if (type === 'slice') {
      mapper = vtkImageMapper.newInstance() as T extends 'slice'
        ? vtkImageMapper
        : vtkVolumeMapper;
      actor = vtkImageSlice.newInstance() as T extends 'slice'
        ? vtkImageSlice
        : vtkVolume;
    } else {
      mapper = vtkVolumeMapper.newInstance() as T extends 'slice'
        ? vtkImageMapper
        : vtkVolumeMapper;
      actor = vtkVolume.newInstance() as T extends 'slice'
        ? vtkImageSlice
        : vtkVolume;
    }

    const requestRender = () => {
      if (interactor.isAnimating()) return;
      renderWindow.render();
    };

    const { width, height } = container.getBoundingClientRect();
    const scaledWidth = Math.max(1, width * globalThis.devicePixelRatio);
    const scaledHeight = Math.max(1, height * globalThis.devicePixelRatio);
    renderWindowView.setSize(scaledWidth, scaledHeight);
    requestRender();

    const newContext: ViewContext<T> = {
      renderer,
      renderWindow,
      renderWindowView,
      interactor,
      interactorStyle,
      widgetManager,
      actor,
      mapper,
      requestRender,
    };

    setViewContext(newContext);

    return () => {
      interactor.setContainer(null);
      renderWindow.removeRenderer(renderer);
      renderWindow.removeView(renderWindowView);
      renderer.delete();
      renderWindow.delete();
      renderWindowView.delete();
      interactor.delete();
      interactorStyle.delete();
      widgetManager.delete();
      actor.delete();
      mapper.delete();
      setViewContext(null);
    };
  }, [container, type]);

  return viewContext;
}
