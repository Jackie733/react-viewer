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
import { dicomStore } from '@/store/dicom';

/**
 * Tries to turn a thrown object into a meaningful error string.
 * @param error
 * @returns
 */
function toMeaningfulErrorString(thrown: unknown) {
  const strThrown = String(thrown);
  if (!strThrown || strThrown === '[object Object]') {
    return 'Unknown error. More details in the dev console.';
  }
  return strThrown;
}

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
  const resultSources: DataSource = {
    dicomSrc: {
      sources: dicomDataSources,
    },
  };
  try {
    if (!dicomDataSources.length) {
      return {
        ok: true as const,
        data: [],
      };
    }
    const volumeKeys = await dicomStore.importFiles(dicomDataSources);
    return {
      ok: true as const,
      data: volumeKeys.map((key) => ({
        dataID: key,
        dataType: 'dicom' as const,
        dataSource: resultSources,
      })),
    };
  } catch (err) {
    return {
      ok: false as const,
      errors: [
        {
          message: toMeaningfulErrorString(err),
          cause: err,
          inputDataStackTrace: [resultSources],
        },
      ],
    };
  }
};

export async function importDataSources(dataSources: DataSource[]) {
  const importContext = {
    dicomDataSources: [] as DataSourceWithFile[],
  };

  const middleware = [
    // updating the file type should be first in the pipeline
    updateFileMimeType,
    extractArchive,
    // should be before importSingleFile, since DICOM is more specific
    handleDicomFile, // collect DICOM files to import later
    importSingleFile,
    // catch any unhandled resource
    unhandledResource,
  ];
  const loader = new Pipeline(middleware);

  const results = await Promise.all(
    dataSources.map((r) => loader.execute(r, importContext)),
  );

  console.log('IMPORT CONTEXT:', importContext);

  const dicomResult = await importDicomFiles(importContext.dicomDataSources);

  return [
    ...results,
    dicomResult,
    // Consuming code expects only errors and image import results.
    // Remove ok results that don't result in something to load (like config.JSON files)
  ].filter((result) => !result.ok || isSelectable(result));
}

export type ImportDataSourcesResult = Awaited<
  ReturnType<typeof importDataSources>
>[number];
