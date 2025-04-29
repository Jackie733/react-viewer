import { useDicomStore } from '@/store/dicom';
import { useImageStore } from '@/store/image';
import { useState, useEffect } from 'react';
import { ArrowLeftToLine, ArrowRightToLine } from 'lucide-react';

interface DicomControlsProps {
  className?: string;
  onExpandToggle?: (isExpanded: boolean) => void;
}

const DicomControls: React.FC<DicomControlsProps> = ({
  className = '',
  onExpandToggle,
}) => {
  // 控制面板显示状态
  const [isExpanded, setIsExpanded] = useState(true);

  // 切换控制面板显示状态
  const toggleExpanded = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    if (onExpandToggle) {
      onExpandToggle(newExpandedState);
    }
  };

  // 从store获取当前设置
  const windowLevel = useDicomStore((state) => state.windowLevel);
  const windowWidth = useDicomStore((state) => state.windowWidth);
  const setWindow = useDicomStore((state) => state.setWindow);

  // 本地窗宽窗位状态，用于处理拖动
  const [localWindowLevel, setLocalWindowLevel] = useState(windowLevel || 40);
  const [localWindowWidth, setLocalWindowWidth] = useState(windowWidth || 400);

  // 从image store获取切片信息
  const metadata = useImageStore((state) => state.metadata);
  const sliceIndex = useImageStore((state) => state.renderSettings?.slice || 0);
  const setSlice = (slice: number) => {
    useImageStore.getState().updateRenderSettings({ slice });
  };

  // 当store中的值变化时更新本地状态
  useEffect(() => {
    if (windowLevel !== null) setLocalWindowLevel(windowLevel);
  }, [windowLevel]);

  useEffect(() => {
    if (windowWidth !== null) setLocalWindowWidth(windowWidth);
  }, [windowWidth]);

  // 预设窗宽窗位值
  const presets = [
    { name: '脑窗', wl: 40, ww: 80 },
    { name: '骨窗', wl: 400, ww: 2000 },
    { name: '肺窗', wl: -600, ww: 1500 },
    { name: '腹窗', wl: 40, ww: 400 },
  ];

  // 应用预设
  const applyPreset = (level: number, width: number) => {
    setLocalWindowLevel(level);
    setLocalWindowWidth(width);
    setWindow(level, width);
  };

  // 窗宽窗位调整
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

  // 切片调整
  const handleSliceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSlice = parseInt(e.target.value, 10);
    setSlice(newSlice);
  };

  // 获取最大切片数
  const maxSlice = metadata?.dimensions ? metadata.dimensions[2] - 1 : 0;

  return (
    <div className="flex h-full">
      {/* 切换按钮 */}
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
            <h4 className="mb-1 text-xs">窗宽窗位预设</h4>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset.wl, preset.ww)}
                  className="rounded bg-gray-700 px-2 py-1 text-xs hover:bg-gray-600"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* 窗宽窗位滑块 */}
          <div className="mb-4">
            <div className="mb-2">
              <label className="flex items-center justify-between text-xs">
                <span>窗位 (Level)</span>
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
                <span>窗宽 (Width)</span>
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

          {metadata && (
            <div>
              <label className="flex items-center justify-between text-xs">
                <span>切片</span>
                <span>
                  {sliceIndex + 1} / {maxSlice + 1}
                </span>
              </label>
              <input
                type="range"
                min="0"
                max={maxSlice}
                step="1"
                value={sliceIndex}
                onChange={handleSliceChange}
                className="w-full"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DicomControls;
