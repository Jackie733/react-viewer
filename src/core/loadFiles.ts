import {
  isLoadableResult,
  ImportResult,
  LoadableResult,
  isVolumeResult,
} from '@/io/import/common';
import { DataSource, getDataSourceName } from '@/io/import/dataSource';
import { useDicomStore } from '@/store/dicom';
import { nonNullable } from '@/utils';
import { partitionResults, PipelineResultSuccess } from './pipeline';
import {
  importDataSources,
  ImportDataSourcesResult,
} from '@/io/import/importDataSources';
import { loadDataStore } from '@/store/load-data';
import { importService } from '@/services/importService';

const BASE_MODALITY_TYPES = {
  CT: { priority: 3 },
  MR: { priority: 3 },
  US: { priority: 2 },
  DX: { priority: 1 },
};

function findBaseDicom(loadableDataSources: Array<LoadableResult>) {
  const dicoms = loadableDataSources.filter(
    ({ dataType }) => dataType === 'dicom',
  );
  const baseDicomVolumes = dicoms
    .map((dicomSource) => {
      const volumeInfo =
        useDicomStore.getState().volumeInfo[dicomSource.dataID];
      const modality = volumeInfo?.Modality as keyof typeof BASE_MODALITY_TYPES;
      if (modality in BASE_MODALITY_TYPES) {
        return {
          dicomSource,
          priority: BASE_MODALITY_TYPES[modality]?.priority,
          volumeInfo,
        };
      }
      return undefined;
    })
    .filter(nonNullable)
    .sort(
      (
        { priority: a, volumeInfo: infoA },
        { priority: b, volumeInfo: infoB },
      ) => {
        const priorityDiff = a - b;
        if (priorityDiff !== 0) return priorityDiff;
        // same modality, then more slices preferred
        if (!infoA.NumberOfSlices) return 1;
        if (!infoB.NumberOfSlices) return -1;
        return infoB.NumberOfSlices - infoA.NumberOfSlices;
      },
    );
  if (baseDicomVolumes.length) return baseDicomVolumes[0].dicomSource;
  return undefined;
}

function isSegmentation(extension: string, name: string) {
  if (!extension) return false; // avoid 'foo..bar' if extension is ''
  const extensions = name.split('.').slice(1);
  return extensions.includes(extension);
}

function findBaseImage(
  loadableDataSources: Array<LoadableResult>,
  segmentGroupExtension: string,
) {
  const baseImages = loadableDataSources
    .filter(({ dataType }) => dataType === 'image')
    .filter((importResult) => {
      const name = getDataSourceName(importResult.dataSource);
      if (!name) return false;
      return !isSegmentation(segmentGroupExtension, name);
    });

  if (baseImages.length) return baseImages[0];
  return undefined;
}

// returns image and dicom sources, no config files
function filterLoadableDataSources(
  succeeded: Array<PipelineResultSuccess<ImportResult>>,
) {
  return succeeded.flatMap((result) => {
    return result.data.filter(isLoadableResult);
  });
}

function findBaseDataSource(
  succeeded: Array<PipelineResultSuccess<ImportResult>>,
  segmentGroupExtension: string,
) {
  const loadableDataSources = filterLoadableDataSources(succeeded);
  const baseDicom = findBaseDicom(loadableDataSources);
  if (baseDicom) return baseDicom;

  const baseImage = findBaseImage(loadableDataSources, segmentGroupExtension);
  if (baseImage) return baseImage;
  return loadableDataSources[0];
}

export function loadDataSources(sources: DataSource[]) {
  const load = async () => {
    let results: ImportDataSourcesResult[];
    try {
      results = await importDataSources(sources);
    } catch (error) {
      console.error('Error importing files:', error);
      return;
    }

    const [succeeded, errored] = partitionResults(results);

    // Use the import service to select primary dataset instead of directly manipulating stores
    if (succeeded.length) {
      const primaryDataSource = findBaseDataSource(
        succeeded,
        loadDataStore.segmentGroupExtension,
      );

      if (primaryDataSource && isVolumeResult(primaryDataSource)) {
        importService.setPrimarySelection(primaryDataSource.dataID);
      }
    }

    if (errored.length) {
      console.error('Error loading files:', errored);
    }
  };

  const wrapWithLoading = <T extends (...args: unknown[]) => void>(fn: T) => {
    const { setIsLoading } = loadDataStore;
    return async function wrapper(...args: Parameters<T>) {
      try {
        setIsLoading(true);
        await fn(...args);
      } catch (error) {
        console.error('Error loading files:', error);
      } finally {
        setIsLoading(false);
      }
    };
  };

  return wrapWithLoading(load)();
}
