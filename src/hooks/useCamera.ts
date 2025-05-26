import { useCallback, useEffect } from 'react';
import { useImageStore } from '@/store/image';
import { LPSAxisDir } from '@/types/lps';
import { ViewContext } from '@/types/views';
import { resetCameraToImage, resizeToFitImage } from '@/utils/camera';
import { Maybe } from '@/types';

export function useCamera({
  viewContext,
  viewDirection,
  viewUp,
}: {
  viewContext: Maybe<ViewContext<'slice'>>;
  viewDirection: LPSAxisDir;
  viewUp: LPSAxisDir;
}) {
  const metadata = useImageStore((state) => state.metadata);
  const imageData = useImageStore((state) => state.currentImage);

  const resetCamera = useCallback(() => {
    if (!viewContext || !metadata || !imageData) return;
    resetCameraToImage(viewContext, metadata, viewDirection, viewUp);
    resizeToFitImage(viewContext, metadata, viewDirection, viewUp);
  }, [viewContext, metadata, imageData, viewDirection, viewUp]);

  useEffect(() => {
    resetCamera();
  }, [resetCamera]);

  return {
    resetCamera,
  };
}
