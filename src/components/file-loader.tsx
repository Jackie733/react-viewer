import { useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { fileToDataSource } from '@/io/import/dataSource';
import {
  importDataSources,
  ImportDataSourcesResult,
} from '@/io/import/importDataSources';

export function FileLoader() {
  const [loading, setLoading] = useState(false);

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
    console.log('FILES:', files);

    const dataSources = files.map((file) => fileToDataSource(file));
    console.log('DATA SOURCES:', dataSources);

    let results: ImportDataSourcesResult[];
    try {
      results = await importDataSources(dataSources);
    } catch (error) {
      console.error('Error importing files:', error);
      return;
    }
    console.log('RESULTS:', results);
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
        {loading ? <Loader2 className="animate-spin" /> : <Upload />}
      </Button>
    </div>
  );
}
