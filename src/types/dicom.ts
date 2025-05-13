export interface DicomFile {
  file: File;
  // Potentially pre-parsed basic tags if available early
  patientID?: string;
  studyInstanceUID?: string;
  seriesInstanceUID?: string;
}

export interface Series {
  id: string; // Usually SeriesInstanceUID
  seriesInstanceUID: string;
  modality?: string;
  seriesNumber?: string;
  seriesDescription?: string;
  numberOfSlices?: number;
  // Add other relevant series-level tags as needed, e.g., BodyPartExamined
  files: File[]; // The actual File objects for this series
  // Optional: Store the vtkImage or itkImage once built
  // vtkImageData?: any;
  // itkImage?: any;
}

export interface Study {
  id: string; // Usually StudyInstanceUID
  studyInstanceUID: string;
  studyDate?: string;
  studyTime?: string;
  studyDescription?: string;
  accessionNumber?: string;
  // Add other relevant study-level tags as needed
  series: Series[];
}

export interface Patient {
  id: string; // Usually PatientID, or a composite key if PatientID is not reliable
  patientID?: string;
  patientName?: string;
  patientBirthDate?: string;
  patientSex?: string;
  // Add other relevant patient-level tags as needed
  studies: Study[];
}

// For storing the flat list of tags read from a DICOM file initially
export interface DicomTags {
  // Patient Module
  PatientName?: string;
  PatientID?: string;
  PatientBirthDate?: string;
  PatientSex?: string;

  // Study Module
  StudyInstanceUID?: string;
  StudyDate?: string;
  StudyTime?: string;
  StudyDescription?: string;
  AccessionNumber?: string;

  // Series Module
  SeriesInstanceUID?: string;
  Modality?: string;
  SeriesNumber?: string;
  SeriesDescription?: string;
  NumberOfSlices?: string; // This might be derived (files.length) or from a tag. Changed to string for direct mapping from readTags.
  BodyPartExamined?: string;

  // Image Module / Instance Module (less critical for hierarchy but useful)
  InstanceNumber?: string;
  SOPInstanceUID?: string;

  // Other useful tags e.g. for display
  WindowLevel?: string; // Or string[] if multiple values
  WindowWidth?: string; // Or string[] if multiple values
}

// Defines the structure for tag specifications used with readTags
export interface TagSpec {
  name: keyof DicomTags; // Ensures name is one of the keys in DicomTags
  tag: string; // DICOM tag in format "GGGG|EEEE"
  strconv?: boolean; // if true, it indicates that the value might need string conversion/cleaning
}
