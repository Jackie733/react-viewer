import { useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

export function FileLoader() {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

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

  return (
    <div className="flex items-center">
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        onClick={() => {
          setLoading(true);
          openFileDialog().then((files) => {
            setFile(files[0]);
            setLoading(false);
          });
        }}
      >
        {loading ? <Loader2 className="animate-spin" /> : <Upload />}
      </Button>
    </div>
  );
}
