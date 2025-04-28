import Layout from './layout';
import { ThemeProvider } from '@/components/theme-provider';
import SliceViewer from './components/SliceViewer';
import { useDicomStore } from './store/dicom';

function App() {
  const hasData = useDicomStore((state) => state.volumeInfo !== null);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Layout>
        {hasData && (
          <div className="flex h-full flex-1">
            <div className="flex h-full flex-1 flex-col">
              <SliceViewer
                id="Axial"
                type="2D"
                viewDirection="Superior"
                viewUp="Anterior"
              />
            </div>
            <div className="flex h-full flex-1 flex-col">
              <SliceViewer
                id="Coronal"
                type="2D"
                viewDirection="Posterior"
                viewUp="Superior"
              />
              <SliceViewer
                id="Sagittal"
                type="2D"
                viewDirection="Right"
                viewUp="Superior"
              />
            </div>
          </div>
        )}
      </Layout>
    </ThemeProvider>
  );
}

export default App;
