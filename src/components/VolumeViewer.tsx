import React, { useRef, useEffect, useState } from 'react';
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction';
import { useImageStore } from '@/store/image';
import { useVtkView } from '@/hooks/useVtkView';
import vtkVolumeMapper from '@kitware/vtk.js/Rendering/Core/VolumeMapper';
import vtkImageData from '@kitware/vtk.js/Common/DataModel/ImageData';
import vtkInteractorStyleTrackballCamera from '@kitware/vtk.js/Interaction/Style/InteractorStyleTrackballCamera';

const VolumeViewer: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const vtkContainerRef = useRef<HTMLDivElement>(null);

  const currentImage = useImageStore((state) => state.currentImage);
  const [containerReady, setContainerReady] = useState(false);

  const viewContext = useVtkView(
    containerReady ? vtkContainerRef.current : null,
    'volume',
  );

  useEffect(() => {
    if (vtkContainerRef.current) {
      setContainerReady(true);
    }
    return () => {
      setContainerReady(false);
    };
  }, []);

  useEffect(() => {
    if (!viewContext) return;

    const { interactor } = viewContext;
    interactor.setInteractorStyle(
      vtkInteractorStyleTrackballCamera.newInstance(),
    );

    return () => {
      interactor.setInteractorStyle(null);
    };
  }, [viewContext]);

  useEffect(() => {
    if (!viewContext || !currentImage) {
      return;
    }

    const { renderer, actor, mapper, requestRender } = viewContext;

    renderer.setBackground(0, 0, 0);

    const camera = renderer.getActiveCamera();
    if (camera) {
      camera.setParallelProjection(true);
    }

    mapper.setInputData(currentImage);
    setSamplingDistance(mapper, currentImage, 0.3);

    actor.setMapper(mapper);

    const volumeProperty = actor.getProperty();

    const scalars = currentImage.getPointData().getScalars();
    const scalarRange = scalars.getRange();

    const ctf = vtkColorTransferFunction.newInstance();
    ctf.addRGBPoint(scalarRange[0], 0.0, 0.0, 0.0);
    ctf.addRGBPoint((scalarRange[0] + scalarRange[1]) / 2, 0.7, 0.7, 0.7);
    ctf.addRGBPoint(scalarRange[1], 1.0, 1.0, 1.0);

    const ofun = vtkPiecewiseFunction.newInstance();
    ofun.addPoint(scalarRange[0], 0.0);
    ofun.addPoint(
      scalarRange[0] + (scalarRange[1] - scalarRange[0]) * 0.1,
      0.0,
    );
    ofun.addPoint(
      scalarRange[0] + (scalarRange[1] - scalarRange[0]) * 0.3,
      0.15,
    );
    ofun.addPoint(
      scalarRange[0] + (scalarRange[1] - scalarRange[0]) * 0.6,
      0.5,
    );
    ofun.addPoint(scalarRange[1], 0.85);
    volumeProperty.setRGBTransferFunction(0, ctf);
    volumeProperty.setScalarOpacity(0, ofun);

    actor.setProperty(volumeProperty);

    renderer.addVolume(actor);

    if (camera) {
      renderer.resetCamera(actor.getBounds());
      renderer.resetCameraClippingRange();
    }

    requestRender();

    return () => {
      renderer.removeVolume(actor);
      ctf.delete();
      ofun.delete();
    };
  }, [viewContext, currentImage]);

  const setSamplingDistance = (
    mapper: vtkVolumeMapper,
    imageData: vtkImageData,
    distance: number,
  ) => {
    const sampleDistance =
      0.7 *
      Math.sqrt(
        imageData
          .getSpacing()
          .map((v) => v * v)
          .reduce((a, b) => a + b, 0),
      );
    mapper.setSampleDistance(sampleDistance * 2 ** (distance * 3.0 - 1.5));
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  const getBorderColorClass = () =>
    isHovered ? 'border-gray-400' : 'border-gray-700';

  return (
    <div
      className={`flex h-full w-full flex-col border-2 ${getBorderColorClass()} rounded-lg transition-colors duration-150`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={vtkContainerRef}
        className="inset-0 z-0 h-full w-full overflow-hidden rounded-lg"
      />
    </div>
  );
};

export default VolumeViewer;
