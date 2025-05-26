import { ArrowLeftToLine, ArrowRightToLine } from 'lucide-react';
import WindowControlPanel from '@/components/WindowControlPanel';
import Ruler from '@/components/tools/Ruler';
import { useViewStore } from '@/store/view';

interface DicomControlsProps {
  className?: string;
}

const DicomControls: React.FC<DicomControlsProps> = ({ className = '' }) => {
  const controlsExpanded = useViewStore((state) => state.controlsExpanded);
  const toggleExpanded = useViewStore((state) => state.toggleControlsExpanded);

  return (
    <div className="flex h-full">
      <div className="cursor-pointer" onClick={toggleExpanded}>
        <div className="flex h-full w-4 items-center justify-center border-r border-dashed bg-gray-800 shadow-md transition-colors hover:bg-gray-700">
          <div className="transform text-gray-400">
            {controlsExpanded ? (
              <ArrowRightToLine className="size-4" />
            ) : (
              <ArrowLeftToLine className="size-4" />
            )}
          </div>
        </div>
      </div>

      {controlsExpanded && (
        <div className={`flex-1 bg-gray-800 p-2 text-white ${className}`}>
          <WindowControlPanel />
          <div className="border-t border-gray-700 pt-4">
            <h4 className="mb-2 text-sm">Measurements</h4>
            <Ruler />
          </div>
        </div>
      )}
    </div>
  );
};

export default DicomControls;
