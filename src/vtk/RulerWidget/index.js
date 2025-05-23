import { vec3 } from 'gl-matrix';
import macro from '@kitware/vtk.js/macros';
import vtkAbstractWidgetFactory from '@kitware/vtk.js/Widgets/Core/AbstractWidgetFactory';
import vtkSphereHandleRepresentation from '@kitware/vtk.js/Widgets/Representations/SphereHandleRepresentation';
import vtkPolyLineRepresentation from '@kitware/vtk.js/Widgets/Representations/PolyLineRepresentation';

import vtkTextRepresentation from '../TextRepresentation';
import stateGenerator from './state';
import widgetBehavior from './behavior';

function vtkRulerWidget(publicAPI, model) {
  model.classHierarchy.push('vtkRulerWidget');

  model.methodsToLink = [
    'activeScaleFactor',
    'activeColor',
    'useActiveColor',
    'glyphResolution',
    'defaultScale',
  ];

  publicAPI.getRepresentationsForViewType = (viewType) => {
    switch (viewType) {
      case 'View2D':
      case 'ViewSlice':
        return [
          {
            builder: vtkSphereHandleRepresentation,
            labels: ['handle1', 'handle2'],
            initialValues: {
              /* scaleFactor: 1.5 */
            },
          },
          {
            builder: vtkPolyLineRepresentation,
            labels: ['line'],
            initialValues: {
              /* lineWidth: 2 */
            },
          },
          {
            builder: vtkTextRepresentation,
            labels: ['label'],
            initialValues: {
              /* textStyle: { ... } */
            },
          },
        ];
      default:
        return [
          {
            builder: vtkSphereHandleRepresentation,
            labels: ['handle1', 'handle2'],
          },
          { builder: vtkPolyLineRepresentation, labels: ['line'] },
          { builder: vtkTextRepresentation, labels: ['label'] },
        ];
    }
  };

  // Method to update widget state from external data (e.g., from a store)
  publicAPI.setData = (rulerData) => {
    if (!rulerData || !model.widgetState) {
      publicAPI.resetInternalInteractionState();
      model.rulerId = null;
      return;
    }

    model.rulerId = rulerData.id; // Store the associated ID

    // Update Handle 1
    if (rulerData.point1) {
      model.widgetState.getHandle1().setOrigin(rulerData.point1);
      model.widgetState
        .getHandle1()
        .setVisible(rulerData.handlesVisible !== false);
    } else {
      model.widgetState.getHandle1().setVisible(false);
    }

    // Update Handle 2
    if (rulerData.point2) {
      model.widgetState.getHandle2().setOrigin(rulerData.point2);
      model.widgetState
        .getHandle2()
        .setVisible(rulerData.handlesVisible !== false);
    } else {
      // If only point1 exists and ruler is not complete, handle2 might be visible (during active placement)
      // This depends on how the controlling hook manages visibility during placement.
      // For now, if no point2, it's not visible unless actively being placed (which behavior handles internally)
      model.widgetState
        .getHandle2()
        .setVisible(
          !!(
            rulerData.point1 &&
            !rulerData.isComplete &&
            rulerData.handlesVisible !== false
          ),
        );
    }

    // Update Line
    const lineShouldBeVisible = !!(
      rulerData.point1 &&
      rulerData.point2 &&
      rulerData.lineVisible !== false
    );
    model.widgetState.getLine().setVisible(lineShouldBeVisible);
    if (lineShouldBeVisible) {
      model.widgetState.getLine().setColor(rulerData.color || [1, 1, 0]);
    }

    // Update Label
    const labelShouldBeVisible = !!(
      rulerData.point1 &&
      rulerData.point2 &&
      rulerData.labelVisible !== false
    );
    model.widgetState.getLabel().setVisible(labelShouldBeVisible);
    if (labelShouldBeVisible) {
      model.widgetState
        .getLabel()
        .setText(rulerData.distance ? rulerData.distance.toFixed(2) : '');
      model.widgetState.getLabel().setColor(rulerData.color || [1, 1, 1]);
      const midPoint = vec3.create();
      vec3.add(midPoint, rulerData.point1, rulerData.point2);
      vec3.scale(midPoint, midPoint, 0.5);
      model.widgetState.getLabel().setOrigin(midPoint);
    }

    if (rulerData.isComplete || (rulerData.point1 && rulerData.point2)) {
      model.widgetState.setPointCount(2);
    } else if (rulerData.point1) {
      model.widgetState.setPointCount(1);
    } else {
      model.widgetState.setPointCount(0);
    }
  };

  // Resets the internal interaction state of the widget (e.g., number of points placed)
  // Does not necessarily remove it from a store or change its persistent data.
  publicAPI.resetInternalInteractionState = () => {
    if (model.widgetState) {
      model.widgetState.setPointCount(0);
      // Visibility of actual handles/line/label should be driven by setData based on store state
      // For a true visual reset to "nothing placed for this widget instance":
      model.widgetState.getHandle1()?.setVisible(false);
      model.widgetState.getHandle2()?.setVisible(false);
      model.widgetState.getLine()?.setVisible(false);
      model.widgetState.getLabel()?.setVisible(false);
      model.widgetState.getLabel()?.setText('');
    }
  };

  // Expose rulerId (mainly for debugging or specific scenarios, typically managed by the hook)
  publicAPI.getRulerId = () => model.rulerId;

  // Initial state reset for the widget instance itself
  publicAPI.resetInternalInteractionState();
}

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkAbstractWidgetFactory.extend(publicAPI, model, {
    ...initialValues,
    behavior: widgetBehavior,
    widgetState: stateGenerator(),
  });
  macro.obj(publicAPI, model);

  macro.setGet(publicAPI, model, [
    'manipulator',
    'onPoint1Placed',
    'onPoint2Placed',
    'onHandleMoved',
    'onDrag',
  ]);

  vtkRulerWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkRulerWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
