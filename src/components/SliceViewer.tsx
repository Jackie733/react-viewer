import { useEffect, useRef, useState, useCallback } from 'react';
import vtkRenderer from '@kitware/vtk.js/Rendering/Core/Renderer';
import vtkRenderWindow from '@kitware/vtk.js/Rendering/Core/RenderWindow';
import vtkOpenGLRenderWindow from '@kitware/vtk.js/Rendering/OpenGL/RenderWindow';
import vtkWidgetManager from '@kitware/vtk.js/Widgets/Core/WidgetManager';
import vtkImageMapper from '@kitware/vtk.js/Rendering/Core/ImageMapper';
import vtkImageSlice from '@kitware/vtk.js/Rendering/Core/ImageSlice';
import vtkInteractorStyleImage from '@kitware/vtk.js/Interaction/Style/InteractorStyleImage';
import vtkRenderWindowInteractor from '@kitware/vtk.js/Rendering/Core/RenderWindowInteractor';
import vtkCamera from '@kitware/vtk.js/Rendering/Core/Camera';
import { LPSAxisDir } from '@/types/lps';
import { useImageStore } from '@/store/image';
import { useDicomStore } from '@/store/dicom';
import ViewerInfoPanel from '@/components/ViewerInfoPanel';
import SliceSlider from '@/components/SliceSlider';
import { useSliceControl } from '@/hooks/useSliceControl';

interface SliceViewerProps {
  id: string;
  type: string;
  viewDirection: LPSAxisDir;
  viewUp: LPSAxisDir;
}

interface SliceViewerContext {
  renderer: vtkRenderer;
  renderWindow: vtkRenderWindow;
  renderWindowView: vtkOpenGLRenderWindow;
  widgetManager: vtkWidgetManager;
  interactor: vtkRenderWindowInteractor;
  interactorStyle: vtkInteractorStyleImage;
  camera: vtkCamera;
  actor: vtkImageSlice;
  mapper: vtkImageMapper;
}

// 配置相机方向
function configureCameraForLPS(
  renderer: vtkRenderer,
  viewDirection: LPSAxisDir,
  viewUp: LPSAxisDir,
): void {
  const camera = renderer.getActiveCamera();
  let position = [0, 0, 0];
  let up = [0, 0, 0];

  // 设置相机位置基于视图方向
  switch (viewDirection) {
    case 'Left':
      position = [-1, 0, 0];
      break;
    case 'Right':
      position = [1, 0, 0];
      break;
    case 'Anterior':
      position = [0, -1, 0];
      break;
    case 'Posterior':
      position = [0, 1, 0];
      break;
    case 'Superior':
      position = [0, 0, 1];
      break;
    case 'Inferior':
      position = [0, 0, -1];
      break;
  }

  // 设置相机上方向基于viewUp参数
  switch (viewUp) {
    case 'Left':
      up = [-1, 0, 0];
      break;
    case 'Right':
      up = [1, 0, 0];
      break;
    case 'Anterior':
      up = [0, -1, 0];
      break;
    case 'Posterior':
      up = [0, 1, 0];
      break;
    case 'Superior':
      up = [0, 0, 1];
      break;
    case 'Inferior':
      up = [0, 0, -1];
      break;
  }

  // 设置相机
  camera.setPosition(position[0], position[1], position[2]);
  camera.setViewUp(up[0], up[1], up[2]);
  camera.setFocalPoint(0, 0, 0);
}

const SliceViewer: React.FC<SliceViewerProps> = ({
  id,
  viewDirection,
  viewUp,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const context = useRef<SliceViewerContext | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  // 添加标记表示context是否已初始化
  const [contextReady, setContextReady] = useState(false);

  // 获取图像数据和窗宽窗位设置
  const imageData = useImageStore((state) => state.currentImage);
  const metadata = useImageStore((state) => state.metadata);
  const windowLevel = useDicomStore((state) => state.windowLevel) || 40;
  const windowWidth = useDicomStore((state) => state.windowWidth) || 400;

  // 创建一个稳定的渲染回调函数引用
  const renderCallback = useCallback(() => {
    if (context.current?.renderWindow) {
      context.current.renderWindow.render();
    }
  }, []);

  const { sliceIndex, maxSlice, updateSlice } = useSliceControl(
    viewDirection,
    contextReady ? context.current?.mapper : null,
    renderCallback,
  );

  // 鼠标事件处理
  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 初始化渲染器
  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;

      try {
        // 创建渲染器
        const renderer = vtkRenderer.newInstance();
        renderer.setBackground(0, 0, 0);

        // 创建渲染窗口
        const renderWindow = vtkRenderWindow.newInstance();
        renderWindow.addRenderer(renderer);

        // 创建OpenGL渲染窗口视图
        const renderWindowView = vtkOpenGLRenderWindow.newInstance();
        renderWindowView.setContainer(container);
        renderWindow.addView(renderWindowView);

        // 设置初始渲染窗口大小
        const { width, height } = container.getBoundingClientRect();
        const scaledWidth = Math.max(1, width * globalThis.devicePixelRatio);
        const scaledHeight = Math.max(1, height * globalThis.devicePixelRatio);
        renderWindowView.setSize(scaledWidth, scaledHeight);

        const interactor = vtkRenderWindowInteractor.newInstance();
        renderWindow.setInteractor(interactor);
        interactor.setView(renderWindowView);

        // 创建图像交互样式
        const interactorStyle = vtkInteractorStyleImage.newInstance();
        interactor.setInteractorStyle(interactorStyle);

        // 在设置所有属性后再初始化交互器
        interactor.initialize();
        interactor.setContainer(container);

        // 创建部件管理器
        const widgetManager = vtkWidgetManager.newInstance();
        widgetManager.setRenderer(renderer);

        // 创建图像映射器和演员
        const actor = vtkImageSlice.newInstance();
        const mapper = vtkImageMapper.newInstance();

        // 配置相机
        configureCameraForLPS(renderer, viewDirection, viewUp);
        const camera = renderer.getActiveCamera();

        // 保存上下文
        context.current = {
          renderer,
          renderWindow,
          renderWindowView,
          widgetManager,
          interactor,
          interactorStyle,
          camera,
          actor,
          mapper,
        };

        // 标记context已初始化
        setContextReady(true);

        // 渲染一次确保视图正确初始化
        renderWindow.render();

        // 监听窗口大小变化
        const resizeObserver = new ResizeObserver(() => {
          if (container && renderWindowView) {
            const { width, height } = container.getBoundingClientRect();
            const scaledWidth = Math.max(
              1,
              Math.floor(width * window.devicePixelRatio),
            );
            const scaledHeight = Math.max(
              1,
              Math.floor(height * window.devicePixelRatio),
            );
            renderWindowView.setSize(scaledWidth, scaledHeight);
            renderWindow.render();
          }
        });
        resizeObserver.observe(container);

        // 设置交互事件监听
        const startDragging = () => setIsDragging(true);
        const endDragging = () => setIsDragging(false);

        container.addEventListener('mousedown', startDragging);
        container.addEventListener('mouseup', endDragging);
        container.addEventListener('mouseleave', endDragging);

        return () => {
          // 移除事件监听
          container.removeEventListener('mousedown', startDragging);
          container.removeEventListener('mouseup', endDragging);
          container.removeEventListener('mouseleave', endDragging);

          resizeObserver.disconnect();
          if (context.current) {
            const { renderer, renderWindow, renderWindowView, interactor } =
              context.current;

            // 移除演员和监听器
            if (renderer && context.current.actor) {
              renderer.removeActor(context.current.actor);
            }

            // 解绑事件处理器
            if (interactor) {
              interactor.setContainer(null);
            }

            // 清理渲染窗口
            renderWindow.removeRenderer(renderer);
            renderWindow.removeView(renderWindowView);

            // 释放资源
            interactor.delete();
            renderer.delete();
            renderWindow.delete();
            renderWindowView.delete();

            // 清空上下文引用
            context.current = null;
            setContextReady(false);
          }
        };
      } catch (error) {
        console.error('Initialize VTK.js renderer error:', error);
        return undefined;
      }
    }
    return undefined;
  }, [viewDirection, viewUp]);

  // 处理图像数据变化
  useEffect(() => {
    if (!imageData || !context.current || !metadata || !contextReady) return;

    try {
      const { renderer, renderWindow, actor, mapper } = context.current;

      // 配置图像映射器
      mapper.setInputData(imageData);

      // 配置演员
      actor.setMapper(mapper);

      // 设置窗宽窗位
      const mapperProperty = actor.getProperty();
      mapperProperty.setColorWindow(windowWidth);
      mapperProperty.setColorLevel(windowLevel);
      mapperProperty.setInterpolationTypeToLinear();

      // 添加到渲染器
      renderer.addActor(actor);
      renderer.resetCamera();
      renderWindow.render();
    } catch (error) {
      console.error('Set image data error:', error);
    }
  }, [imageData, metadata, windowLevel, windowWidth, contextReady]);

  // 处理窗宽窗位变化
  useEffect(() => {
    if (!context.current?.actor || !contextReady) return;

    try {
      const { actor, renderWindow } = context.current;
      const property = actor.getProperty();
      property.setColorWindow(windowWidth);
      property.setColorLevel(windowLevel);
      renderWindow.render();
    } catch (error) {
      console.error('Update window width and level error:', error);
    }
  }, [windowLevel, windowWidth, contextReady]);

  // 添加滚轮事件处理切片导航
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !imageData || !metadata) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      try {
        // 根据滚轮方向更新切片
        if (event.deltaY > 0) {
          updateSlice(sliceIndex - 1);
        } else {
          updateSlice(sliceIndex + 1);
        }
      } catch (error) {
        console.error('Handle wheel event error:', error);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [imageData, metadata, sliceIndex, updateSlice]);

  const getBorderColorClass = () => {
    if (isDragging) return 'border-blue-500';
    if (isHovered) return 'border-gray-400';
    return 'border-gray-700';
  };

  return (
    <div
      className={`flex h-full w-full flex-col border-2 ${getBorderColorClass()} rounded-lg transition-colors duration-150`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div className="relative flex flex-1 flex-row overflow-hidden rounded-lg">
        <div
          ref={containerRef}
          className="inset-0 z-0 h-full w-full overflow-hidden rounded-s-lg"
        >
          {imageData && metadata && (
            <ViewerInfoPanel
              id={id}
              viewDirection={viewDirection}
              windowLevel={windowLevel}
              windowWidth={windowWidth}
              sliceIndex={sliceIndex}
              metadata={metadata}
              isDragging={isDragging}
            />
          )}
        </div>

        <SliceSlider
          sliceIndex={sliceIndex}
          maxSlice={maxSlice}
          onSliceChange={updateSlice}
        />
      </div>
    </div>
  );
};

export default SliceViewer;
