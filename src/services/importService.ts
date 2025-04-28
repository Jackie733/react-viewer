import { DataSourceWithFile } from '@/io/import/dataSource';
import { useFileStore } from '@/store/file';
import { useDicomStore, getDisplayName } from '@/store/dicom';
import { useDatasetStore } from '@/store/datasets';
import { useImageStore } from '@/store/image';
import { isVolumeResult, LoadableResult } from '@/io/import/common';
import { toDataSelection } from '@/io/import/importDataSources';

/**
 * Import service coordinates operations between different stores
 * and provides a clean API for importing data
 */
export const importService = {
  /**
   * Imports DICOM files into the application
   * This method coordinates actions between file, dicom, and dataset stores
   */
  importDicomFiles: async (dicomDataSources: Array<DataSourceWithFile>) => {
    try {
      if (!dicomDataSources.length) {
        return { ok: true as const, data: [] };
      }

      // First process the files in the dicom store (this will sort and organize them)
      const volumeKeys = await useDicomStore
        .getState()
        .importFiles(dicomDataSources);

      // Now that we have volume keys, register the files in the file store
      // Each volumeKey corresponds to a set of DICOM files
      volumeKeys.forEach((volumeKey) => {
        // Get all dataset sources for this volume
        const volumeDatasetFiles = dicomDataSources.filter((ds) =>
          // Simple matching - in real app you'd need to match files to volumes more accurately
          ds.fileSrc.file.name.includes(volumeKey),
        );

        // Add them to the file store
        useFileStore.getState().addFiles(volumeKey, volumeDatasetFiles);
      });

      return {
        ok: true as const,
        data: volumeKeys.map((key) => ({
          dataID: key,
          dataType: 'dicom' as const,
          dataSource: { dicomSrc: { sources: dicomDataSources } },
        })),
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

  /**
   * Sets the primary selection and coordinates actions between stores
   */
  setPrimarySelection: (selection: string | null) => {
    if (!selection) {
      useDatasetStore.getState().setPrimarySelection(null);
      return;
    }

    // Update the dataset store
    useDatasetStore.getState().setPrimarySelection(selection);

    // Check if we need to build a volume in dicom store
    const volumeInfo = useDicomStore.getState().volumeInfo;
    if (selection in volumeInfo) {
      // Build the volume for this selection
      useDicomStore
        .getState()
        .buildVolume(selection)
        .then((volumeBuildResults) => {
          // Now we need to register this with the image store
          const { image, volumeKey } = volumeBuildResults;
          const imageStore = useImageStore.getState();

          // Check if this image already exists in the image store
          const imageExists = volumeKey in imageStore.dataIndex;

          if (imageExists) {
            // Update existing image data
            imageStore.updateData(volumeKey, image);
          } else {
            // Add new image data
            const info = volumeInfo[volumeKey];
            const name = getDisplayName(info);
            imageStore.addVTKImageData(name, image, volumeKey);
          }

          console.log('Volume built successfully:', volumeBuildResults);
        })
        .catch((error) => {
          console.error('Failed to build volume:', error);
        });
    }
  },

  /**
   * After importing data, select the appropriate dataset as primary
   */
  selectPrimaryFromResults: (loadableDataSources: Array<LoadableResult>) => {
    if (!loadableDataSources.length) return;

    // This logic is simplified - in a real implementation, you would
    // want to port the findBaseDataSource logic from loadFiles.ts
    const primaryDataSource = loadableDataSources[0];

    if (isVolumeResult(primaryDataSource)) {
      const selection = toDataSelection(primaryDataSource);
      importService.setPrimarySelection(selection);
    }
  },

  /**
   * Removes a dataset and coordinates cleanup across all stores
   */
  removeDataset: (id: string) => {
    // First, update the dataset store to remove the selection if needed
    useDatasetStore.getState().remove(id);

    // Clean up in the dicom store if this ID exists there
    const volumeInfo = useDicomStore.getState().volumeInfo;
    if (id in volumeInfo) {
      useDicomStore.getState().deleteVolume(id);
    }

    // Clean up any image data if it exists
    const imageStore = useImageStore.getState();
    if (id in imageStore.dataIndex) {
      imageStore.deleteData(id);
    }

    // Clean up any file data
    useFileStore.getState().removeFiles(id);
  },
};
