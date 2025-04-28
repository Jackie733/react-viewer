import { isLoadableResult, ImportResult } from '@/io/import/common';
import { DataSource } from '@/io/import/dataSource';
import { partitionResults, PipelineResultSuccess } from './pipeline';
import {
  importDataSources,
  ImportDataSourcesResult,
} from '@/io/import/importDataSources';
import { importService } from '@/services/importService';
import { useLoadDataStore } from '@/store/load-data';

function filterLoadableDataSources(
  succeeded: Array<PipelineResultSuccess<ImportResult>>,
) {
  return succeeded.flatMap((result) => {
    return result.data.filter(isLoadableResult);
  });
}

export function loadDataSources(sources: DataSource[]) {
  const setIsLoading = useLoadDataStore.getState().setIsLoading;

  const load = async () => {
    let results: ImportDataSourcesResult[];
    try {
      results = await importDataSources(sources);
    } catch (error) {
      console.error('Error importing files:', error);
      return;
    }

    const [succeeded, errored] = partitionResults(results);

    if (succeeded.length) {
      const loadableDataSources = filterLoadableDataSources(succeeded);
      if (loadableDataSources.length > 0) {
        importService.selectPrimaryFromResults(loadableDataSources);
      }
    }

    if (errored.length) {
      console.error('Error loading files:', errored);
    }
  };

  const wrappedLoad = async () => {
    setIsLoading(true);
    try {
      await load();
    } catch (error) {
      console.error('Unexpected error loading files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return wrappedLoad();
}
