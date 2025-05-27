import { useEffect, useState, useRef, useCallback } from 'react';
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
import { ViewContext } from '@/types/views';
import { Maybe } from '@/types';

export function useVtkView<T extends 'slice' | 'volume'>(
  container: Maybe<HTMLElement>,
  type: T,
): ViewContext<T> | null {
  const [viewContext, setViewContext] = useState<ViewContext<T> | null>(null);
  const isInitializingRef = useRef(false);

  const createRequestRender = useCallback(
    (renderWindow: vtkRenderWindow, interactor: vtkRenderWindowInteractor) => {
      return () => {
        if (interactor.isAnimating()) return;
        renderWindow.render();
      };
    },
    [],
  );

  const setRenderWindowSize = useCallback(
    (container: HTMLElement, renderWindowView: vtkOpenGLRenderWindow) => {
      const rect = container.getBoundingClientRect();
      const scaledWidth = Math.max(1, rect.width * globalThis.devicePixelRatio);
      const scaledHeight = Math.max(
        1,
        rect.height * globalThis.devicePixelRatio,
      );
      renderWindowView.setSize(scaledWidth, scaledHeight);
    },
    [],
  );

  const cleanup = useCallback((context: ViewContext<T>) => {
    try {
      const {
        interactor,
        renderWindow,
        renderWindowView,
        renderer,
        interactorStyle,
        widgetManager,
        actor,
        mapper,
      } = context;

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
    } catch (error) {
      console.warn('Failed to cleanup VTK objects:', error);
    }
  }, []);

  useEffect(() => {
    if (!container) {
      if (viewContext) {
        cleanup(viewContext);
        setViewContext(null);
      }
      return;
    }

    if (isInitializingRef.current) return;

    if (viewContext) {
      const { renderWindowView, interactor, requestRender } = viewContext;
      const currentContainer = renderWindowView?.getContainer();

      if (currentContainer === container) {
        return;
      }

      try {
        renderWindowView.setContainer(container);
        interactor.setContainer(container);

        setRenderWindowSize(container, renderWindowView);
        requestRender();

        return;
      } catch (error) {
        console.warn('Failed to reuse ViewContext, creating new one:', error);
        cleanup(viewContext);
        setViewContext(null);
      }
    }

    isInitializingRef.current = true;

    try {
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

      let actor: vtkImageSlice | vtkVolume;
      let mapper: vtkImageMapper | vtkVolumeMapper;

      if (type === 'slice') {
        mapper = vtkImageMapper.newInstance();
        actor = vtkImageSlice.newInstance();
      } else {
        mapper = vtkVolumeMapper.newInstance();
        actor = vtkVolume.newInstance();
      }

      const requestRender = createRequestRender(renderWindow, interactor);

      setRenderWindowSize(container, renderWindowView);
      requestRender();

      const newContext: ViewContext<T> = {
        renderer,
        renderWindow,
        renderWindowView,
        interactor,
        interactorStyle,
        widgetManager,
        actor: actor as T extends 'slice' ? vtkImageSlice : vtkVolume,
        mapper: mapper as T extends 'slice' ? vtkImageMapper : vtkVolumeMapper,
        requestRender,
      };

      setViewContext(newContext);
    } catch (error) {
      console.error('Failed to create VTK ViewContext:', error);
    } finally {
      isInitializingRef.current = false;
    }

    return () => {
      if (viewContext) {
        cleanup(viewContext);
        setViewContext(null);
      }
      isInitializingRef.current = false;
    };
  }, [container, type, cleanup, createRequestRender, setRenderWindowSize]);

  return viewContext;
}
