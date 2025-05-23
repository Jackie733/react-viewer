import { useEffect, useRef, useCallback } from 'react';
import { vec3 } from 'gl-matrix';
import { ViewTypes } from '@kitware/vtk.js/Widgets/Core/WidgetManager/Constants';
import vtkMouseCameraTrackballPanManipulator from '@kitware/vtk.js/Interaction/Manipulators/MouseCameraTrackballPanManipulator';
import RulerWidgetFactory, { vtkRulerWidget } from '@/vtk/RulerWidget';
import { useRulerStore, selectRulerById } from '@/store/ruler';
import { ViewContext } from '@/types/views';

interface UseRulerManagerOptions {
  viewContext: ViewContext<'slice'> | null | undefined;
}

export function useRulerManager({ viewContext }: UseRulerManagerOptions) {
  const widgetRef = useRef<vtkRulerWidget | null>(null);
  const widgetManagerRef = useRef<any>(null);

  const activeRulerId = useRulerStore((state) => state.activeRulerId);
  const setActiveRulerId = useRulerStore((state) => state.setActiveRulerId);
  const addRuler = useRulerStore((state) => state.addRuler);
  const updateRulerPoint = useRulerStore((state) => state.updateRulerPoint);
  const completeRulerPlacement = useRulerStore(
    (state) => state.completeRulerPlacement,
  );

  const activeRulerData = useRulerStore(selectRulerById(activeRulerId));

  // Initialize widget manager and widget instance
  useEffect(() => {
    if (viewContext && !widgetManagerRef.current) {
      widgetManagerRef.current = viewContext.widgetManager;
    }

    if (widgetManagerRef.current && !widgetRef.current) {
      const widget = RulerWidgetFactory.newInstance();

      const manipulator = vtkMouseCameraTrackballPanManipulator.newInstance();
      widget.setManipulator(manipulator);

      widgetRef.current = widget;
      // Add to widget manager but don't enable/grabFocus until explicitly activated
      widgetManagerRef.current.addWidget(widget, ViewTypes.SLICE);
    }

    return () => {
      // Cleanup on unmount or viewContext change
      if (widgetRef.current && widgetManagerRef.current) {
        widgetManagerRef.current.removeWidget(widgetRef.current);
        // VTK widgets don't have a delete method - cleanup is handled by widget manager
        widgetRef.current = null;
      }
      // widgetManagerRef.current = null; // Manager might be shared, be careful
    };
  }, [viewContext]);

  // Callbacks for the VTK Widget to update the store
  const handlePoint1Placed = useCallback(
    (rulerId: string, worldCoords: vec3) => {
      if (rulerId === activeRulerId) {
        updateRulerPoint(rulerId, 1, worldCoords);
      }
    },
    [activeRulerId, updateRulerPoint],
  );

  const handlePoint2Placed = useCallback(
    (rulerId: string, worldCoords: vec3) => {
      if (rulerId === activeRulerId) {
        completeRulerPlacement(rulerId, worldCoords);
        // After completion, the widget manager should release focus if it had it
        widgetManagerRef.current?.releaseFocus();
        setActiveRulerId(null); // Deactivate ruler tool in store
      }
    },
    [activeRulerId, completeRulerPlacement, setActiveRulerId],
  );

  const handleDrag = useCallback(
    (rulerId: string, handleId: 1 | 2, worldCoords: vec3) => {
      // For live update of point2 while dragging before placement
      if (
        rulerId === activeRulerId &&
        handleId === 2 &&
        activeRulerData &&
        !activeRulerData.isComplete
      ) {
        updateRulerPoint(rulerId, 2, worldCoords);
      }
    },
    [activeRulerId, updateRulerPoint, activeRulerData],
  );

  const handleHandleMoved = useCallback(
    (rulerId: string, handleId: 1 | 2, worldCoords: vec3) => {
      // For updating points after an existing ruler's handle is moved
      if (rulerId && activeRulerData && activeRulerData.isComplete) {
        // Check if it is an existing complete ruler
        updateRulerPoint(rulerId, handleId, worldCoords);
      }
    },
    [updateRulerPoint, activeRulerData], // activeRulerId might not be needed if we get rulerId from event
  );

  // Control functions for the MeasurementTools component
  const activateRulerTool = useCallback(() => {
    if (!activeRulerId) {
      // 创建新的ruler并激活
      const newRulerId = addRuler();
      setActiveRulerId(newRulerId);
    }
    // 不在这里设置全局状态，由ToolManager负责
  }, [activeRulerId, addRuler, setActiveRulerId]);

  const deactivateRulerTool = useCallback(() => {
    if (activeRulerId) {
      setActiveRulerId(null);
      // Release focus if widget has it
      if (widgetManagerRef.current) {
        widgetManagerRef.current.releaseFocus();
        widgetManagerRef.current.disablePicking();
      }
    }
    // 不在这里设置全局状态，由ToolManager负责
  }, [activeRulerId, setActiveRulerId]);

  const isRulerToolActive = !!activeRulerId;

  // Effect to configure and activate/deactivate the widget based on activeRulerId
  useEffect(() => {
    const widget = widgetRef.current;
    const manager = widgetManagerRef.current;

    if (widget && manager) {
      if (activeRulerId && activeRulerData) {
        // Configure widget with callbacks and current ruler ID
        widget.setOnPoint1Placed(handlePoint1Placed);
        widget.setOnPoint2Placed(handlePoint2Placed);
        widget.setOnDrag(handleDrag); // For live feedback of P2 during placement
        widget.setOnHandleMoved(handleHandleMoved); // For when existing handles are moved

        widget.setData(activeRulerData); // Sync widget visual state with store data

        if (!activeRulerData.isComplete) {
          // This is a new or incomplete ruler, prepare for interaction
          widget.resetInternalInteractionState(); // Ensure pointCount is 0 for new interaction
          manager.grabFocus(widget);
          manager.enablePicking();
        } else {
          // Ruler is complete, just display it, no grabFocus unless selected for editing
          manager.disablePicking(); // Or ensure picking is only for active widget
        }
      } else {
        // No active ruler, or active ruler data not found
        widget.setData(null); // Clear widget visuals
        if (manager.getActiveWidget?.() === widget) {
          manager.releaseFocus();
        }
        manager.disablePicking();
      }
      // viewContext?.requestRender();
    }
  }, [
    activeRulerId,
    activeRulerData,
    viewContext,
    handlePoint1Placed,
    handlePoint2Placed,
    handleDrag,
    handleHandleMoved,
  ]);

  // Effect to update widget visuals when activeRulerData changes from store (e.g. color change)
  useEffect(() => {
    const widget = widgetRef.current;
    if (widget && activeRulerId && activeRulerData) {
      widget.setData(activeRulerData);
      viewContext?.requestRender();
    }
  }, [activeRulerData, viewContext, activeRulerId]);

  // Need to also handle displaying *all* non-active, completed rulers.
  // This current hook focuses on managing the *active* ruler widget for interaction.
  // A separate mechanism would be needed to render all rulers from the store.
  // For simplicity, this example primarily makes the *activeRulerId* visible and interactive.

  return {
    activateRulerTool,
    deactivateRulerTool,
    isRulerToolActive,
  };
}
