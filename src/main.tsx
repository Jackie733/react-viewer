import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { setPipelinesBaseUrl, setPipelineWorkerUrl } from 'itk-wasm';
import { setPipelinesBaseUrl as imageIoSetPipelinesBaseUrl } from '@itk-wasm/image-io';
import App from './App.tsx';
import { initItkWorker } from '@/io/itk/worker.ts';
import { registerAllReaders } from '@/io/readers.ts';
import { FILE_READERS } from '@/io/index.ts';
import itkConfig from '@/io/itk/itkConfig';
import './index.css';

initItkWorker();

registerAllReaders(FILE_READERS);

// Must be set at runtime as new version of @itk-wasm/dicom and @itk-wasm/image-io
// do not pickup build time `../itkConfig` alias remap.
setPipelinesBaseUrl(itkConfig.pipelinesUrl);
setPipelineWorkerUrl(itkConfig.pipelineWorkerUrl);
imageIoSetPipelinesBaseUrl(itkConfig.imageIOUrl);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
