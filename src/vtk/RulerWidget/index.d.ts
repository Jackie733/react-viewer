import { vtkAbstractWidgetFactory } from '@kitware/vtk.js/Widgets/Core/AbstractWidgetFactory';
import { vec3 } from 'gl-matrix';
import { RulerData } from '@/store/ruler';

export type RulerWidgetCallback = (rulerId: string, worldCoords: vec3) => void;
export type RulerHandleMovedCallback = (
  rulerId: string,
  handleId: 1 | 2,
  worldCoords: vec3,
) => void;

/**
 * Method use to decorate a given object (publicAPI+model) with vtkRulerWidget characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param initialValues (default: {}) Must be an object defining initial property values for this widget
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: Record<string, any>,
): void;

/**
 * Method use to create a new instance of vtkRulerWidget
 * @param initialValues (default: {}) Must be an object defining initial property values for this widget
 */
export function newInstance(
  initialValues?: Record<string, any>,
): vtkRulerWidget;

/**
 * vtkRulerWidget is a widget for measuring distances in a scene.
 * It is designed to be controlled by an external state management system (e.g., a Zustand store).
 */
export interface vtkRulerWidget extends vtkAbstractWidgetFactory {
  /**
   * Sets the data for the ruler widget, typically from an external store.
   * This method updates the widget's visual representation based on the provided data.
   * @param {RulerData | null} rulerData The ruler data object, or null to effectively hide/reset the widget for this data.
   */
  setData(rulerData: RulerData | null): void;

  /**
   * Resets the internal interaction state of the widget (e.g., pointCount).
   * This is typically used when preparing the widget for a new interaction sequence for the same rulerId,
   * or when the widget is being disassociated from any active ruler data.
   */
  resetInternalInteractionState(): void;

  /**
   * Gets the ruler ID currently associated with this widget instance.
   * @returns {string | null} The ruler ID.
   */
  getRulerId(): string | null;

  /**
   * Set the manipulator for the widget.
   * @param {any} manipulator
   */
  setManipulator(manipulator: any): boolean;

  /**
   * Get the manipulator for the widget.
   * @returns {any}
   */
  getManipulator(): any;

  // Callbacks
  setOnPoint1Placed(callback: RulerWidgetCallback | null): boolean;
  getOnPoint1Placed(): RulerWidgetCallback | null;

  setOnPoint2Placed(callback: RulerWidgetCallback | null): boolean;
  getOnPoint2Placed(): RulerWidgetCallback | null;

  setOnHandleMoved(callback: RulerHandleMovedCallback | null): boolean;
  getOnHandleMoved(): RulerHandleMovedCallback | null;

  setOnDrag(callback: RulerHandleMovedCallback | null): boolean; // (handleId for onDrag refers to the point being dragged, e.g. point2)
  getOnDrag(): RulerHandleMovedCallback | null;
}

declare const vtkRulerWidget: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkRulerWidget;
