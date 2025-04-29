import { Upload, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { fileToDataSource } from '@/io/import/dataSource';
import { loadDataSources } from '@/core/loadFiles';
import { useLoadDataStore } from '@/store/load-data';

export function FileLoader() {
  const isLoading = useLoadDataStore((state) => state.isLoading);

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
    console.log('DATA SOURCES:', dataSources);
    loadDataSources(dataSources);
  }

  return (
    <div className="flex items-center">
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        onClick={() => {
          openFileDialog().then((files) => {
            handleFiles(files);
          });
        }}
      >
        {isLoading ? <Loader2 className="animate-spin" /> : <Upload />}
      </Button>
    </div>
  );
}
