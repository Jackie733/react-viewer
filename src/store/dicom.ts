import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import vtkITKHelper from '@kitware/vtk.js/Common/DataModel/ITKHelper';
import * as DICOM from '@/io/dicom';
import { DataSourceWithFile } from '@/io/import/dataSource';
import { identity, pick } from '@/utils';
import { PatientData, readDicomRT } from '@/io/dicomRTParser';

export const ANONYMOUS_PATIENT = 'Anonymous';
export const ANONYMOUS_PATIENT_ID = 'ANONYMOUS';

export interface VolumeInfo {
  NumberOfSlices: number;
  Modality: string;
  SeriesInstanceUID: string;
  SeriesNumber: string;
  SeriesDescription: string;
  WindowLevel: string;
  WindowWidth: string;
}

export interface PatientInfo {
  PatientID: string;
  PatientName: string;
  PatientBirthDate: string;
  PatientSex: string;
}

export const buildImage = async (seriesFiles: File[]) => {
  const messages: string[] = [];
  return {
    builtImageResults: await DICOM.buildImage(seriesFiles),
    messages,
  };
};

export const constructImage = async (files: File[]) => {
  if (!files || !files.length) throw new Error('No files');
  const results = await buildImage(files);
  const image = vtkITKHelper.convertItkToVtkImage(
    results.builtImageResults.outputImage,
  );
  return {
    ...results,
    image,
  };
};

interface DicomState {
  currentFiles: File[] | null;
  patientHierarchy: PatientData[] | null;
  volumeInfo: VolumeInfo | null;
  patientInfo: PatientInfo | null;

  isBuilding: boolean;
  buildError: Error | null;
  builtImage: ReturnType<typeof vtkITKHelper.convertItkToVtkImage> | null;

  windowLevel: number | null;
  windowWidth: number | null;
}

interface DicomActions {
  loadFiles: (files: DataSourceWithFile[]) => Promise<void>;

  buildVolume: () => Promise<{
    image: ReturnType<typeof vtkITKHelper.convertItkToVtkImage>;
  } | null>;

  clear: () => void;

  setWindow: (level: number, width: number) => void;
}

const readDicomTags = (file: File) =>
  DICOM.readTags(file, [
    { name: 'PatientName', tag: '0010|0010', strconv: true },
    { name: 'PatientID', tag: '0010|0020', strconv: true },
    { name: 'PatientBirthDate', tag: '0010|0030' },
    { name: 'PatientSex', tag: '0010|0040' },
    { name: 'StudyInstanceUID', tag: '0020|000d' },
    { name: 'SeriesInstanceUID', tag: '0020|000e' },
    { name: 'SeriesNumber', tag: '0020|0011' },
    { name: 'SeriesDescription', tag: '0008|103e', strconv: true },
    { name: 'Modality', tag: '0008|0060' },
    { name: 'WindowLevel', tag: '0028|1050' },
    { name: 'WindowWidth', tag: '0028|1051' },
  ]);

const cleanupName = (name: string) => {
  return name.trim().replace(/\s+/g, ' ');
};

export const getDisplayName = (info: VolumeInfo) => {
  return (
    cleanupName(info.SeriesDescription || info.SeriesNumber) ||
    info.SeriesInstanceUID
  );
};

export const getWindowLevels = (info: VolumeInfo) => {
  const { WindowWidth, WindowLevel } = info;
  if (
    WindowWidth == null ||
    WindowLevel == null ||
    WindowWidth === '' ||
    WindowLevel === ''
  )
    return { width: null, level: null };
  const widths = WindowWidth.split('\\').map(parseFloat);
  const levels = WindowLevel.split('\\').map(parseFloat);
  if (
    widths.some((w) => Number.isNaN(w)) ||
    levels.some((l) => Number.isNaN(l))
  ) {
    console.error('Invalid WindowWidth or WindowLevel DICOM tags');
    return { width: null, level: null };
  }
  return { width: widths[0], level: levels[0] };
};

export const useDicomStore = create<DicomState & DicomActions>()(
  immer((set, get) => ({
    currentFiles: null,
    patientHierarchy: null,
    volumeInfo: null,
    patientInfo: null,
    isBuilding: false,
    buildError: null,
    builtImage: null,
    windowLevel: null,
    windowWidth: null,

    loadFiles: async (datasets: DataSourceWithFile[]) => {
      if (!datasets.length) return;

      try {
        set((state) => {
          state.currentFiles = null;
          state.volumeInfo = null;
          state.patientInfo = null;
          state.builtImage = null;
          state.buildError = null;
          state.isBuilding = false;
        });

        const allFiles = datasets.map((ds) => ds.fileSrc.file);
        // TODO 读取RT结构
        const hierarchyRT = await readDicomRT(allFiles);
        console.log('hierarchyRT', hierarchyRT);

        set((state) => {
          state.patientHierarchy = hierarchyRT.patients;
        });

        const sortedFiles = await DICOM.splitAndSort(allFiles, identity);

        const volumeKeys = Object.keys(sortedFiles);

        if (volumeKeys.length === 0) {
          throw new Error('No volumes categorized from DICOM file(s)');
        }

        const firstVolumeKey = volumeKeys[0];
        const files = sortedFiles[firstVolumeKey];

        const rawTags = await readDicomTags(files[0]);
        const tags = Object.fromEntries(
          Object.entries(rawTags).map(([key, value]) => [key, value.trim()]),
        );

        const patient = {
          PatientID: tags.PatientID || ANONYMOUS_PATIENT_ID,
          PatientName: tags.PatientName || ANONYMOUS_PATIENT,
          PatientBirthDate: tags.PatientBirthDate || '',
          PatientSex: tags.PatientSex || '',
        };

        const volumeInfo = {
          ...pick(
            tags,
            'Modality',
            'SeriesInstanceUID',
            'SeriesNumber',
            'SeriesDescription',
            'WindowLevel',
            'WindowWidth',
          ),
          NumberOfSlices: files.length,
        };

        set((state) => {
          state.currentFiles = files;
          state.volumeInfo = volumeInfo;
          state.patientInfo = patient;

          const wl = getWindowLevels(volumeInfo);
          if (wl.width && wl.level) {
            state.windowWidth = wl.width;
            state.windowLevel = wl.level;
          }
        });
      } catch (error) {
        console.error('Error loading DICOM files:', error);
        set((state) => {
          state.buildError =
            error instanceof Error
              ? error
              : new Error('Unknown error loading files');
        });
      }
    },

    buildVolume: async () => {
      const { currentFiles, volumeInfo, isBuilding } = get();

      if (!currentFiles || !volumeInfo || isBuilding) {
        return null;
      }

      try {
        set((state) => {
          state.isBuilding = true;
          state.buildError = null;
        });

        const result = await constructImage(currentFiles);

        set((state) => {
          state.builtImage = result.image;
          state.isBuilding = false;
        });

        return { image: result.image };
      } catch (error) {
        console.error('Error building volume:', error);
        set((state) => {
          state.buildError =
            error instanceof Error
              ? error
              : new Error('Unknown error building volume');
          state.isBuilding = false;
        });
        return null;
      }
    },

    clear: () => {
      set((state) => {
        state.currentFiles = null;
        state.volumeInfo = null;
        state.patientInfo = null;
        state.builtImage = null;
        state.buildError = null;
        state.isBuilding = false;
        state.windowLevel = null;
        state.windowWidth = null;
      });
    },

    setWindow: (level, width) => {
      set((state) => {
        state.windowLevel = level;
        state.windowWidth = width;
      });
    },
  })),
);
