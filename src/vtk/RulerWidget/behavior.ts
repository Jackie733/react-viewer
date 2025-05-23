import macro from '@kitware/vtk.js/macros';

export default function widgetBehavior(publicAPI: any, model: any) {
  model.classHierarchy.push('vtkRulerWidgetBehavior');

  publicAPI.handleLeftButtonPress = (callData: any) => {
    const manipulator =
      model.activeState?.getManipulator?.() || model.manipulator;
    if (!manipulator) return macro.VOID;

    const { worldCoords } = manipulator.handleEvent(
      callData,
      publicAPI._apiSpecificRenderWindow,
    );
    if (!worldCoords) return macro.VOID;

    if (model.widgetState.getPointCount() === 0) {
      // Placing the first point
      model.widgetState.getHandle1().setOrigin(worldCoords);
      model.widgetState.getHandle1().setVisible(true);
      // Temporarily place handle2 at the same spot for visual feedback during mouse move
      model.widgetState.getHandle2().setOrigin(worldCoords);
      model.widgetState.getHandle2().setVisible(true);
      model.widgetState.getLine().setVisible(true);
      // Label visibility and text will be controlled by external data via widget.setData()

      model.widgetState.setPointCount(1);
      publicAPI.invokeStartInteractionEvent();
      model.onPoint1Placed?.(model.rulerId, worldCoords);
      return macro.EVENT_ABORT;
    } else if (model.widgetState.getPointCount() === 1) {
      // Placing the second point
      model.widgetState.getHandle2().setOrigin(worldCoords);
      // Final state of points for this interaction cycle is now set internally
      model.widgetState.setPointCount(2);
      publicAPI.invokeEndInteractionEvent();
      model.onPoint2Placed?.(model.rulerId, worldCoords);
      return macro.EVENT_ABORT;
    }

    // If clicking on an existing handle (pointCount is 2)
    // The `activeState` should be the handle itself. The manipulator will handle its movement.
    // We just need to notify about the start of this interaction.
    if (model.activeState && model.activeState.getManipulator) {
      publicAPI.invokeStartInteractionEvent();
      return macro.EVENT_ABORT; // Consume event, manipulator will take over
    }

    return macro.VOID;
  };

  publicAPI.handleMouseMove = (callData: any) => {
    const manipulator =
      model.activeState?.getManipulator?.() || model.manipulator;
    if (!manipulator) return macro.VOID;

    const { worldCoords } = manipulator.handleEvent(
      callData,
      publicAPI._apiSpecificRenderWindow,
    );
    if (!worldCoords) return macro.VOID;

    if (model.widgetState.getPointCount() === 1) {
      // Moving the second point before it's placed (visual feedback)
      model.widgetState.getHandle2().setOrigin(worldCoords);
      publicAPI.invokeInteractionEvent();
      model.onDrag?.(model.rulerId, 2, worldCoords); // Notify for intermediate drag of point 2
      return macro.EVENT_ABORT;
    }

    // If dragging an existing handle (activeState is a handle, and pointCount is 2)
    if (
      model.activeState &&
      model.activeState.getManipulator &&
      model.widgetState.getPointCount() === 2
    ) {
      // Manipulator should have updated the activeState's origin (the handle's position)
      const handleName = model.activeState.getName(); // 'handle1' or 'handle2'
      const handleId = handleName === 'handle1' ? 1 : 2;
      // worldCoords here is the current mouse position, activeState.getOrigin() is the updated handle pos
      const currentHandlePos = model.activeState.getOrigin();
      model.onHandleMoved?.(model.rulerId, handleId, currentHandlePos);
      publicAPI.invokeInteractionEvent();
      return macro.EVENT_ABORT;
    }
    return macro.VOID;
  };

  publicAPI.handleLeftButtonRelease = () => {
    if (model.widgetState.getPointCount() === 2 && model.activeState) {
      // This event fires after dragging an existing handle or after placing the second point by dragging.
      // If it was a drag of an existing handle, notify its final position.
      if (
        model.activeState.getName &&
        (model.activeState.getName() === 'handle1' ||
          model.activeState.getName() === 'handle2')
      ) {
        const handleName = model.activeState.getName();
        const handleId = handleName === 'handle1' ? 1 : 2;
        const finalHandlePos = model.activeState.getOrigin();
        model.onHandleMoved?.(model.rulerId, handleId, finalHandlePos); // Ensure final position is sent
      }
      publicAPI.invokeEndInteractionEvent();
      return macro.EVENT_ABORT;
    }
    return macro.VOID;
  };

  publicAPI.grabFocus = () => {
    model.hasFocus = true;
    // Reset pointCount to 0 when widget gets focus to start a new measurement?
    // Or should this be managed by the controlling Hook/Component?
    // For now, let external logic call resetInternalState() if needed before grabFocus.
  };

  publicAPI.loseFocus = () => {
    model.hasFocus = false;
    // Consider resetting pointCount if focus is lost mid-placement?
    // model.widgetState.setPointCount(0);
    // This depends on desired UX.
  };
}
