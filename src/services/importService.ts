import { DataSourceWithFile } from '@/io/import/dataSource';
import { useImageStore } from '@/store/image';
import { useDicomStore, getDisplayName } from '@/store/dicom';
import { isVolumeResult, LoadableResult } from '@/io/import/common';

export const importService = {
  loadDicomFiles: async (dicomDataSources: Array<DataSourceWithFile>) => {
    try {
      if (!dicomDataSources.length) {
        return { ok: true as const, data: [] };
      }

      // 清除所有现有数据
      importService.clearAll();

      // 加载 DICOM 文件到简化版 store
      await useDicomStore.getState().loadFiles(dicomDataSources);

      // 构建 volume
      const volumeResult = await useDicomStore.getState().buildVolume();

      if (!volumeResult || !volumeResult.image) {
        return {
          ok: false as const,
          errors: [
            {
              message: 'Failed to build volume from DICOM files',
              cause: null,
              inputDataStackTrace: [
                { dicomSrc: { sources: dicomDataSources } },
              ],
            },
          ],
        };
      }

      const volumeInfo = useDicomStore.getState().volumeInfo;
      if (volumeInfo) {
        const name = getDisplayName(volumeInfo);
        useImageStore.getState().setImage(name, volumeResult.image);

        return {
          ok: true as const,
          data: [
            {
              dataType: 'dicom' as const,
              dataSource: { dicomSrc: { sources: dicomDataSources } },
            },
          ],
        };
      }

      return {
        ok: false as const,
        errors: [
          {
            message: 'Volume info not found after loading DICOM files',
            cause: null,
            inputDataStackTrace: [{ dicomSrc: { sources: dicomDataSources } }],
          },
        ],
      };
    } catch (err) {
      return {
        ok: false as const,
        errors: [
          {
            message: String(err) || 'Unknown error importing DICOM files',
            cause: err,
            inputDataStackTrace: [{ dicomSrc: { sources: dicomDataSources } }],
          },
        ],
      };
    }
  },

  setWindowLevelWidth: (level: number, width: number) => {
    useDicomStore.getState().setWindow(level, width);
  },

  clearAll: () => {
    useDicomStore.getState().clear();
    useImageStore.getState().clear();
  },

  selectPrimaryFromResults: (loadableDataSources: Array<LoadableResult>) => {
    if (!loadableDataSources.length) return;

    // 由于我们只处理单个文件，直接获取第一个结果
    const primaryDataSource = loadableDataSources[0];

    if (isVolumeResult(primaryDataSource)) {
      // 在我们的简化模型中，不需要做额外处理，
      // 因为我们在加载时已经将唯一的数据集作为主要数据集处理了
      console.log('Selected primary dataset:', primaryDataSource);
    }
  },
};
