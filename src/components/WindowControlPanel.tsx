import { memo } from 'react';
import { ChevronsUpDown } from 'lucide-react';
import { WLPresetsCT } from '@/config';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
    <Collapsible defaultOpen={true}>
      <CollapsibleTrigger className="flex w-full items-center justify-between py-2">
        <h4 className="mb-1 text-sm">WL & WW Panel</h4>
        <ChevronsUpDown className="size-4" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {Object.entries(WLPresetsCT).map(([name, { width, level }]) => (
              <Button
                key={name}
                size="sm"
                variant="outline"
                onClick={() => applyPreset(level, width)}
                className="px-2 text-xs"
              >
                {name}
              </Button>
            ))}
          </div>
        </div>

        <>
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
        </>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default memo(WindowControlPanel);
