import { useEffect, useRef, useState } from 'react';
import vtkRenderer from '@kitware/vtk.js/Rendering/Core/Renderer';
import vtkRenderWindow from '@kitware/vtk.js/Rendering/Core/RenderWindow';
import vtkOpenGLRenderWindow from '@kitware/vtk.js/Rendering/OpenGL/RenderWindow';
import vtkWidgetManager from '@kitware/vtk.js/Widgets/Core/WidgetManager';
import vtkImageMapper from '@kitware/vtk.js/Rendering/Core/ImageMapper';
import vtkImageSlice from '@kitware/vtk.js/Rendering/Core/ImageSlice';
import vtkInteractorStyleImage from '@kitware/vtk.js/Interaction/Style/InteractorStyleImage';
import vtkRenderWindowInteractor from '@kitware/vtk.js/Rendering/Core/RenderWindowInteractor';
import vtkCamera from '@kitware/vtk.js/Rendering/Core/Camera';
import { SlicingMode } from '@kitware/vtk.js/Rendering/Core/ImageMapper/Constants';
import { LPSAxisDir } from '@/types/lps';
import { useImageStore } from '@/store/image';
import { useDicomStore } from '@/store/dicom';
import { getLPSAxisFromDir } from '@/utils/lps';

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

const SliceViewer: React.FC<SliceViewerProps> = ({ viewDirection, viewUp }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const context = useRef<SliceViewerContext | null>(null);
  const [sliceIndex, setSliceIndex] = useState(0);

  // 获取图像数据和窗宽窗位设置
  const imageData = useImageStore((state) => state.currentImage);
  const metadata = useImageStore((state) => state.metadata);
  const windowLevel = useDicomStore((state) => state.windowLevel) || 40;
  const windowWidth = useDicomStore((state) => state.windowWidth) || 400;

  // 初始化渲染器
  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;

      try {
        // 创建渲染器
        const renderer = vtkRenderer.newInstance();
        renderer.setBackground(0.1, 0.1, 0.1);

        // 创建渲染窗口
        const renderWindow = vtkRenderWindow.newInstance();
        renderWindow.addRenderer(renderer);

        // 创建OpenGL渲染窗口视图
        const renderWindowView = vtkOpenGLRenderWindow.newInstance();
        renderWindowView.setContainer(container);
        renderWindow.addView(renderWindowView);

        // 设置初始渲染窗口大小
        const { width, height } = container.getBoundingClientRect();
        renderWindowView.setSize(Math.max(1, width), Math.max(1, height));

        // 创建交互器 - 注意初始化顺序很重要
        const interactor = vtkRenderWindowInteractor.newInstance();
        interactor.setView(renderWindowView);
        interactor.setRenderWindow(renderWindow);

        // 创建图像交互样式
        const interactorStyle = vtkInteractorStyleImage.newInstance();
        // setInteractionMode不是有效的方法，应该使用特定的交互样式配置
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

        // 渲染一次确保视图正确初始化
        renderWindow.render();

        // 监听窗口大小变化
        const resizeObserver = new ResizeObserver(() => {
          if (container && renderWindowView) {
            const { width, height } = container.getBoundingClientRect();
            renderWindowView.setSize(
              Math.max(1, Math.floor(width)),
              Math.max(1, Math.floor(height)),
            );
            renderWindow.render();
          }
        });
        resizeObserver.observe(container);

        return () => {
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
          }
        };
      } catch (error) {
        console.error('初始化VTK.js渲染器出错:', error);
        return undefined;
      }
    }
    return undefined;
  }, [viewDirection, viewUp]);

  // 处理图像数据变化
  useEffect(() => {
    if (!imageData || !context.current) return;

    try {
      const { renderer, renderWindow, actor, mapper } = context.current;

      // 配置图像映射器
      mapper.setInputData(imageData);

      // 设置切片模式基于视图方向
      const viewAxis = getLPSAxisFromDir(viewDirection);
      const ijkIndex = metadata.lpsOrientation[viewAxis];
      const mode = [SlicingMode.I, SlicingMode.J, SlicingMode.K][ijkIndex];
      mapper.setSlicingMode(mode);

      // 设置初始切片
      if (metadata) {
        const dimensions = metadata.dimensions;
        const initialSlice = Math.floor(dimensions[mode] / 2);
        mapper.setSlice(initialSlice);
        setSliceIndex(initialSlice);
      }

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
      console.error('设置图像数据时出错:', error);
    }

    return () => {
      // 清理会在组件卸载时进行
    };
  }, [imageData, metadata, viewDirection, windowLevel, windowWidth]);

  // 处理切片索引变化
  useEffect(() => {
    if (!context.current || !context.current.mapper) return;

    try {
      const { mapper, renderWindow } = context.current;
      mapper.setSlice(sliceIndex);
      renderWindow.render();
    } catch (error) {
      console.error('更新切片索引时出错:', error);
    }
  }, [sliceIndex]);

  // 处理窗宽窗位变化
  useEffect(() => {
    if (!context.current || !context.current.actor) return;

    try {
      const { actor, renderWindow } = context.current;
      const property = actor.getProperty();
      property.setColorWindow(windowWidth);
      property.setColorLevel(windowLevel);
      renderWindow.render();
    } catch (error) {
      console.error('更新窗宽窗位时出错:', error);
    }
  }, [windowLevel, windowWidth]);

  // 添加滚轮事件处理切片导航
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !imageData || !metadata || !context.current) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      try {
        if (context.current && context.current.mapper) {
          const { mapper, renderWindow } = context.current;
          const viewAxis = getLPSAxisFromDir(viewDirection);
          const ijkIndex = metadata.lpsOrientation[viewAxis];
          const mode = [SlicingMode.I, SlicingMode.J, SlicingMode.K][ijkIndex];
          const maxSliceIndex = metadata.dimensions[mode] - 1;

          // 计算新的切片索引
          let newSliceIndex = sliceIndex;
          if (event.deltaY > 0) {
            newSliceIndex = Math.max(0, sliceIndex - 1);
          } else {
            newSliceIndex = Math.min(maxSliceIndex, sliceIndex + 1);
          }

          if (newSliceIndex !== sliceIndex) {
            setSliceIndex(newSliceIndex);
            mapper.setSlice(newSliceIndex);
            renderWindow.render();
          }
        }
      } catch (error) {
        console.error('处理滚轮事件时出错:', error);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [imageData, metadata, sliceIndex, viewDirection]);

  return (
    <div className="z-0 grid flex-1 grid-cols-[auto_20px] grid-rows-1">
      <div
        ref={containerRef}
        className="relative z-0 h-full min-h-0 w-full min-w-0 overflow-hidden"
      >
        {imageData && metadata && (
          <div className="bg-opacity-50 absolute bottom-2 left-2 rounded bg-black p-2 text-sm text-white">
            <div>{/* 切片: {sliceIndex + 1}/{metadata.dimensions[]} */}</div>
            <div>
              窗位/窗宽: {windowLevel}/{windowWidth}
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col items-center justify-center bg-black text-xs text-white">
        {viewDirection}
      </div>
    </div>
  );
};

export default SliceViewer;
