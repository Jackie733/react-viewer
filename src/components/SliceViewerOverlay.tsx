import { LPSAxisDir } from '@/types/lps';
import { SlicingMode } from '@kitware/vtk.js/Rendering/Core/ImageMapper/Constants';
import { getLPSAxisFromDir } from '@/utils/lps';
import { ImageMetadata } from '@/types/image';

interface SliceViewerOverlayProps {
  id: string;
  viewDirection: LPSAxisDir;
  windowLevel: number;
  windowWidth: number;
  sliceIndex: number;
  metadata: ImageMetadata;
}

const SliceViewerOverlay: React.FC<SliceViewerOverlayProps> = ({
  id,
  viewDirection,
  windowLevel,
  windowWidth,
  sliceIndex,
  metadata,
}) => {
  const viewAxis = getLPSAxisFromDir(viewDirection);

  const getSliceCount = () => {
    if (!metadata) return 0;

    try {
      const ijkIndex = metadata.lpsOrientation[viewAxis];
      const mode = [SlicingMode.I, SlicingMode.J, SlicingMode.K][ijkIndex];
      return metadata.dimensions[mode];
    } catch (error) {
      console.error('计算切片数量时出错:', error);
      return 0;
    }
  };

  const getSliceLocationInfo = () => {
    if (!metadata) {
      return { spacing: 0, location: 0, axisLabel: '' };
    }

    try {
      const ijkIndex = metadata.lpsOrientation[viewAxis];

      const location =
        metadata.origin[ijkIndex] + sliceIndex * metadata.spacing[ijkIndex];

      const patientAxesLabels = ['X', 'Y', 'Z'];
      const axisLabel = patientAxesLabels[ijkIndex];

      return { spacing: metadata.spacing[ijkIndex], location, axisLabel };
    } catch (error) {
      console.error('计算切片位置时出错:', error);
      return { spacing: 0, location: 0, axisLabel: '' };
    }
  };

  const getViewName = () => {
    switch (id) {
      case 'Axial':
        return '横断面';
      case 'Coronal':
        return '冠状面';
      case 'Sagittal':
        return '矢状面';
      default:
        return id;
    }
  };

  const sliceCount = getSliceCount();
  const viewName = getViewName();
  const {
    spacing: sliceSpacing,
    location: sliceLocation,
    axisLabel: sliceLocationAxis,
  } = getSliceLocationInfo();

  return (
    <div className="pointer-events-none absolute inset-2 z-10">
      <div className="absolute top-0 right-0 left-0 flex items-center justify-between px-2 py-1 text-xs text-white">
        <div>
          {viewName} ({id})
        </div>
      </div>

      <div className="absolute bottom-0 left-2 rounded p-2 text-xs text-white">
        <div>
          Slice: {sliceIndex + 1}/{sliceCount}
        </div>
        <div>
          Location ({sliceLocationAxis}): {sliceLocation.toFixed(3)} mm
        </div>
        <div>Spacing: {sliceSpacing.toFixed(3)} mm</div>
      </div>

      <div className="absolute right-2 bottom-0 rounded p-2 text-xs text-white">
        <div>WL: {windowLevel}</div>
        <div>WW: {windowWidth}</div>
      </div>
    </div>
  );
};

export default SliceViewerOverlay;
