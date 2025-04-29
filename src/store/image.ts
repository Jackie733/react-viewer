import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import vtkImageData from '@kitware/vtk.js/Common/DataModel/ImageData';
import { vec3, mat4, mat3 } from 'gl-matrix';
import { defaultLPSDirections } from '@/utils/lps';

interface ImageState {
  // 当前图像数据
  currentImage: vtkImageData | null;

  // 图像元数据
  metadata: {
    name: string;
    dimensions: vec3;
    spacing: vec3;
    origin: vec3;
    orientation: mat3;
    lpsOrientation: ReturnType<typeof defaultLPSDirections>;
    worldBounds: [number, number, number, number, number, number];
    worldToIndex: mat4;
    indexToWorld: mat4;
  };

  // 渲染设置
  renderSettings: {
    slice: number;
    orientation: 'axial' | 'sagittal' | 'coronal';
  };
}

interface ImageActions {
  setImage: (name: string, image: vtkImageData) => void;
  updateRenderSettings: (
    settings: Partial<ImageState['renderSettings']>,
  ) => void;
  clear: () => void;
}

const defaultMetadata = {
  name: '(none)',
  dimensions: vec3.fromValues(1, 1, 1),
  spacing: vec3.fromValues(1, 1, 1),
  origin: vec3.create(),
  orientation: mat3.create(),
  lpsOrientation: defaultLPSDirections(),
  worldBounds: [0, 1, 0, 1, 0, 1] as [
    number,
    number,
    number,
    number,
    number,
    number,
  ],
  worldToIndex: mat4.create(),
  indexToWorld: mat4.create(),
};

export const useImageStore = create<ImageState & ImageActions>()(
  immer((set) => ({
    currentImage: null,
    metadata: defaultMetadata,
    renderSettings: {
      slice: 0,
      orientation: 'axial',
    },

    setImage: (name, image) => {
      set((state) => {
        state.currentImage = image;
        state.metadata = {
          name,
          dimensions: image.getDimensions(),
          spacing: image.getSpacing(),
          origin: image.getOrigin(),
          orientation: image.getDirection(),
          lpsOrientation: defaultLPSDirections(),
          worldBounds: image.getBounds(),
          worldToIndex: image.getWorldToIndex(),
          indexToWorld: image.getIndexToWorld(),
        };

        // 设置默认切片为中间切片
        const dimensions = image.getDimensions();
        state.renderSettings.slice = Math.floor(dimensions[2] / 2);
      });
    },

    updateRenderSettings: (settings) => {
      set((state) => {
        state.renderSettings = {
          ...state.renderSettings,
          ...settings,
        };
      });
    },

    clear: () => {
      set((state) => {
        state.currentImage = null;
        state.metadata = defaultMetadata;
        state.renderSettings = {
          slice: 0,
          orientation: 'axial',
        };
      });
    },
  })),
);
