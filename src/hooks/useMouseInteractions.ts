import { useEffect, useRef } from 'react';
import { ViewContext } from '@/types/views';
import { useDicomStore } from '@/store/dicom';

interface MouseInteractionOptions {
  initialWindowWidth?: number;
  initialWindowLevel?: number;
  onWindowValueChange?: (width: number, level: number) => void;
}

/**
 * 自定义Hook，处理医学影像的鼠标交互
 *
 * 实现功能：
 * - 滚轮上下：切换图像slice（由调用者实现）
 * - 左键拖动：调整窗宽窗位
 * - 右键拖动：缩放图像
 * - 中键拖动：平移图像
 */
export function useMouseInteractions(
  viewContext: ViewContext | null,
  containerRef: React.RefObject<HTMLElement | HTMLDivElement | null>,
  options?: MouseInteractionOptions,
) {
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const interactionTypeRef = useRef<'pan' | 'window' | 'zoom' | null>(null);

  // 从store获取当前窗宽窗位，如果没有传入初始值
  const storeWindowWidth = useDicomStore((state) => state.windowWidth);
  const storeWindowLevel = useDicomStore((state) => state.windowLevel);
  const setWindow = useDicomStore((state) => state.setWindow);

  // 使用初始值或者store中的值
  const initialWindowWidth =
    options?.initialWindowWidth ?? storeWindowWidth ?? 400;
  const initialWindowLevel =
    options?.initialWindowLevel ?? storeWindowLevel ?? 40;

  // 当前窗宽窗位值的引用
  const windowWidthRef = useRef(initialWindowWidth);
  const windowLevelRef = useRef(initialWindowLevel);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !viewContext) return;

    const handleMouseDown = (event: MouseEvent) => {
      event.preventDefault();

      isDraggingRef.current = true;
      lastMousePosRef.current = { x: event.clientX, y: event.clientY };

      // 根据按下的鼠标按钮确定交互类型
      switch (event.button) {
        case 0: // 左键
          interactionTypeRef.current = 'window';
          document.body.style.cursor = 'move';
          break;
        case 1: // 中键
          interactionTypeRef.current = 'pan';
          document.body.style.cursor = 'grabbing';
          break;
        case 2: // 右键
          interactionTypeRef.current = 'zoom';
          document.body.style.cursor = 'zoom-in';
          break;
        default:
          interactionTypeRef.current = null;
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDraggingRef.current || !interactionTypeRef.current || !viewContext)
        return;

      const deltaX = event.clientX - lastMousePosRef.current.x;
      const deltaY = event.clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: event.clientX, y: event.clientY };

      switch (interactionTypeRef.current) {
        case 'window': {
          // 调整窗宽窗位
          // 横向移动调整窗宽，纵向移动调整窗位
          const windowWidthDelta = deltaX * 5; // 调整灵敏度
          const windowLevelDelta = -deltaY * 5; // 上移减小，下移增大

          windowWidthRef.current = Math.max(
            1,
            windowWidthRef.current + windowWidthDelta,
          );
          windowLevelRef.current = windowLevelRef.current + windowLevelDelta;

          // 更新VTK属性
          const { actor, requestRender } = viewContext;
          const property = actor.getProperty();
          property.setColorWindow(windowWidthRef.current);
          property.setColorLevel(windowLevelRef.current);

          // 回调通知值变化
          if (options?.onWindowValueChange) {
            options.onWindowValueChange(
              windowWidthRef.current,
              windowLevelRef.current,
            );
          }

          // 更新全局状态
          setWindow(windowLevelRef.current, windowWidthRef.current);

          requestRender();
          break;
        }
        case 'zoom': {
          // 缩放图像
          const { renderer, requestRender } = viewContext;
          const camera = renderer.getActiveCamera();

          // 上下移动调整缩放
          const zoomFactor = 1.0 + deltaY * 0.01;

          // 调整相机平行尺寸来缩放
          if (camera.getParallelProjection()) {
            let parallelScale = camera.getParallelScale();
            parallelScale *= zoomFactor;
            camera.setParallelScale(parallelScale);
          } else {
            // 对于透视投影（一般不在医学影像使用）
            camera.dolly(zoomFactor);
          }

          requestRender();
          break;
        }
        case 'pan': {
          // 平移图像
          const { renderer, requestRender } = viewContext;
          const camera = renderer.getActiveCamera();

          // 获取当前相机信息
          const position = camera.getPosition();
          const focalPoint = camera.getFocalPoint();

          // 获取视图大小做归一化
          const container = viewContext.renderWindowView?.getContainer();
          const width = container?.clientWidth || 100;
          const height = container?.clientHeight || 100;

          // 计算平移量（与视图大小成比例）
          const dx = (-2 * deltaX) / width;
          const dy = (2 * deltaY) / height;

          // 获取相机方向向量
          const right = [1, 0, 0]; // 默认右方向
          const up = camera.getViewUp(); // 获取相机上方向

          // 在右和上方向上平移
          for (let i = 0; i < 3; i++) {
            position[i] += dx * right[i] + dy * up[i];
            focalPoint[i] += dx * right[i] + dy * up[i];
          }

          camera.setPosition(position[0], position[1], position[2]);
          camera.setFocalPoint(focalPoint[0], focalPoint[1], focalPoint[2]);

          requestRender();
          break;
        }
      }
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        interactionTypeRef.current = null;
        document.body.style.cursor = 'default';
      }
    };

    const handleContextMenu = (event: MouseEvent) => {
      // 防止右键菜单弹出
      event.preventDefault();
    };

    // 添加事件监听
    container.addEventListener('mousedown', handleMouseDown as EventListener);
    document.addEventListener('mousemove', handleMouseMove as EventListener);
    document.addEventListener('mouseup', handleMouseUp as EventListener);
    container.addEventListener(
      'contextmenu',
      handleContextMenu as EventListener,
    );

    // 清理函数
    return () => {
      container.removeEventListener(
        'mousedown',
        handleMouseDown as EventListener,
      );
      document.removeEventListener(
        'mousemove',
        handleMouseMove as EventListener,
      );
      document.removeEventListener('mouseup', handleMouseUp as EventListener);
      container.removeEventListener(
        'contextmenu',
        handleContextMenu as EventListener,
      );
      document.body.style.cursor = 'default';
    };
  }, [viewContext, containerRef, options, setWindow]);

  return {
    windowWidth: windowWidthRef.current,
    windowLevel: windowLevelRef.current,
  };
}
