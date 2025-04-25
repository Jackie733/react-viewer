import { getFileMimeType } from '@/io';
import { ImportHandler } from '@/io/import/common';

/**
 * Transforms a file data source to have a mime type
 * @param dataSource
 */
const updateFileMimeType: ImportHandler = async (dataSource) => {
  let src = dataSource;
  const { fileSrc } = src;
  if (fileSrc && fileSrc.fileType === '') {
    const mime = await getFileMimeType(fileSrc.file);
    if (mime) {
      src = {
        ...src,
        fileSrc: {
          ...fileSrc,
          fileType: mime,
        },
      };
    }
  }
  return src;
};

export default updateFileMimeType;
