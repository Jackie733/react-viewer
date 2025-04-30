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

export function useVtkView(container: Maybe<HTMLElement>): Maybe<ViewContext> {
  const [viewContext, setViewContext] = useState<Maybe<ViewContext>>(null);

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

    const widgetManager = vtkWidgetManager.newInstance();
    widgetManager.setRenderer(renderer);

    const actor = vtkImageSlice.newInstance();
    const mapper = vtkImageMapper.newInstance();

    const requestRender = () => {
      if (interactor.isAnimating()) return;
      renderWindow.render();
    };

    const { width, height } = container.getBoundingClientRect();
    const scaledWidth = Math.max(1, width * globalThis.devicePixelRatio);
    const scaledHeight = Math.max(1, height * globalThis.devicePixelRatio);
    renderWindowView.setSize(scaledWidth, scaledHeight);
    requestRender();

    const newContext: ViewContext = {
      renderer,
      renderWindow,
      renderWindowView,
      interactor,
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
      widgetManager.delete();
      actor.delete();
      mapper.delete();
      setViewContext(null);
    };
  }, [container]);

  return viewContext;
}
