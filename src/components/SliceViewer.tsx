import { useEffect, useRef, useState, useCallback } from 'react';
import { LPSAxisDir } from '@/types/lps';
import { useImageStore } from '@/store/image';
import { useDicomStore } from '@/store/dicom';
import SliceViewerOverlay from '@/components/SliceViewerOverlay';
import SliceSlider from '@/components/SliceSlider';
import { useSliceControl } from '@/hooks/useSliceControl';
import { useVtkView } from '@/hooks/useVtkView';
import { resetCameraToImage, resizeToFitImage } from '@/utils/camera';
import useResizeObserver from '@/hooks/useResizeObserver';

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
  const [containerReady, setContainerReady] = useState(false);

  const imageData = useImageStore((state) => state.currentImage);
  const metadata = useImageStore((state) => state.metadata);
  const windowLevel = useDicomStore((state) => state.windowLevel) || 40;
  const windowWidth = useDicomStore((state) => state.windowWidth) || 400;

  useEffect(() => {
    if (containerRef.current) {
      setContainerReady(true);
    }
    return () => {
      setContainerReady(false);
    };
  }, []);

  const viewContext = useVtkView(containerReady ? containerRef.current : null);

  const updateViewSize = useCallback(() => {
    if (!viewContext) return;
    const { renderWindowView, requestRender } = viewContext;
    const container = renderWindowView?.getContainer();
    if (!container) return;

    const { width, height } = container.getBoundingClientRect();
    const scaledWidth = Math.max(
      1,
      Math.floor(width * globalThis.devicePixelRatio),
    );
    const scaledHeight = Math.max(
      1,
      Math.floor(height * globalThis.devicePixelRatio),
    );
    renderWindowView.setSize(scaledWidth, scaledHeight);
    requestRender();
  }, [viewContext]);

  // 使用当前的ref值进行DOM观察
  useResizeObserver(containerRef.current, updateViewSize);

  const { sliceIndex, maxSlice, updateSlice } = useSliceControl(
    viewDirection,
    viewContext,
  );

  useEffect(() => {
    if (!viewContext || !imageData) return;

    const { renderer, actor, mapper, requestRender } = viewContext;

    renderer.setBackground(0, 0, 0);
    renderer.getActiveCamera().setParallelProjection(true);

    mapper.setInputData(imageData);
    actor.setMapper(mapper);

    renderer.addActor(actor);

    requestRender();

    return () => {
      renderer.removeActor(actor);
    };
  }, [viewContext, imageData]);

  useEffect(() => {
    if (!viewContext || !metadata || !imageData) return;
    resetCameraToImage(viewContext, metadata, viewDirection, viewUp);
    resizeToFitImage(viewContext, metadata, viewDirection, viewUp);
    viewContext.requestRender();
  }, [viewContext, metadata, imageData, viewDirection, viewUp]);

  useEffect(() => {
    if (!viewContext || !imageData) return;
    const { actor, requestRender } = viewContext;
    const property = actor.getProperty();
    property.setColorWindow(windowWidth);
    property.setColorLevel(windowLevel);

    requestRender();
  }, [windowLevel, windowWidth, viewContext, imageData]);

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
          <SliceViewerOverlay
            id={id}
            viewDirection={viewDirection}
            windowLevel={windowLevel}
            windowWidth={windowWidth}
            sliceIndex={sliceIndex}
            metadata={metadata}
          />
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
