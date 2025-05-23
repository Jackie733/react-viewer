import React, { useMemo } from 'react';
import { Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRulerStore } from '@/store/ruler';
import { cn } from '@/lib/utils';

interface RulerProps {
  className?: string;
}

const Ruler: React.FC<RulerProps> = ({ className }) => {
  // 使用分离的选择器避免无限循环
  const rulers = useRulerStore((state) => state.rulers);
  const activeRulerId = useRulerStore((state) => state.activeRulerId);
  const removeRuler = useRulerStore((state) => state.removeRuler);
  const updateRulerProperties = useRulerStore(
    (state) => state.updateRulerProperties,
  );
  const setActiveRulerId = useRulerStore((state) => state.setActiveRulerId);

  // 使用useMemo缓存rulers数组以避免重新渲染
  const rulerList = useMemo(() => Object.values(rulers), [rulers]);

  const handleDeleteRuler = (rulerId: string) => {
    removeRuler(rulerId);
  };

  const handleToggleVisibility = (rulerId: string) => {
    const ruler = rulers[rulerId];
    if (ruler) {
      updateRulerProperties(rulerId, {
        lineVisible: !ruler.lineVisible,
      });
    }
  };

  const handleRulerSelect = (rulerId: string) => {
    setActiveRulerId(rulerId);
  };

  const formatDistance = (distance: number | null): string => {
    if (distance === null || distance === undefined) {
      return '--';
    }
    if (distance < 1) {
      return `${(distance * 1000).toFixed(1)} mm`;
    } else if (distance < 100) {
      return `${distance.toFixed(2)} cm`;
    } else {
      return `${(distance / 10).toFixed(2)} m`;
    }
  };

  if (rulerList.length === 0) {
    return (
      <div className={cn('text-muted-foreground p-4 text-center', className)}>
        <p className="text-sm">暂无测量数据</p>
        <p className="mt-1 text-xs">点击并拖拽图像开始测量</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2 p-2', className)}>
      <div className="text-foreground mb-3 text-sm font-medium">
        测量结果 ({rulerList.length})
      </div>

      <div className="max-h-96 space-y-2 overflow-y-auto">
        {rulerList.map((ruler) => (
          <div
            key={ruler.id}
            className={cn(
              'flex items-center justify-between rounded-lg border p-3 transition-colors',
              'hover:bg-accent/50 cursor-pointer',
              ruler.id === activeRulerId
                ? 'bg-accent border-accent-foreground/20'
                : 'bg-card border-border',
            )}
            onClick={() => handleRulerSelect(ruler.id)}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full border"
                  style={{
                    backgroundColor: `rgb(${ruler.color[0] * 255}, ${ruler.color[1] * 255}, ${ruler.color[2] * 255})`,
                    borderColor: `rgba(${ruler.color[0] * 255}, ${ruler.color[1] * 255}, ${ruler.color[2] * 255}, 0.5)`,
                  }}
                />
                <span className="text-sm font-medium">
                  测量 #{ruler.id.slice(-4)}
                </span>
              </div>

              <div className="text-primary mt-1 text-lg font-semibold">
                {formatDistance(ruler.distance)}
              </div>

              <div className="text-muted-foreground mt-1 text-xs">
                状态: {ruler.isComplete ? '完成' : '进行中'}
                {ruler.point1 && ruler.point2 && (
                  <span className="ml-2">点数: 2</span>
                )}
              </div>
            </div>

            <div className="ml-2 flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleVisibility(ruler.id);
                }}
                className="h-8 w-8 p-0"
                title={ruler.lineVisible ? '隐藏测量线' : '显示测量线'}
              >
                {ruler.lineVisible ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteRuler(ruler.id);
                }}
                className="text-destructive hover:text-destructive h-8 w-8 p-0"
                title="删除测量"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Ruler;
