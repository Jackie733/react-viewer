import { FILE_READERS } from '@/io';
import { ImportHandler } from '@/io/import/common';
import { fileStore } from '@/store/file';
import { imageStore } from '@/store/image';
import vtkImageData from '@kitware/vtk.js/Common/DataModel/ImageData';
import { DataSourceWithFile } from '../dataSource';

/**
 * Reads and imports a file DataSource.
 * @param dataSource
 * @returns
 */
const importSingleFile: ImportHandler = async (dataSource, { done }) => {
  if (!dataSource.fileSrc) {
    return dataSource;
  }

  const { fileSrc } = dataSource;
  if (!FILE_READERS.has(fileSrc.fileType)) {
    return dataSource;
  }

  const reader = FILE_READERS.get(fileSrc.fileType)!;
  const dataObject = await reader(fileSrc.file);

  if (dataObject.isA('vtkImageData')) {
    const id = imageStore.addVTKImageData(
      fileSrc.file.name,
      dataObject as vtkImageData,
    );
    fileStore.addFiles(id, [dataSource as DataSourceWithFile]);

    // TODO: create a default view for each viewID

    return done({
      dataID: id,
      dataSource,
      dataType: 'image',
    });
  }

  if (dataObject.isA('vtkPolyData')) {
    // if (!useDatasetStore().primarySelection) {
    //   useMessageStore().addWarning(
    //     'Load an image to see the mesh. Initializing viewports from mesh files is not implemented.'
    //   );
    // }
    // const dataID = useModelStore().addVTKPolyData(
    //   fileSrc.file.name,
    //   dataObject as vtkPolyData
    // );
    // fileStore.add(dataID, [dataSource as DataSourceWithFile]);

    return done({
      dataSource,
      dataType: 'model',
    });
  }

  throw new Error('Data reader did not produce a valid dataset');
};

export default importSingleFile;
