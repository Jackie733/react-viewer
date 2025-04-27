import { Maybe } from '@/types';
import { dicomStore } from '@/store/dicom';

export type DataSelection = string;

export const selectionEquals = (a: DataSelection, b: DataSelection) => a === b;

export const isDicomImage = (imageID: Maybe<string>) => {
  if (!imageID) return false;
  return imageID in dicomStore.volumeInfo;
};
