import { Upload, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { fileToDataSource } from '@/io/import/dataSource';
import { loadDataSources } from '@/core/loadFiles';
import { useLoadDataStore } from '@/store/load-data';
import { useImageStore } from '@/store/image';

export function FileLoader() {
  const isLoading = useLoadDataStore((state) => state.isLoading);
  const hasData = useImageStore((state) => state.currentImage !== null);

  function openFileDialog() {
    return new Promise<File[]>((resolve) => {
      const fileEl = document.createElement('input');
      fileEl.setAttribute('type', 'file');
      fileEl.setAttribute('multiple', 'multiple');
      fileEl.setAttribute('accept', '*');
      fileEl.addEventListener('change', () => {
        const files = [...(fileEl.files ?? [])];
        resolve(files);
      });
      fileEl.click();
    });
  }

  async function handleFiles(files: File[]) {
    const dataSources = files.map((file) => fileToDataSource(file));
    loadDataSources(dataSources);
  }

  return (
    <div className="flex items-center">
      {!hasData && (
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          disabled={isLoading}
          onClick={() => {
            openFileDialog().then((files) => {
              handleFiles(files);
            });
          }}
        >
          {isLoading ? <Loader2 className="animate-spin" /> : <Upload />}
        </Button>
      )}
    </div>
  );
}
