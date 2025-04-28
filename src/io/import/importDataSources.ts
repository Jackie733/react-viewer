import { DataSource, DataSourceWithFile } from '@/io/import/dataSource';
import Pipeline, {
  PipelineResult,
  PipelineResultSuccess,
} from '@/core/pipeline';
import updateFileMimeType from '@/io/import/processors/updateFileMimeType';
import importSingleFile from '@/io/import/processors/importSingleFile';
import extractArchive from '@/io/import/processors/extractArchive';
import handleDicomFile from '@/io/import/processors/handleDicomFile';
import {
  ImportHandler,
  isLoadableResult,
  LoadableResult,
  ImportResult,
} from '@/io/import/common';
import { importService } from '@/services/importService';

const unhandledResource: ImportHandler = () => {
  throw new Error('Failed to handle resource');
};

function isSelectable(
  result: PipelineResult<DataSource, ImportResult>,
): result is PipelineResultSuccess<LoadableResult> {
  if (!result.ok) return false;

  if (result.data.length === 0) {
    return false;
  }

  const importResult = result.data[0];
  if (!isLoadableResult(importResult)) {
    return false;
  }

  return true;
}

const importDicomFiles = async (
  dicomDataSources: Array<DataSourceWithFile>,
) => {
  return importService.loadDicomFiles(dicomDataSources);
};

export async function importDataSources(dataSources: DataSource[]) {
  const importContext = {
    dicomDataSources: [] as DataSourceWithFile[],
  };

  const middleware = [
    updateFileMimeType,
    extractArchive,
    // should be before importSingleFile, since DICOM is more specific
    handleDicomFile,
    importSingleFile,
    unhandledResource,
  ];
  const loader = new Pipeline(middleware);

  const results = await Promise.all(
    dataSources.map((r) => loader.execute(r, importContext)),
  );

  const dicomResult = await importDicomFiles(importContext.dicomDataSources);

  return [...results, dicomResult].filter(
    (result) => !result.ok || isSelectable(result),
  );
}

export type ImportDataSourcesResult = Awaited<
  ReturnType<typeof importDataSources>
>[number];
