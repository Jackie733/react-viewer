import {
  ColorTransferFunction,
  ColorBy,
  CVRConfig,
  VolumeColoringConfig,
  OpacityFunction,
} from '@/types/views';
import vtkPiecewiseFunctionProxy from '@kitware/vtk.js/Proxy/Core/PiecewiseFunctionProxy';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useImageStore } from './image';
import {
  getColorFunctionRangeFromPreset,
  getOpacityFunctionFromPreset,
} from '@/utils/vtk-helpers';

export const DEFAULT_AMBIENT = 0.2;
export const DEFAULT_DIFFUSE = 0.7;
export const DEFAULT_SPECULAR = 0.3;
export const DEFAULT_EDGE_GRADIENT = 0.2;
export const DEFAULT_SAMPLING_DISTANCE = 0.2;

interface VolumeColoringState {
  config: VolumeColoringConfig;
}

interface VolumeColoringActions {
  setConfig: (newConfig: VolumeColoringConfig) => void;
  updateConfig: (patch: Partial<VolumeColoringConfig>) => void;
  setColorBy: (update: Partial<ColorBy>) => void;
  setTransferFunction: (update: Partial<ColorTransferFunction>) => void;
  setOpacityFunction: (newOpacityFunction: OpacityFunction) => void;
  updateOpacityFunction: (update: Partial<OpacityFunction>) => void;
  setCVR: (update: Partial<CVRConfig>) => void;
  applyPreset: (presetName: string) => void;
}

const getDefaultVolumeColoringConfig = (): VolumeColoringConfig => ({
  colorBy: {
    arrayName: '',
    location: 'pointData',
  },
  transferFunction: {
    preset: '',
    mappingRange: [0, 1],
  },
  opacityFunction: {
    mode: vtkPiecewiseFunctionProxy.Mode.Gaussians,
    gaussians: [],
    mappingRange: [0, 1],
  } as OpacityFunction,
  cvr: {
    enabled: true,
    lightFollowsCamera: true,
    volumeQuality: 2,
    useVolumetricScatteringBlending: false,
    volumetricScatteringBlending: 0.5,
    useLocalAmbientOcclusion: true,
    laoKernelRadius: 5,
    laoKernelSize: 15,
    ambient: DEFAULT_AMBIENT,
    diffuse: DEFAULT_DIFFUSE,
    specular: DEFAULT_SPECULAR,
  },
});

export const useVolumeColoringStore = create<
  VolumeColoringState & VolumeColoringActions
>()(
  immer((set, get) => ({
    config: getDefaultVolumeColoringConfig(),

    setConfig: (newConfig) => {
      set((state) => {
        state.config = newConfig;
      });
    },

    updateConfig: (patch) => {
      set((state) => {
        state.config = { ...state.config, ...patch };
      });
    },

    setColorBy: (update) => {
      set((state) => {
        state.config.colorBy = { ...state.config.colorBy, ...update };
      });
    },

    setTransferFunction: (update) => {
      set((state) => {
        state.config.transferFunction = {
          ...state.config.transferFunction,
          ...update,
        };
      });
    },

    setOpacityFunction: (newOpacityFunction) => {
      set((state) => {
        state.config.opacityFunction = newOpacityFunction;
      });
    },

    updateOpacityFunction: (update) => {
      set((state) => {
        if (update.mode && state.config.opacityFunction.mode !== update.mode) {
          console.warn(
            'Updating opacity function mode with partial update. Consider using setOpacityFunction for mode changes.',
          );
        }
        state.config.opacityFunction = {
          ...state.config.opacityFunction,
          ...update,
        } as OpacityFunction;
      });
    },

    setCVR: (update) => {
      set((state) => {
        state.config.cvr = { ...state.config.cvr, ...update };
      });
    },

    applyPreset: (presetName) => {
      const currentImage = useImageStore.getState().currentImage;
      if (!currentImage) return;

      const scalarData = currentImage.getPointData().getScalars();
      if (!scalarData) return;
      const imageDataRange = scalarData.getRange();

      const { colorFunc: presetColorFunc, opacityFunc: presetOpacityFunc } =
        getColorAndOpacityFuncsFromPreset(presetName);
      presetColorFunc.mappingRange ||= imageDataRange;
      presetOpacityFunc.mappingRange = imageDataRange;

      get().setTransferFunction(presetColorFunc);
      get().updateOpacityFunction(presetOpacityFunc);
    },
  })),
);

function getColorAndOpacityFuncsFromPreset(preset: string) {
  const ctFunc: Partial<ColorTransferFunction> = { preset };
  const ctRange = getColorFunctionRangeFromPreset(preset);
  if (ctRange) {
    ctFunc.mappingRange = ctRange;
  }

  const opFunc = getOpacityFunctionFromPreset(preset);
  return { colorFunc: ctFunc, opacityFunc: opFunc };
}
