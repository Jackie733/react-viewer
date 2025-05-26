import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { LPSAxisDir } from '@/types/lps';
import { useImageStore } from '@/store/image';
import SliceViewerOverlay from '@/components/SliceViewerOverlay';
import SliceViewerROI from '@/components/SliceViewerROI';
import SliceSlider from '@/components/SliceSlider';
import { useVtkView } from '@/hooks/useVtkView';
import { useSliceManipulator } from '@/hooks/useSliceManipulator';
import { useWindowManipulator } from '@/hooks/useWindowManipulator';
import { useImageGrabbing } from '@/hooks/useImageGrabbing';
import { useImageZoom } from '@/hooks/useImageZoom';
import { resetCameraToImage, resizeToFitImage } from '@/utils/camera';
import useResizeObserver from '@/hooks/useResizeObserver';
import { useRulerStore } from '@/store/ruler';
import CameraResetButton from './CameraResetButton';

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

  const isRulerToolActive = useRulerStore((state) => state.isRulerToolActive);

  useEffect(() => {
    if (containerRef.current) {
      setContainerReady(true);
    }
    return () => {
      setContainerReady(false);
    };
  }, []);

  const viewContext = useVtkView(
    containerReady ? containerRef.current : null,
    'slice',
  );

  const { sliceIndex, maxSlice, setSliceValue } = useSliceManipulator(
    id,
    viewDirection,
    viewContext,
  );
  useWindowManipulator(id, viewContext, isRulerToolActive);
  useImageGrabbing(viewContext);
  useImageZoom(viewContext);

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

  useResizeObserver(containerRef.current, updateViewSize);

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
      if (renderer && actor) renderer.removeActor(actor);
    };
  }, [viewContext, imageData]);

  useEffect(() => {
    if (!viewContext || !metadata || !imageData) return;
    resetCameraToImage(viewContext, metadata, viewDirection, viewUp);
    resizeToFitImage(viewContext, metadata, viewDirection, viewUp);
    viewContext.requestRender();
  }, [viewContext, metadata, imageData, viewDirection, viewUp]);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  const getBorderColorClass = () =>
    isHovered ? 'border-gray-400' : 'border-gray-700';

  const handleResetCamera = useCallback(() => {
    if (!viewContext || !metadata || !imageData) return;
    resetCameraToImage(viewContext, metadata, viewDirection, viewUp);
    resizeToFitImage(viewContext, metadata, viewDirection, viewUp);
    viewContext.requestRender();
  }, [viewContext, metadata, imageData, viewDirection, viewUp]);

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
            sliceIndex={sliceIndex}
          />
          <SliceViewerROI
            viewContext={viewContext}
            viewDirection={viewDirection}
            sliceIndex={sliceIndex}
          />
        </div>
        <div className="relative flex flex-col items-center bg-black">
          <CameraResetButton onClick={handleResetCamera} className="mt-1" />
          <SliceSlider
            sliceIndex={sliceIndex}
            maxSlice={maxSlice}
            onSliceChange={setSliceValue}
          />
        </div>
      </div>
    </div>
  );
};

export default memo(SliceViewer);
