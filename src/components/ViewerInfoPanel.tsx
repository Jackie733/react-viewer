import { LPSAxisDir } from '@/types/lps';
import { SlicingMode } from '@kitware/vtk.js/Rendering/Core/ImageMapper/Constants';
import { getLPSAxisFromDir } from '@/utils/lps';
import { ImageMetadata } from '@/types/image';

interface ViewerInfoPanelProps {
  id: string;
  viewDirection: LPSAxisDir;
  windowLevel: number;
  windowWidth: number;
  sliceIndex: number;
  metadata: ImageMetadata;
  isDragging?: boolean;
}

const ViewerInfoPanel: React.FC<ViewerInfoPanelProps> = ({
  id,
  viewDirection,
  windowLevel,
  windowWidth,
  sliceIndex,
  metadata,
  isDragging = false,
}) => {
  const getSliceCount = () => {
    if (!metadata) return 0;

    try {
      const viewAxis = getLPSAxisFromDir(viewDirection);
      const ijkIndex = metadata.lpsOrientation[viewAxis];
      const mode = [SlicingMode.I, SlicingMode.J, SlicingMode.K][ijkIndex];
      return metadata.dimensions[mode];
    } catch (error) {
      console.error('计算切片数量时出错:', error);
      return 0;
    }
  };

  const getViewName = () => {
    switch (id) {
      case 'Axial':
        return '轴位';
      case 'Coronal':
        return '冠状位';
      case 'Sagittal':
        return '矢状位';
      default:
        return id;
    }
  };

  const sliceCount = getSliceCount();
  const viewName = getViewName();

  return (
    <div className="pointer-events-none absolute inset-2 z-10">
      <div className="bg-opacity-50 absolute top-0 right-0 left-0 flex items-center justify-between bg-black px-2 py-1 text-xs text-white">
        <div>
          {viewName} ({id})
        </div>
      </div>

      <div className="bg-opacity-50 absolute bottom-2 left-2 rounded bg-black p-2 text-xs text-white">
        <div>
          切片: {sliceIndex + 1}/{sliceCount}
        </div>
        {isDragging && <div className="text-yellow-300">正在调整...</div>}
      </div>

      <div className="bg-opacity-50 absolute right-2 bottom-2 rounded bg-black p-2 text-xs text-white">
        <div>窗位: {windowLevel}</div>
        <div>窗宽: {windowWidth}</div>
      </div>
    </div>
  );
};

export default ViewerInfoPanel;
