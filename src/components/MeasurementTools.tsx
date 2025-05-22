import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  Ruler,
  TriangleRight,
  Type as TypeIcon,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MeasurementToolsType } from '@/types/tools';

interface MeasurementToolsProps {
  onToolChange?: (tool: MeasurementToolsType | null) => void;
  initialTool?: MeasurementToolsType.Ruler;
}

const toolIcons: Record<MeasurementToolsType, React.ElementType> = {
  Ruler: Ruler,
  Angle: TriangleRight,
  Text: TypeIcon,
};

const toolLabels: Record<MeasurementToolsType, string> = {
  Ruler: 'Length',
  Angle: 'Angle',
  Text: 'Text',
};

const MeasurementTools: React.FC<MeasurementToolsProps> = ({
  onToolChange,
  initialTool = MeasurementToolsType.Ruler,
}) => {
  const [isToolbarActive, setIsToolbarActive] = useState(false);
  const [selectedTool, setSelectedTool] =
    useState<MeasurementToolsType>(initialTool);

  const CurrentToolIcon = toolIcons[selectedTool];

  const handleToolSelect = (tool: MeasurementToolsType) => {
    setSelectedTool(tool);
    if (isToolbarActive) {
      toast.info(`${toolLabels[tool]} tool activated`);
      onToolChange?.(tool);
    }
  };

  const toggleToolbarActive = () => {
    const newActiveState = !isToolbarActive;
    setIsToolbarActive(newActiveState);
    if (newActiveState) {
      toast.info(`${toolLabels[selectedTool]} tool activated`);
      onToolChange?.(selectedTool);
    } else {
      toast.info(`${toolLabels[selectedTool]} tool deactivated`);
      onToolChange?.(null);
    }
  };

  return (
    <div className="m-1 flex items-center rounded-md">
      <Button
        variant={isToolbarActive ? 'secondary' : 'ghost'}
        size="icon"
        onClick={toggleToolbarActive}
        title={
          isToolbarActive
            ? `Deactivate ${toolLabels[selectedTool]}`
            : `Activate ${toolLabels[selectedTool]}`
        }
      >
        <CurrentToolIcon />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex h-9 w-4 cursor-pointer items-center rounded hover:bg-gray-300 dark:hover:bg-gray-700">
            <ChevronDown />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          {(Object.keys(toolIcons) as MeasurementToolsType[]).map((toolKey) => {
            const IconComponent = toolIcons[toolKey];
            return (
              <DropdownMenuItem
                key={toolKey}
                onClick={() => handleToolSelect(toolKey)}
                className={selectedTool === toolKey ? 'bg-accent' : ''}
              >
                <IconComponent className="mr-2 h-5 w-5" />
                <span>{toolLabels[toolKey]}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default MeasurementTools;
