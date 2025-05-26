import Layout from '@/layout';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/ThemeProvider';
import SliceViewer from '@/components/SliceViewer';
import VolumeViewer from '@/components/VolumeViewer';
import DicomControls from '@/components/DicomControls';
import { useLoadDataStore } from './store/load-data';
import { useImageStore } from './store/image';
import { useViewStore } from './store/view';
import { LayoutView } from './types/layout';

function App() {
  const hasData = useImageStore((state) => state.currentImage !== null);
  const isLoading = useLoadDataStore((state) => state.isLoading);
  const currentLayout = useViewStore((state) => state.layout);
  const controlsExpanded = useViewStore((state) => state.controlsExpanded);

  const renderView = (view: LayoutView) => {
    const viewKey = `${view.id}`;

    if (view.type === '2D') {
      return (
        <SliceViewer
          key={viewKey}
          id={view.id}
          type={view.type}
          viewDirection={view.viewDirection}
          viewUp={view.viewUp}
        />
      );
    } else if (view.type === '3D') {
      return <VolumeViewer key={viewKey} />;
    }
    return null;
  };

  const renderViewGrid = () => {
    const { views } = currentLayout;

    if (views.length === 1 && views[0].length === 1) {
      return (
        <div className="h-full w-full p-0.5">{renderView(views[0][0])}</div>
      );
    }

    if (views.length === 2 && views[0].length === 1 && views[1].length === 2) {
      return (
        <>
          <div className="flex h-2/3 w-full">
            <div className="h-full w-full rounded-lg p-0.5">
              {renderView(views[0][0])}
            </div>
          </div>
          <div className="flex h-1/3 w-full">
            <div className="h-full w-1/2 rounded-lg p-0.5">
              {renderView(views[1][0])}
            </div>
            <div className="h-full w-1/2 rounded-lg p-0.5">
              {renderView(views[1][1])}
            </div>
          </div>
        </>
      );
    }

    if (views.length === 2 && views[0].length === 2 && views[1].length === 2) {
      return (
        <>
          <div className="flex h-1/2 w-full">
            <div className="h-full w-1/2 rounded-lg p-0.5">
              {renderView(views[0][0])}
            </div>
            <div className="h-full w-1/2 rounded-lg p-0.5">
              {renderView(views[0][1])}
            </div>
          </div>
          <div className="flex h-1/2 w-full">
            <div className="h-full w-1/2 rounded-lg p-0.5">
              {renderView(views[1][0])}
            </div>
            <div className="h-full w-1/2 rounded-lg p-0.5">
              {renderView(views[1][1])}
            </div>
          </div>
        </>
      );
    }

    return views.map((row, rowIndex) => (
      <div
        key={rowIndex}
        className={`flex h-${Math.floor(1 / views.length)} w-full`}
      >
        {row.map((view, colIndex) => (
          <div
            key={colIndex}
            className={`h-full w-${Math.floor(1 / row.length)} rounded-lg p-0.5`}
          >
            {renderView(view)}
          </div>
        ))}
      </div>
    ));
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Layout>
        {isLoading && (
          <div className="flex h-full w-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
            <div className="ml-3 text-lg font-medium text-gray-900 dark:text-white">
              Loading...
            </div>
          </div>
        )}
        {hasData && !isLoading && (
          <div className="flex h-full w-full flex-col overflow-hidden">
            <div className="flex flex-1 overflow-hidden">
              <div
                className={`flex flex-1 flex-col overflow-hidden bg-gray-900 p-0.5 transition-all duration-300 ease-in-out ${controlsExpanded ? 'w-[calc(100%-25%)]' : 'w-full'}`}
              >
                {renderViewGrid()}
              </div>

              <div
                className={`border-l border-gray-700 transition-all duration-300 ease-in-out ${controlsExpanded ? 'w-[20rem]' : 'w-auto'}`}
              >
                <DicomControls />
              </div>
            </div>
          </div>
        )}
      </Layout>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
