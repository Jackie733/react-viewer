import vtkStateBuilder from '@kitware/vtk.js/Widgets/Core/StateBuilder';

export default function stateGenerator() {
  return (
    vtkStateBuilder
      .createBuilder()
      // Handle 1: The first point of the ruler
      .addStateFromMixin({
        labels: ['handle1'],
        mixins: ['origin', 'color', 'scale1', 'visible', 'manipulator'],
        name: 'handle1',
        initialValues: {
          scale1: 20, // Default size of the handle
          visible: true,
          color: [0, 1, 0], // Green
        },
      })
      // Handle 2: The second point of the ruler
      .addStateFromMixin({
        labels: ['handle2'],
        mixins: ['origin', 'color', 'scale1', 'visible', 'manipulator'],
        name: 'handle2',
        initialValues: {
          scale1: 20,
          visible: true,
          color: [0, 1, 0], // Green
        },
      })
      // Line connecting the two handles
      .addStateFromMixin({
        labels: ['line'],
        mixins: ['color', 'visible'], // 'tubing' for 3D line thickness
        name: 'line',
        initialValues: {
          visible: true,
          color: [1, 1, 0], // Yellow
          tubing: true, // Enable tubing to control line thickness easily
        },
      })
      // Text label for displaying the distance
      .addStateFromMixin({
        labels: ['label'],
        mixins: ['text', 'origin', 'color', 'visible'],
        name: 'label',
        initialValues: {
          text: '0.00',
          visible: true,
          color: [1, 1, 1], // White
        },
      })
      // Widget-level state, e.g., for activation or number of points placed
      .addField({
        name: 'pointCount',
        initialValue: 0, // 0: no points, 1: first point placed, 2: second point placed (ruler complete)
      })
      .build()
  );
}
