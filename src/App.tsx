import { useState } from 'react';
import Layout from '@/layout';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/ThemeProvider';
import SliceViewer from '@/components/SliceViewer';
import VolumeViewer from '@/components/VolumeViewer';
import DicomControls from '@/components/DicomControls';
import { useLoadDataStore } from './store/load-data';
import { useImageStore } from './store/image';

function App() {
  const hasData = useImageStore((state) => state.currentImage !== null);
  const isLoading = useLoadDataStore((state) => state.isLoading);

  const [controlsExpanded, setControlsExpanded] = useState(false);

  const handleExpandToggle = (isExpanded: boolean) => {
    setControlsExpanded(isExpanded);
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
                <div className="flex h-1/2 w-full">
                  <div className="h-full w-1/2 rounded-lg p-0.5">
                    <SliceViewer
                      id="Axial"
                      type="2D"
                      viewDirection="Superior"
                      viewUp="Anterior"
                    />
                  </div>
                  <div className="h-full w-1/2 rounded-lg p-0.5">
                    <VolumeViewer />
                  </div>
                </div>
                <div className="flex h-1/2 w-full">
                  <div className="h-full w-1/2 rounded-lg p-0.5">
                    <SliceViewer
                      id="Coronal"
                      type="2D"
                      viewDirection="Posterior"
                      viewUp="Superior"
                    />
                  </div>
                  <div className="h-full w-1/2 rounded-lg p-0.5">
                    <SliceViewer
                      id="Sagittal"
                      type="2D"
                      viewDirection="Right"
                      viewUp="Superior"
                    />
                  </div>
                </div>
              </div>

              <div
                className={`border-l border-gray-700 transition-all duration-300 ease-in-out ${controlsExpanded ? 'w-1/4' : 'w-auto'}`}
              >
                <DicomControls onExpandToggle={handleExpandToggle} />
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
