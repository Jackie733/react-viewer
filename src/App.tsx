import { ThemeProvider } from '@/components/theme-provider';
import Layout from './layout';
import { useImageStore } from './store/image';
import { useDicomStore } from './store/dicom';
import SliceViewer from './components/slice-viewer';

function App() {
  const idList = useImageStore((state) => state.idList);
  const volumeInfo = useDicomStore((state) => state.volumeInfo);
  const hasData = idList.length > 0 || Object.keys(volumeInfo).length > 0;
  console.log('HAS DATA:', hasData);

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
