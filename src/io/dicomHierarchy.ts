import { Patient, Study, Series, DicomTags, TagSpec } from '@/types/dicom';
import {
  splitAndSort as groupFilesBySeries,
  readTags as readDicomTagsFromItk,
  VolumesToFileNamesMap,
} from './dicom'; // Assuming dicom.ts is in the same directory

// Define the comprehensive list of tags we want to extract for building the hierarchy.
// This can be expanded as needed.
const HIERARCHY_TAG_SPECS: TagSpec[] = [
  // Patient Information
  { name: 'PatientName', tag: '0010|0010', strconv: true },
  { name: 'PatientID', tag: '0010|0020', strconv: true },
  { name: 'PatientBirthDate', tag: '0010|0030' },
  { name: 'PatientSex', tag: '0010|0040' },
  // Study Information
  { name: 'StudyInstanceUID', tag: '0020|000d' },
  { name: 'StudyDate', tag: '0008|0020' },
  { name: 'StudyTime', tag: '0008|0030' },
  { name: 'StudyDescription', tag: '0008|1030', strconv: true },
  { name: 'AccessionNumber', tag: '0008|0050', strconv: true },
  // Series Information
  { name: 'SeriesInstanceUID', tag: '0020|000e' },
  { name: 'Modality', tag: '0008|0060' },
  { name: 'SeriesNumber', tag: '0020|0011' },
  { name: 'SeriesDescription', tag: '0008|103e', strconv: true },
  { name: 'BodyPartExamined', tag: '0018|0015', strconv: true },
  // SOPInstanceUID might be useful for specific file identification if needed later
  // { name: 'SOPInstanceUID', tag: '0008|0018' },
];

/**
 * Parses a collection of DICOM files and organizes them into a Patient/Study/Series hierarchy.
 *
 * @param allFiles An array of File objects to process.
 * @returns A Promise that resolves to an array of Patient objects.
 */
export async function parseDicomHierarchy(
  allFiles: File[],
): Promise<Patient[]> {
  if (!allFiles || allFiles.length === 0) {
    return [];
  }

  // Helper to safely get a tag value or a default
  const getTag = (
    tags: Partial<DicomTags>,
    tagName: keyof DicomTags,
    defaultValue: string = '',
  ): string => {
    const value = tags[tagName];
    return typeof value === 'string' ? value.trim() : defaultValue;
  };

  // Using a Map to store patients by their ID for efficient lookup and updates.
  const patientsMap = new Map<string, Patient>();

  // Step 1: Group files by series using the existing utility
  // The `groupFilesBySeries` function expects a mapToBlob function, which in this case is identity for File objects.
  const seriesFileGroups: VolumesToFileNamesMap<File> =
    await groupFilesBySeries<File>(
      allFiles,
      (file) => file, // mapToBlob is just returning the file itself
    );

  // Step 2: Process each series group
  for (const internalSeriesKey in seriesFileGroups) {
    const seriesFiles = seriesFileGroups[internalSeriesKey];
    if (seriesFiles.length === 0) continue;

    // Step 2a: Read tags from the first file of the series
    // (Assuming all files in a series share the same Patient/Study/Series level metadata)
    const firstFileOfSeries = seriesFiles[0];
    let rawTags: Record<string, string>;
    try {
      // readDicomTagsFromItk returns Promise<Record<T[number]['name'], string>> which is Record<string, string>
      // when T[number]['name'] is a string key (which it is for keyof DicomTags)
      rawTags = await readDicomTagsFromItk(
        firstFileOfSeries,
        HIERARCHY_TAG_SPECS,
      );
    } catch (error) {
      console.error(
        `Failed to read tags for series (first file: ${firstFileOfSeries.name}):`,
        error,
      );
      continue; // Skip this series if tags can't be read
    }

    // Cast to Partial<DicomTags> after ensuring values are string
    const tags: Partial<DicomTags> = rawTags as Partial<DicomTags>;

    // Step 2b: Extract required identifiers
    const patientID = getTag(tags, 'PatientID', 'ANONYMOUS_PATIENT_ID'); // Fallback if PatientID is missing
    const studyInstanceUID = getTag(tags, 'StudyInstanceUID');
    const seriesInstanceUID = getTag(tags, 'SeriesInstanceUID');

    if (!studyInstanceUID || !seriesInstanceUID) {
      console.warn(
        `Skipping series due to missing StudyInstanceUID or SeriesInstanceUID. First file: ${firstFileOfSeries.name}`,
      );
      continue;
    }

    // Step 2c: Get or create Patient object
    let patient = patientsMap.get(patientID);
    if (!patient) {
      patient = {
        id: patientID,
        patientID: patientID,
        patientName: getTag(tags, 'PatientName', 'Anonymous'),
        patientBirthDate: getTag(tags, 'PatientBirthDate'),
        patientSex: getTag(tags, 'PatientSex'),
        studies: [],
      };
      patientsMap.set(patientID, patient);
    }

    // Step 2d: Get or create Study object within the Patient
    let study = patient.studies.find(
      (s) => s.studyInstanceUID === studyInstanceUID,
    );
    if (!study) {
      study = {
        id: studyInstanceUID,
        studyInstanceUID: studyInstanceUID,
        studyDate: getTag(tags, 'StudyDate'),
        studyTime: getTag(tags, 'StudyTime'),
        studyDescription: getTag(tags, 'StudyDescription'),
        accessionNumber: getTag(tags, 'AccessionNumber'),
        series: [],
      } as Study; // Added 'as Study' for type explicitness
      patient.studies.push(study);
    }

    // Step 2e: Create Series object and add it to the Study
    // Check if series already exists (e.g. if splitAndSort produced non-unique keys for same series, though unlikely with UID)
    let series = study.series.find(
      (s) => s.seriesInstanceUID === seriesInstanceUID,
    );
    if (!series) {
      series = {
        id: seriesInstanceUID,
        seriesInstanceUID: seriesInstanceUID,
        modality: getTag(tags, 'Modality'),
        seriesNumber: getTag(tags, 'SeriesNumber'),
        seriesDescription: getTag(tags, 'SeriesDescription'),
        numberOfSlices: seriesFiles.length, // Derived from the number of files in the group
        files: seriesFiles,
      } as Series; // Added 'as Series' for type explicitness
      study.series.push(series);
    } else {
      // This case should ideally not happen if seriesInstanceUID is unique and correctly used by groupFilesBySeries
      // However, if it could, one might merge files or update info:
      // series.files.push(...seriesFiles); // Example: merge files
      // series.numberOfSlices = series.files.length;
      console.warn(
        `Series ${seriesInstanceUID} already exists in study ${studyInstanceUID}. Files may be duplicated or split incorrectly.`,
      );
    }
  }

  return Array.from(patientsMap.values());
}

// Example of how this might be used (optional, for testing purposes):
/*
async function testHierarchyParser(fileList: FileList) {
  if (!fileList) return;
  const files = Array.from(fileList);
  try {
    const patients = await parseDicomHierarchy(files);
    console.log('Parsed DICOM Hierarchy:', JSON.stringify(patients, null, 2));
    // Now you can use this structured data to update your Zustand store or UI
  } catch (error) {
    console.error('Error parsing DICOM hierarchy:', error);
  }
}
*/

// Note: Ensure `FileWithPath` from react-dropzone is handled if you pass those directly.
// The `File` type is generally compatible.
