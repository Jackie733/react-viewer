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
import {
  IPiecewiseFunctionProxyMode,
  PiecewiseGaussian,
  PiecewiseNode,
} from '@kitware/vtk.js/Proxy/Core/PiecewiseFunctionProxy';

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

export interface ColorBy {
  arrayName: string;
  location: string;
}

export interface OpacityGaussians {
  mode: IPiecewiseFunctionProxyMode.Gaussians;
  gaussians: PiecewiseGaussian[];
  mappingRange: [number, number];
}

export interface OpacityPoints {
  mode: IPiecewiseFunctionProxyMode.Points;
  preset: string;
  shift: number;
  shiftAlpha: number;
  mappingRange: [number, number];
}

export interface OpacityNodes {
  mode: IPiecewiseFunctionProxyMode.Nodes;
  nodes: PiecewiseNode[];
  mappingRange: [number, number];
}

export type OpacityFunction = OpacityGaussians | OpacityPoints | OpacityNodes;

export interface ColorTransferFunction {
  preset: string;
  mappingRange: [number, number];
}

export interface CVRConfig {
  enabled: boolean;

  lightFollowsCamera: boolean;
  volumeQuality: number;

  useVolumetricScatteringBlending: boolean;
  volumetricScatteringBlending: number;

  useLocalAmbientOcclusion: boolean;
  laoKernelSize: number;
  laoKernelRadius: number;
  ambient: number;
  diffuse: number;
  specular: number;
}

export interface VolumeColoringConfig {
  colorBy: ColorBy;
  transferFunction: ColorTransferFunction;
  opacityFunction: OpacityFunction;
  cvr: CVRConfig;
}
