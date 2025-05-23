import { vec3 } from 'gl-matrix';
import { Vector2, Vector3 } from '@kitware/vtk.js/types';
import vtkBoundingBox from '@kitware/vtk.js/Common/DataModel/BoundingBox';
import vtkCamera from '@kitware/vtk.js/Rendering/Core/Camera';
import { ImageMetadata } from '@/types/image';
import { LPSAxisDir } from '@/types/lps';
import { ViewContext } from '@/types/views';
import { getLPSAxisFromDir, getLPSDirections } from './lps';

function eyeFrameDimIndices(lookAxis: 0 | 1 | 2, eyeUpAxis: 0 | 1 | 2) {
  if (lookAxis === 0 && eyeUpAxis === 1) return [2, 1] as Vector2;
  if (lookAxis === 0 && eyeUpAxis === 2) return [1, 2] as Vector2;
  if (lookAxis === 1 && eyeUpAxis === 0) return [2, 0] as Vector2;
  if (lookAxis === 1 && eyeUpAxis === 2) return [0, 2] as Vector2;
  if (lookAxis === 2 && eyeUpAxis === 0) return [1, 0] as Vector2;
  if (lookAxis === 2 && eyeUpAxis === 1) return [0, 1] as Vector2;
  throw new Error(`Invalid lookAxis and eyeUpAxis: ${lookAxis}, ${eyeUpAxis}`);
}

function computeParallelScale(
  lookAxis: 0 | 1 | 2,
  viewUpAxis: 0 | 1 | 2,
  dimensions: Vector3 | vec3,
  viewSize: Vector2,
) {
  const [widthIndex, heightIndex] = eyeFrameDimIndices(lookAxis, viewUpAxis);
  const width = dimensions[widthIndex];
  const height = dimensions[heightIndex];
  const dimAspect = width / height;

  const [viewWidth, viewHeight] = viewSize;
  const viewAspect = viewWidth / viewHeight;

  const scale = dimAspect > viewAspect ? width / 2 / viewAspect : height / 2;

  return scale;
}

export function resizeToFit(
  view: ViewContext<'slice'>,
  lookAxis: 0 | 1 | 2,
  upAxis: 0 | 1 | 2,
  dimensions: Vector3 | vec3,
) {
  const camera = view.renderer.getActiveCamera();
  camera.setParallelScale(
    computeParallelScale(
      lookAxis,
      upAxis,
      dimensions,
      view.renderWindowView.getSize(),
    ),
  );
}

export function positionCamera(
  camera: vtkCamera,
  directionOfProjection: Vector3,
  viewUp: Vector3,
  focalPoint: Vector3,
) {
  const position = vec3.clone(focalPoint) as Vector3;
  vec3.sub(position, position, directionOfProjection);
  camera.setFocalPoint(...focalPoint);
  camera.setPosition(...position);
  camera.setDirectionOfProjection(...directionOfProjection);
  camera.setViewUp(...viewUp);
}

export function resetCameraToImage(
  view: ViewContext<'slice'>,
  metadata: ImageMetadata,
  viewDirection: LPSAxisDir,
  viewUp: LPSAxisDir,
) {
  const { worldBounds, orientation } = metadata;
  const lpsDirections = getLPSDirections(orientation);

  const center = vtkBoundingBox.getCenter(worldBounds);
  const camera = view.renderer.getActiveCamera();

  const directionOfProjection = lpsDirections[viewDirection] as Vector3;
  const cameraViewUp = lpsDirections[viewUp] as Vector3;
  positionCamera(camera, directionOfProjection, cameraViewUp, center);

  view.renderer.resetCamera(worldBounds);
  view.requestRender();
}

export function resizeToFitImage(
  view: ViewContext<'slice'>,
  metadata: ImageMetadata,
  viewDirection: LPSAxisDir,
  viewUp: LPSAxisDir,
) {
  const { lpsOrientation, dimensions, spacing } = metadata;
  const viewDirAxis = getLPSAxisFromDir(viewDirection);
  const viewUpAxis = getLPSAxisFromDir(viewUp);
  const lookAxis = lpsOrientation[viewDirAxis];
  const upAxis = lpsOrientation[viewUpAxis];
  const dimsWithSpacing: Vector3 = [
    dimensions[0] * spacing[0],
    dimensions[1] * spacing[1],
    dimensions[2] * spacing[2],
  ];

  resizeToFit(view, lookAxis, upAxis, dimsWithSpacing);
  view.requestRender();
}
