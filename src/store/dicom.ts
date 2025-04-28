import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import vtkITKHelper from '@kitware/vtk.js/Common/DataModel/ITKHelper';
import { Image } from 'itk-wasm';
import * as DICOM from '@/io/dicom';
import { getFiles } from './file';
import { DataSourceWithFile } from '@/io/import/dataSource';
import { identity, pick, removeFromArray } from '@/utils';

export const ANONYMOUS_PATIENT = 'Anonymous';
export const ANONYMOUS_PATIENT_ID = 'ANONYMOUS';

export function imageCacheMultiKey(offset: number, asThumbnail: boolean) {
  return `${offset}!!${asThumbnail}`;
}

export interface VolumeKeys {
  patientKey: string;
  studyKey: string;
  volumeKey: string;
}

export interface PatientInfo {
  PatientID: string;
  PatientName: string;
  PatientBirthDate: string;
  PatientSex: string;
}

export interface StudyInfo {
  StudyID: string;
  StudyInstanceUID: string;
  StudyDate: string;
  StudyTime: string;
  AccessionNumber: string;
  StudyDescription: string;
}

export interface VolumeInfo {
  NumberOfSlices: number;
  VolumeID: string;
  Modality: string;
  SeriesInstanceUID: string;
  SeriesNumber: string;
  SeriesDescription: string;
  WindowLevel: string;
  WindowWidth: string;
}

export const buildImage = async (seriesFiles: File[], modality: string) => {
  const messages: string[] = [];
  if (modality === 'SEG') {
    const segFile = seriesFiles[0];
    const results = await DICOM.buildSegmentGroups(segFile);
    if (seriesFiles.length > 1)
      messages.push(
        'Tried to make one volume from 2 SEG modality files. Using only the first file!',
      );
    return {
      modality: 'SEG',
      builtImageResults: results,
      messages,
    };
  }
  return {
    builtImageResults: await DICOM.buildImage(seriesFiles),
    messages,
  };
};

// Return type to help TypeScript
export type VolumeConstructResult = ReturnType<typeof constructImage>;

// Export this so importService can use it
export const constructImage = async (
  volumeKey: string,
  files: File[],
  volumeInfo: VolumeInfo,
) => {
  if (!files || !files.length) throw new Error('No files');
  const results = await buildImage(files, volumeInfo.Modality);
  const image = vtkITKHelper.convertItkToVtkImage(
    results.builtImageResults.outputImage,
  );
  return {
    ...results,
    image,
    volumeKey,
  };
};

interface DicomState {
  // volumeKey -> imageCacheMultiKey -> ITKImage
  sliceData: Record<string, Record<string, Image>>;

  // volume invalidation information
  needsRebuild: Record<string, boolean>;

  // Avoid recomputing image data for the same volume by checking this for existing buildVolume tasks
  volumeBuildResults: Record<string, VolumeConstructResult>;

  // patientKey -> patient info
  patientInfo: Record<string, PatientInfo>;
  // patientKey -> array of studyKeys
  patientStudies: Record<string, string[]>;

  // studyKey -> study info
  studyInfo: Record<string, StudyInfo>;
  // studyKey -> array of volumeKeys
  studyVolumes: Record<string, string[]>;

  // volumeKey -> volume info
  volumeInfo: Record<string, VolumeInfo>;

  // parent pointers
  // volumeKey -> studyKey
  volumeStudy: Record<string, string>;
  // studyKey -> patientKey
  studyPatient: Record<string, string>;
}

interface DicomActions {
  importFiles: (files: DataSourceWithFile[]) => Promise<string[]>;
  _updateDatabase: (
    patient: PatientInfo,
    study: StudyInfo,
    volume: VolumeInfo,
  ) => void;
  buildVolume: (
    volumeKey: string,
    forceRebuild?: boolean,
  ) => VolumeConstructResult;
  deleteVolume: (volumeKey: string) => void;
  _deleteStudy: (studyKey: string) => void;
  _deletePatient: (patientKey: string) => void;
  getVolumeFiles: (volumeKey: string) => File[] | null;
}

const readDicomTags = (file: File) =>
  DICOM.readTags(file, [
    { name: 'PatientName', tag: '0010|0010', strconv: true },
    { name: 'PatientID', tag: '0010|0020', strconv: true },
    { name: 'PatientBirthDate', tag: '0010|0030' },
    { name: 'PatientSex', tag: '0010|0040' },
    { name: 'StudyInstanceUID', tag: '0020|000d' },
    { name: 'StudyDate', tag: '0008|0020' },
    { name: 'StudyTime', tag: '0008|0030' },
    { name: 'StudyID', tag: '0020|0010', strconv: true },
    { name: 'AccessionNumber', tag: '0008|0050' },
    { name: 'StudyDescription', tag: '0008|1030', strconv: true },
    { name: 'Modality', tag: '0008|0060' },
    { name: 'SeriesInstanceUID', tag: '0020|000e' },
    { name: 'SeriesNumber', tag: '0020|0011' },
    { name: 'SeriesDescription', tag: '0008|103e', strconv: true },
    { name: 'WindowLevel', tag: '0028|1050' },
    { name: 'WindowWidth', tag: '0028|1051' },
  ]);

/**
 * Trims and collapses multiple spaces into one.
 * @param name
 * @returns string
 */
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
    return []; // missing tag
  const widths = WindowWidth.split('\\').map(parseFloat);
  const levels = WindowLevel.split('\\').map(parseFloat);
  if (
    widths.some((w) => Number.isNaN(w)) ||
    levels.some((l) => Number.isNaN(l))
  ) {
    console.error('Invalid WindowWidth or WindowLevel DICOM tags');
    return [];
  }
  if (widths.length !== levels.length) {
    console.error(
      'Different numbers of WindowWidth and WindowLevel DICOM tags',
    );
    return [];
  }
  return widths.map((width, i) => ({ width, level: levels[i] }));
};

export const useDicomStore = create<DicomState & DicomActions>()(
  immer((set, get) => ({
    sliceData: {},
    needsRebuild: {},
    volumeBuildResults: {},
    patientInfo: {},
    patientStudies: {},
    studyInfo: {},
    studyVolumes: {},
    volumeInfo: {},
    volumeStudy: {},
    studyPatient: {},

    importFiles: async (datasets: DataSourceWithFile[]) => {
      if (!datasets.length) return [];

      const fileToDataSource = new Map(
        datasets.map((ds) => [ds.fileSrc.file, ds]),
      );
      const allFiles = [...fileToDataSource.keys()];

      const volumeToFiles = await DICOM.splitAndSort(allFiles, identity);
      if (Object.keys(volumeToFiles).length === 0) {
        throw new Error('No volumes categorized from DICOM file(s)');
      }

      await Promise.all(
        Object.entries(volumeToFiles).map(async ([volumeKey, files]) => {
          if (!(volumeKey in get().volumeInfo)) {
            const rawTags = await readDicomTags(files[0]);
            const tags = Object.fromEntries(
              Object.entries(rawTags).map(([key, value]) => [
                key,
                value.trim(),
              ]),
            );
            // TODO parse the raw string values
            const patient = {
              PatientID: tags.PatientID || ANONYMOUS_PATIENT_ID,
              PatientName: tags.PatientName || ANONYMOUS_PATIENT,
              PatientBirthDate: tags.PatientBirthDate || '',
              PatientSex: tags.PatientSex || '',
            };

            const study = pick(
              tags,
              'StudyID',
              'StudyInstanceUID',
              'StudyDate',
              'StudyTime',
              'AccessionNumber',
              'StudyDescription',
            );

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
              VolumeID: volumeKey,
            };
            get()._updateDatabase(patient, study, volumeInfo);
          }
          set((state) => {
            state.needsRebuild[volumeKey] = true;
          });
        }),
      );
      return Object.keys(volumeToFiles);
    },
    _updateDatabase: (patient, study, volume) => {
      set((state) => {
        const patientKey = patient.PatientID;
        const studyKey = study.StudyInstanceUID;
        const volumeKey = volume.VolumeID;

        if (!(patientKey in state.patientInfo)) {
          state.patientInfo[patientKey] = patient;
          state.patientStudies[patientKey] = [];
        }

        if (!(studyKey in state.studyInfo)) {
          state.studyInfo[studyKey] = study;
          state.studyVolumes[studyKey] = [];
          state.studyPatient[studyKey] = patientKey;
          state.patientStudies[patientKey].push(studyKey);
        }

        if (!(volumeKey in state.volumeInfo)) {
          state.volumeInfo[volumeKey] = volume;
          state.volumeStudy[volumeKey] = studyKey;
          state.sliceData[volumeKey] = {};
          state.studyVolumes[studyKey].push(volumeKey);
        }
      });
    },
    deleteVolume: (volumeKey: string) => {
      set((state) => {
        if (volumeKey in state.volumeInfo) {
          const studyKey = state.volumeStudy[volumeKey];
          delete state.volumeInfo[volumeKey];
          delete state.sliceData[volumeKey];
          delete state.volumeStudy[volumeKey];

          if (volumeKey in state.volumeBuildResults) {
            delete state.volumeBuildResults[volumeKey];
          }

          removeFromArray(state.studyVolumes[studyKey], volumeKey);
          if (state.studyVolumes[studyKey].length === 0) {
            state._deleteStudy(studyKey);
          }
        }
      });
    },
    _deleteStudy: (studyKey: string) => {
      set((state) => {
        if (studyKey in state.studyInfo) {
          const patientKey = state.studyPatient[studyKey];
          delete state.studyInfo[studyKey];
          delete state.studyPatient[studyKey];

          [...state.studyVolumes[studyKey]].forEach((volumeKey) =>
            state.deleteVolume(volumeKey),
          );
          delete state.studyVolumes[studyKey];

          removeFromArray(state.patientStudies[patientKey], studyKey);
          if (state.patientStudies[patientKey].length === 0) {
            state._deletePatient(patientKey);
          }
        }
      });
    },
    _deletePatient: (patientKey: string) => {
      set((state) => {
        if (patientKey in state.patientInfo) {
          delete state.patientInfo[patientKey];

          [...state.patientStudies[patientKey]].forEach((studyKey) =>
            state._deleteStudy(studyKey),
          );
          delete state.patientStudies[patientKey];
        }
      });
    },
    getVolumeFiles: (volumeKey: string) => {
      return getFiles(volumeKey);
    },
    buildVolume: async (volumeKey, forceRebuild = false) => {
      const alreadyBuilt = volumeKey in get().volumeBuildResults;
      const buildNeeded =
        forceRebuild || get().needsRebuild[volumeKey] || !alreadyBuilt;

      set((state) => delete state.needsRebuild[volumeKey]);

      const files = get().getVolumeFiles(volumeKey);
      if (!files) {
        throw new Error(`No files found for volume ${volumeKey}`);
      }

      const oldImagePromise = alreadyBuilt
        ? [get().volumeBuildResults[volumeKey]]
        : [];
      const newVolumeBuildResults = buildNeeded
        ? constructImage(volumeKey, files, get().volumeInfo[volumeKey])
        : get().volumeBuildResults[volumeKey];

      set(
        (state) =>
          (state.volumeBuildResults[volumeKey] = newVolumeBuildResults),
      );
      const [volumeBuildResults] = await Promise.all([
        newVolumeBuildResults,
        ...oldImagePromise,
      ]);

      return volumeBuildResults;
    },
  })),
);
