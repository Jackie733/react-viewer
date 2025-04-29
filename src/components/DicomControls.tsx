import { useDicomStore } from '@/store/dicom';
import { useState, useEffect } from 'react';
import { ArrowLeftToLine, ArrowRightToLine } from 'lucide-react';
import { Button } from './ui/button';

interface DicomControlsProps {
  className?: string;
  onExpandToggle?: (isExpanded: boolean) => void;
}

const DicomControls: React.FC<DicomControlsProps> = ({
  className = '',
  onExpandToggle,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    if (onExpandToggle) {
      onExpandToggle(newExpandedState);
    }
  };

  const windowLevel = useDicomStore((state) => state.windowLevel);
  const windowWidth = useDicomStore((state) => state.windowWidth);
  const setWindow = useDicomStore((state) => state.setWindow);

  const [localWindowLevel, setLocalWindowLevel] = useState(windowLevel || 40);
  const [localWindowWidth, setLocalWindowWidth] = useState(windowWidth || 400);

  useEffect(() => {
    if (windowLevel !== null) setLocalWindowLevel(windowLevel);
  }, [windowLevel]);

  useEffect(() => {
    if (windowWidth !== null) setLocalWindowWidth(windowWidth);
  }, [windowWidth]);

  // preset
  const presets = [
    { name: 'Brain', wl: 40, ww: 80 },
    { name: 'Bone', wl: 400, ww: 2000 },
    { name: 'Lung', wl: -600, ww: 1500 },
    { name: 'Abdomen', wl: 40, ww: 400 },
  ];

  const applyPreset = (level: number, width: number) => {
    setLocalWindowLevel(level);
    setLocalWindowWidth(width);
    setWindow(level, width);
  };

  const handleWindowLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLevel = parseInt(e.target.value, 10);
    setLocalWindowLevel(newLevel);
    setWindow(newLevel, localWindowWidth);
  };

  const handleWindowWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = parseInt(e.target.value, 10);
    setLocalWindowWidth(newWidth);
    setWindow(localWindowLevel, newWidth);
  };

  return (
    <div className="flex h-full">
      <div className="cursor-pointer" onClick={toggleExpanded}>
        <div className="flex h-full w-4 items-center justify-center bg-gray-800 shadow-md transition-colors hover:bg-gray-700">
          <div className="transform text-gray-400">
            {isExpanded ? (
              <ArrowRightToLine className="size-4" />
            ) : (
              <ArrowLeftToLine className="size-4" />
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className={`flex-1 bg-gray-800 p-4 text-white ${className}`}>
          <div className="mb-4">
            <h4 className="mb-1 text-xs">WL & WW Presets</h4>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <Button
                  key={preset.name}
                  size="sm"
                  variant="outline"
                  onClick={() => applyPreset(preset.wl, preset.ww)}
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <div className="mb-2">
              <label className="flex items-center justify-between text-xs">
                <span>Window Level</span>
                <span>{localWindowLevel}</span>
              </label>
              <input
                type="range"
                min="-1000"
                max="3000"
                step="1"
                value={localWindowLevel}
                onChange={handleWindowLevelChange}
                className="w-full"
              />
            </div>

            <div className="mb-2">
              <label className="flex items-center justify-between text-xs">
                <span>Window Width</span>
                <span>{localWindowWidth}</span>
              </label>
              <input
                type="range"
                min="1"
                max="4000"
                step="1"
                value={localWindowWidth}
                onChange={handleWindowWidthChange}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DicomControls;
