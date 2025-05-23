import React, { useEffect } from 'react';
import { ViewContext } from '@/types/views';
import { useRulerManager } from '@/hooks/useRulerManager';
import { useRulerStore } from '@/store/ruler';

interface ToolManagerProps {
  viewContext: ViewContext<'slice'> | null | undefined;
}

/**
 * ToolManager组件 - 在每个SliceViewer中管理工具实例
 * 负责将全局工具状态与特定视图的VTK工具实例进行连接
 */
const ToolManager: React.FC<ToolManagerProps> = ({ viewContext }) => {
  const isRulerToolActive = useRulerStore((state) => state.isRulerToolActive);
  const activeRulerId = useRulerStore((state) => state.activeRulerId);

  const {
    activateRulerTool,
    deactivateRulerTool,
    isRulerToolActive: localRulerActive,
  } = useRulerManager({ viewContext });

  // 当全局ruler工具状态变化时，同步到当前视图的ruler manager
  useEffect(() => {
    if (isRulerToolActive && !localRulerActive) {
      // 全局激活但本地未激活，激活本地
      activateRulerTool();
    } else if (!isRulerToolActive && localRulerActive) {
      // 全局停用但本地仍激活，停用本地
      deactivateRulerTool();
    }
  }, [
    isRulerToolActive,
    localRulerActive,
    activateRulerTool,
    deactivateRulerTool,
  ]);

  // 监听activeRulerId变化，确保只有一个视图处理活动的ruler
  useEffect(() => {
    if (activeRulerId && !isRulerToolActive) {
      // 有活动ruler但全局工具未激活，这通常发生在ruler完成后
      // 本地实例应该停用
      if (localRulerActive) {
        deactivateRulerTool();
      }
    }
  }, [activeRulerId, isRulerToolActive, localRulerActive, deactivateRulerTool]);

  // 这是一个纯功能组件，不渲染任何UI
  return null;
};

export default ToolManager;
