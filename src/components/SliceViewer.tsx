import { useEffect, useRef } from 'react';
import { LPSAxisDir } from '@/types/lps';
import vtkRenderer from '@kitware/vtk.js/Rendering/Core/Renderer';
import vtkRenderWindow from '@kitware/vtk.js/Rendering/Core/RenderWindow';
import vtkOpenGLRenderWindow from '@kitware/vtk.js/Rendering/OpenGL/RenderWindow';
import vtkWidgetManager from '@kitware/vtk.js/Widgets/Core/WidgetManager';
import { useImageStore } from '@/store/image';
import { useDicomStore } from '@/store/dicom';

interface SliceViewerProps {
  id: string;
  type: string;
  viewDirection: LPSAxisDir;
  viewUp: LPSAxisDir;
}

interface SliceViewerContext {
  renderer: vtkRenderer;
  renderWindow: vtkRenderWindow;
  renderWindowView: vtkOpenGLRenderWindow;
  widgetManager: vtkWidgetManager;
}

const SliceViewer: React.FC<SliceViewerProps> = ({
  id,
  type,
  viewDirection,
  viewUp,
}) => {
  console.log('SliceViewer', id, type, viewDirection, viewUp);
  const containerRef = useRef<HTMLDivElement>(null);
  const context = useRef<SliceViewerContext>(null);
  const imageData = useImageStore((state) => state);
  const dicomData = useDicomStore((state) => state);
  console.log('imageData', imageData);
  console.log('dicomData', dicomData);

  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      const { width, height } = container.getBoundingClientRect();
      const renderer = vtkRenderer.newInstance();
      const renderWindow = vtkRenderWindow.newInstance();
      renderWindow.addRenderer(renderer);

      const renderWindowView = vtkOpenGLRenderWindow.newInstance();
      renderWindowView.setContainer(container);
      renderWindow.addView(renderWindowView);

      // const interactor = vtkRenderWindowInteractor.newInstance();
      // renderWindow.setInteractor(interactor);
      // interactor.setView(renderWindowView);
      // interactor.initialize();
      // interactor.setContainer(container);

      const widgetManager = vtkWidgetManager.newInstance();

      const setSize = (width: number, height: number) => {
        const scaledWidth = Math.max(1, width * globalThis.devicePixelRatio);
        const scaledHeight = Math.max(1, height * globalThis.devicePixelRatio);
        renderWindowView.setSize(scaledWidth, scaledHeight);
      };
      setSize(width, height);

      renderWindow.render();

      context.current = {
        renderer,
        renderWindow,
        renderWindowView,
        widgetManager,
      };
    }

    return () => {
      if (context.current) {
        const { renderer, renderWindow, renderWindowView } = context.current;
        renderWindow.removeRenderer(renderer);
        renderer.delete();
        renderWindow.delete();
        renderWindowView.delete();
      }
    };
  }, []);

  return (
    <div className="z-0 grid flex-1 grid-cols-[auto_20px] grid-rows-1">
      <div
        ref={containerRef}
        className="relative z-0 h-full min-h-0 w-full min-w-0 overflow-hidden"
      ></div>
      <div className="flex flex-col bg-black">G</div>
    </div>
  );
};

export default SliceViewer;
