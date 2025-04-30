import { useState } from 'react';
import Layout from '@/layout';
import { ThemeProvider } from '@/components/ThemeProvider';
import SliceViewer from '@/components/SliceViewer';
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
        {isLoading && <div>Loading...</div>}
        {hasData && !isLoading && (
          <div className="flex h-full w-full flex-col overflow-hidden">
            <div className="flex flex-1 overflow-hidden">
              <div
                className={`flex flex-1 overflow-hidden bg-gray-900 p-0.5 transition-all duration-300 ease-in-out ${controlsExpanded ? 'w-[calc(100%-25%)]' : 'w-full'}`}
              >
                <div className="flex h-full w-1/2 rounded-lg p-0.5">
                  <SliceViewer
                    id="Axial"
                    type="2D"
                    viewDirection="Superior"
                    viewUp="Anterior"
                  />
                </div>

                <div className="flex h-full w-1/2 flex-col">
                  <div className="h-1/2 rounded-lg p-0.5">
                    <SliceViewer
                      id="Coronal"
                      type="2D"
                      viewDirection="Posterior"
                      viewUp="Superior"
                    />
                  </div>

                  <div className="h-1/2 rounded-lg p-0.5">
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
    </ThemeProvider>
  );
}

export default App;
