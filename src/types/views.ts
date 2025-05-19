import vtkRenderWindow from '@kitware/vtk.js/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from '@kitware/vtk.js/Rendering/Core/RenderWindowInteractor';
import vtkInteractorStyleManipulator from '@kitware/vtk.js/Interaction/Style/InteractorStyleManipulator';
import vtkImageMapper from '@kitware/vtk.js/Rendering/Core/ImageMapper';
import vtkImageSlice from '@kitware/vtk.js/Rendering/Core/ImageSlice';
import vtkVolume from '@kitware/vtk.js/Rendering/Core/Volume';
import vtkVolumeMapper from '@kitware/vtk.js/Rendering/Core/VolumeMapper';
import vtkWidgetManager from '@kitware/vtk.js/Widgets/Core/WidgetManager';
import vtkOpenGLRenderWindow from '@kitware/vtk.js/Rendering/OpenGL/RenderWindow';
import vtkRenderer from '@kitware/vtk.js/Rendering/Core/Renderer';

export interface ViewContext<T extends 'slice' | 'volume'> {
  renderer: vtkRenderer;
  renderWindow: vtkRenderWindow;
  renderWindowView: vtkOpenGLRenderWindow;
  widgetManager: vtkWidgetManager;
  interactor: vtkRenderWindowInteractor;
  interactorStyle: vtkInteractorStyleManipulator;
  actor: T extends 'slice' ? vtkImageSlice : vtkVolume;
  mapper: T extends 'slice' ? vtkImageMapper : vtkVolumeMapper;
  requestRender: () => void;
}
