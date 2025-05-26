import { useEffect, useState, useRef } from 'react';
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
  const isInitializingRef = useRef(false);

  useEffect(() => {
    if (!container) {
      // 当容器为null时，不立即清理ViewContext，只是标记为未初始化
      return;
    }

    // 防止重复初始化
    if (isInitializingRef.current) return;

    // 如果已有ViewContext且容器只是发生了变化，尝试重新设置容器而非重建
    if (viewContext && container) {
      const { renderWindowView, interactor, requestRender } = viewContext;
      const currentContainer = renderWindowView?.getContainer();

      // 如果容器没有变化，不需要做任何操作
      if (currentContainer === container) {
        return;
      }

      try {
        // 尝试重新设置容器
        renderWindowView.setContainer(container);
        interactor.setContainer(container);

        // 重新计算大小
        const { width, height } = container.getBoundingClientRect();
        const scaledWidth = Math.max(1, width * globalThis.devicePixelRatio);
        const scaledHeight = Math.max(1, height * globalThis.devicePixelRatio);
        renderWindowView.setSize(scaledWidth, scaledHeight);
        requestRender();

        return; // 成功重用现有ViewContext
      } catch (error) {
        // 如果重用失败，继续创建新的ViewContext
        console.warn('重用ViewContext失败，将创建新的:', error);
      }
    }

    isInitializingRef.current = true;

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
    isInitializingRef.current = false;

    return () => {
      // 延迟清理，给其他hooks时间完成清理
      setTimeout(() => {
        try {
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
          console.warn('清理VTK对象时出错:', error);
        }
        setViewContext(null);
        isInitializingRef.current = false;
      }, 0);
    };
  }, [container, type]); // 移除viewContext依赖以避免无限循环

  return viewContext;
}
