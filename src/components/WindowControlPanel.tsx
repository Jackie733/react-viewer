import { WLPresetsCT } from '@/config';
import { Button } from './ui/button';
import { memo } from 'react';
import { DEFAULT_WINDOW_LEVEL } from '@/store/windowing';
import { DEFAULT_WINDOW_WIDTH } from '@/store/windowing';
import { useWindowingStore } from '@/store/windowing';

const WindowControlPanel = () => {
  const windowConfig = useWindowingStore((state) => state.config);
  const setWindowConfig = useWindowingStore((state) => state.setConfig);
  const windowLevel = windowConfig?.level ?? DEFAULT_WINDOW_LEVEL;
  const windowWidth = windowConfig?.width ?? DEFAULT_WINDOW_WIDTH;

  const applyPreset = (level: number, width: number) => {
    setWindowConfig({ level, width });
  };

  const handleWindowLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLevel = parseInt(e.target.value, 10);
    setWindowConfig({ level: newLevel });
  };

  const handleWindowWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = parseInt(e.target.value, 10);
    setWindowConfig({ width: newWidth });
  };

  return (
    <div>
      <div className="mb-4">
        <h4 className="mb-1 text-xs">WL & WW Presets</h4>
        <div className="flex flex-wrap gap-2">
          {Object.entries(WLPresetsCT).map(([name, { width, level }]) => (
            <Button
              key={name}
              size="sm"
              variant="outline"
              onClick={() => applyPreset(level, width)}
            >
              {name}
            </Button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="mb-2">
          <label className="flex items-center justify-between text-xs">
            <span>Window Level</span>
            <span>{windowLevel}</span>
          </label>
          <input
            type="range"
            min="-1000"
            max="3000"
            step="1"
            value={windowLevel}
            onChange={handleWindowLevelChange}
            className="w-full"
          />
        </div>

        <div className="mb-2">
          <label className="flex items-center justify-between text-xs">
            <span>Window Width</span>
            <span>{windowWidth}</span>
          </label>
          <input
            type="range"
            min="1"
            max="4000"
            step="1"
            value={windowWidth}
            onChange={handleWindowWidthChange}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default memo(WindowControlPanel);
