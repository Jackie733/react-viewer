import { useEffect, useRef, useState, useMemo } from 'react';
import { LPSAxisDir } from '@/types/lps';
import { useImageStore } from '@/store/image';
import { useDicomStore } from '@/store/dicom';
import ViewerInfoPanel from '@/components/ViewerInfoPanel';
import SliceSlider from '@/components/SliceSlider';
import { useSliceControl } from '@/hooks/useSliceControl';
import { useVtkView } from '@/hooks/useVtkView';
import { resetCameraToImage } from '@/utils/camera';

interface SliceViewerProps {
  id: string;
  type: string;
  viewDirection: LPSAxisDir;
  viewUp: LPSAxisDir;
}

const SliceViewer: React.FC<SliceViewerProps> = ({
  id,
  viewDirection,
  viewUp,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [containerMounted, setContainerMounted] = useState(false);

  // 跟踪图像是否已设置
  const [imageSet, setImageSet] = useState(false);

  const imageData = useImageStore((state) => state.currentImage);
  const metadata = useImageStore((state) => state.metadata);
  const windowLevel = useDicomStore((state) => state.windowLevel) || 40;
  const windowWidth = useDicomStore((state) => state.windowWidth) || 400;

  const containerElement = useMemo(
    () => (containerMounted ? containerRef.current : null),
    [containerMounted],
  );

  const viewContext = useVtkView(containerElement);

  const { sliceIndex, maxSlice, updateSlice } = useSliceControl(
    viewDirection,
    viewContext,
  );

  useEffect(() => {
    setContainerMounted(true);

    return () => {
      setContainerMounted(false);
    };
  }, []);

  useEffect(() => {
    if (!viewContext || !imageData) return;

    const { renderer, actor, mapper, requestRender } = viewContext;

    renderer.setBackground(0, 0, 0);
    renderer.getActiveCamera().setParallelProjection(true);

    mapper.setInputData(imageData);
    actor.setMapper(mapper);

    renderer.addActor(actor);

    // 标记图像已设置
    setImageSet(true);

    // 强制立即渲染
    requestRender(true);

    // 一次性触发器 - 确保渲染后显示图像
    const forceRenderTimer = setTimeout(() => {
      requestRender(true);
    }, 50);

    return () => {
      clearTimeout(forceRenderTimer);
      renderer.removeActor(actor);
      setImageSet(false);
    };
  }, [viewContext, imageData]);

  // 设置相机
  useEffect(() => {
    if (!viewContext || !metadata || !imageData || !imageSet) return;

    try {
      // 重置相机，确保拍摄整个图像
      resetCameraToImage(viewContext, metadata, viewDirection, viewUp);

      // 强制渲染新的相机设置
      viewContext.requestRender(true);

      // 双重保险 - 确保相机设置后渲染显示
      setTimeout(() => {
        viewContext.requestRender(true);
      }, 0);
    } catch (error) {
      console.error('Error setting camera in SliceViewer', id, error);
    }
  }, [viewContext, metadata, imageData, viewDirection, viewUp, imageSet, id]);

  // 处理窗宽窗位变化
  useEffect(() => {
    if (!viewContext || !imageData || !imageSet) return;

    try {
      const { actor, requestRender } = viewContext;
      const property = actor.getProperty();
      property.setColorWindow(windowWidth);
      property.setColorLevel(windowLevel);

      // 强制立即渲染
      requestRender(true);
    } catch (error) {
      console.error(
        'Error setting window level/width in SliceViewer',
        id,
        error,
      );
    }
  }, [windowLevel, windowWidth, viewContext, imageData, imageSet, id]);

  // 确保切片变化时立即渲染
  useEffect(() => {
    if (!viewContext || !imageData || !imageSet) return;
    viewContext.requestRender(true);
  }, [sliceIndex, viewContext, imageData, imageSet]);

  // 滚轮事件处理
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !imageData || !metadata) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      try {
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

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const getBorderColorClass = () => {
    if (isHovered) return 'border-gray-400';
    return 'border-gray-700';
  };

  return (
    <div
      className={`flex h-full w-full flex-col border-2 ${getBorderColorClass()} rounded-lg transition-colors duration-150`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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
