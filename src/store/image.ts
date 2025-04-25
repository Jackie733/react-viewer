import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Bounds } from '@kitware/vtk.js/types';
import { mat3, mat4, vec3 } from 'gl-matrix';
import { defaultLPSDirections, getLPSDirections } from '@/utils/lps';
import vtkImageData from '@kitware/vtk.js/Common/DataModel/ImageData';
import { ImageMetadata } from '@/types/image';
import { useIDStore } from './id';

interface ImageState {
  idList: string[]; // list of IDs
  dataIndex: Record<string, vtkImageData>; // ID -> VTK object
  metadata: Record<string, ImageMetadata>; // ID -> metadata
}

interface ImageActions {
  addVTKImageData(
    name: string,
    imageData: vtkImageData,
    useId?: string,
  ): string;
  updateData(id: string, imageData: vtkImageData): void;
  deleteData(id: string): void;
}

export function removeFromArray<T>(arr: Array<T>, el: T) {
  const idx = arr.indexOf(el);
  if (idx > -1) {
    arr.splice(idx, 1);
  }
}

export const defaultImageMetadata = () => ({
  name: '(none)',
  orientation: mat3.create(),
  lpsOrientation: defaultLPSDirections(),
  spacing: vec3.fromValues(1, 1, 1),
  origin: vec3.create(),
  dimensions: vec3.fromValues(1, 1, 1),
  worldBounds: [0, 1, 0, 1, 0, 1] as Bounds,
  worldToIndex: mat4.create(),
  indexToWorld: mat4.create(),
});

export const useImageStore = create<ImageState & ImageActions>()(
  immer((set) => ({
    idList: [],
    dataIndex: Object.create(null),
    metadata: Object.create(null),

    addVTKImageData: (
      name: string,
      imageData: vtkImageData,
      useId?: string,
    ) => {
      const id = useId ?? useIDStore.getState().nextID();

      set((state) => {
        state.idList.push(id);
        state.dataIndex[id] = imageData;
        state.metadata[id] = { ...defaultImageMetadata(), name };
        state.updateData(id, imageData);
      });

      return id;
    },
    updateData: (id: string, imageData: vtkImageData) => {
      set((state) => {
        if (id in state.metadata) {
          const metadata = {
            name: state.metadata[id].name,
            dimensions: imageData.getDimensions(),
            spacing: imageData.getSpacing(),
            origin: imageData.getOrigin(),
            orientation: imageData.getDirection(),
            lpsOrientation: getLPSDirections(imageData.getDirection()),
            worldBounds: imageData.getBounds(),
            worldToIndex: imageData.getWorldToIndex(),
            indexToWorld: imageData.getIndexToWorld(),
          };

          state.metadata[id] = metadata;
          state.dataIndex[id] = imageData;
        }
        state.dataIndex[id] = imageData;
      });
    },
    deleteData: (id: string) =>
      set((state) => {
        delete state.dataIndex[id];
        delete state.metadata[id];
        removeFromArray(state.idList, id);
      }),
  })),
);

export const imageStore = useImageStore.getState();
