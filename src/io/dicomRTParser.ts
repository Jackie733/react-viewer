import dicomParser from 'dicom-parser';

// Constants for SOP Class UIDs
const RTStructSOPClassUID = '1.2.840.10008.5.1.4.1.1.481.3';
const RTDoseSOPClassUID = '1.2.840.10008.5.1.4.1.1.481.2';
const RTPlanSOPClassUID = '1.2.840.10008.5.1.4.1.1.481.5';

// Image SOP Class UIDs
const CTImageSOPClassUID = '1.2.840.10008.5.1.4.1.1.2';
const MRImageSOPClassUID = '1.2.840.10008.5.1.4.1.1.4';
const PETImageSOPClassUID = '1.2.840.10008.5.1.4.1.1.128';
const CRImageSOPClassUID = '1.2.840.10008.5.1.4.1.1.1';
const EnhancedCTImageSOPClassUID = '1.2.840.10008.5.1.4.1.1.2.1';
const EnhancedMRImageSOPClassUID = '1.2.840.10008.5.1.4.1.1.4.1';
const USImageSOPClassUID = '1.2.840.10008.5.1.4.1.1.6.1';
const XRayAngiographicImageSOPClassUID = '1.2.840.10008.5.1.4.1.1.12.1';

// Image SOP Class UID to Modality mapping
const SOP_CLASS_TO_MODALITY: Record<string, string> = {
  [CTImageSOPClassUID]: 'CT',
  [MRImageSOPClassUID]: 'MR',
  [PETImageSOPClassUID]: 'PT',
  [CRImageSOPClassUID]: 'CR',
  [EnhancedCTImageSOPClassUID]: 'CT',
  [EnhancedMRImageSOPClassUID]: 'MR',
  [USImageSOPClassUID]: 'US',
  [XRayAngiographicImageSOPClassUID]: 'XA',
};

// Helper functions for safe tag extraction
function getString(
  dataSet: dicomParser.DataSet,
  tag: string,
  defaultValue = '',
): string {
  try {
    return dataSet.string(tag) ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

function getOptionalString(
  dataSet: dicomParser.DataSet,
  tag: string,
): string | undefined {
  try {
    const value = dataSet.string(tag);
    return value === null ? undefined : value;
  } catch {
    return undefined;
  }
}

function getNumber(
  dataSet: dicomParser.DataSet,
  tag: string,
  defaultValue = 0,
): number {
  try {
    const value = dataSet.floatString(tag);
    if (value !== undefined) return value;
    const intValue = dataSet.intString(tag);
    return intValue === undefined ? defaultValue : intValue;
  } catch {
    try {
      const intValue = dataSet.intString(tag);
      return intValue === undefined ? defaultValue : intValue;
    } catch {
      return defaultValue;
    }
  }
}

function getOptionalNumber(
  dataSet: dicomParser.DataSet,
  tag: string,
): number | undefined {
  try {
    const value = dataSet.floatString(tag);
    if (value !== undefined) return value;
    const intValue = dataSet.intString(tag);
    return intValue;
  } catch {
    return undefined;
  }
}

function getNumberArray(
  dataSet: dicomParser.DataSet,
  tag: string,
  defaultValue: number[] = [],
): number[] {
  try {
    const element = dataSet.elements[tag];
    if (!element || element.length === 0) {
      return defaultValue;
    }

    const textDecoder = new TextDecoder();
    const valueBytes = new Uint8Array(
      dataSet.byteArray.buffer,
      dataSet.byteArray.byteOffset + element.dataOffset,
      element.length,
    );
    const fullString = textDecoder.decode(valueBytes).trim();

    if (fullString === '') {
      return defaultValue;
    }

    const stringValues = fullString.split('\\');
    const arr: number[] = [];
    for (const s of stringValues) {
      const trimmedS = s.trim();
      if (trimmedS.length > 0) {
        const num = parseFloat(trimmedS);
        if (!isNaN(num)) {
          arr.push(num);
        }
      }
    }
    return arr.length > 0 ? arr : defaultValue;
  } catch {
    return defaultValue;
  }
}

function getOptionalNumberArray(
  dataSet: dicomParser.DataSet,
  tag: string,
): number[] | undefined {
  try {
    const element = dataSet.elements[tag];
    if (!element || element.length === 0) {
      return undefined;
    }

    const textDecoder = new TextDecoder();
    const valueBytes = new Uint8Array(
      dataSet.byteArray.buffer,
      dataSet.byteArray.byteOffset + element.dataOffset,
      element.length,
    );
    const fullString = textDecoder.decode(valueBytes).trim();

    if (fullString === '') {
      return undefined;
    }

    const stringValues = fullString.split('\\');
    const arr: number[] = [];

    if (stringValues.length === 0) {
      return undefined;
    }

    for (let i = 0; i < stringValues.length; i++) {
      const s = stringValues[i];
      const trimmedS = s.trim();

      if (trimmedS.length > 0) {
        const num = parseFloat(trimmedS);
        if (!isNaN(num)) {
          arr.push(num);
        } else {
          return undefined;
        }
      } else {
        return undefined;
      }
    }
    return arr.length > 0 ? arr : undefined;
  } catch {
    return undefined;
  }
}

// --- New Interface Definitions ---

export interface SOPCommonData {
  sopClassUID: string;
  sopInstanceUID: string;
  seriesInstanceUID: string;
  studyInstanceUID: string;
  patientID: string;
  patientName?: string;
  patientBirthDate?: string;
  patientSex?: string;

  studyID?: string;
  studyDate?: string;
  studyTime?: string;
  accessionNumber?: string;
  referringPhysicianName?: string;
  studyDescription?: string;

  seriesNumber?: number;
  seriesDate?: string;
  seriesTime?: string;
  seriesDescription?: string;
  modality: string;
  instanceNumber?: number;
  bodyPartExamined?: string;
  patientPosition?: string;
  laterality?: string;
}

// RTSTRUCT Interfaces
export interface RTROIObservation {
  observationNumber: number;
  referencedROINumber: number;
  roiObservationLabel?: string;
  rtroiInterpretedType?: string;
  roiInterpreter?: string;
}

export interface ReferencedFrameOfReference {
  frameOfReferenceUID: string;
  rtReferencedStudySequence?: {
    referencedSOPClassUID: string;
    referencedSOPInstanceUID: string;
    rtReferencedSeriesSequence?: {
      seriesInstanceUID: string;
      contourImageSequence?: ContourImage[];
    }[];
  }[];
}

export interface ContourImage {
  referencedSOPClassUID: string;
  referencedSOPInstanceUID: string;
  referencedFrameNumber?: number[];
}

export interface ContourPoint {
  x: number;
  y: number;
  z: number;
}

export interface RTROIContour {
  contourNumber?: number;
  contourGeometricType: string;
  numberOfContourPoints: number;
  contourData: ContourPoint[];
  contourImageSequence?: ContourImage[];
  attachedContours?: number;
  contourSlabThickness?: number;
}

export interface RTROI {
  roiNumber: number;
  referencedFrameOfReferenceUID: string;
  roiName?: string;
  roiDescription?: string;
  roiGenerationAlgorithm?: string;
  roiGenerationDescription?: string;
  roiVolume?: number;
  rtroiContours: RTROIContour[];
}

export interface ParsedRTStruct {
  seriesInstanceUID: string;
  seriesDescription: string;
  seriesNumber: number;
  modality: string;
  sopCommon: SOPCommonData & {
    // Specific to RTStruct
    structureSetLabel: string;
    structureSetName?: string;
    structureSetDate?: string;
    structureSetTime?: string;
  };
  referencedFrameOfReferences: ReferencedFrameOfReference[];
  roiObservations: RTROIObservation[];
  rois: RTROI[];
  fileName: string;
}

// RTDOSE Interfaces
export interface DoseGridScaling {
  doseGridScaling?: number;
}

export interface PixelData {
  rows: number;
  columns: number;
  pixelSpacing: [number, number];
  imagePositionPatient: [number, number, number];
  imageOrientationPatient: [number, number, number, number, number, number];
  sliceThickness?: number;
  frameOfReferenceUID: string;
  samplesPerPixel: number;
  photometricInterpretation: string;
  bitsAllocated: number;
  bitsStored: number;
  highBit: number;
  pixelRepresentation: number;
  pixelData?: Int16Array | Uint16Array | Float32Array;
  numberOfFrames?: number;
  frameIncrementPointer?: string;
  gridFrameOffsetVector?: number[];
}

export interface ParsedRTDose {
  seriesInstanceUID: string;
  seriesDescription: string;
  seriesNumber: number;
  modality: string;
  sopCommon: SOPCommonData; // Uses the common set
  doseUnits: string;
  doseType: string;
  doseSummationType: string;
  doseGridScaling: DoseGridScaling;
  tissueHeterogeneityCorrection?: string[];
  dvhs?: {
    dvhType: string;
    doseUnits: string;
    dvhData: [number, number][];
    dvhReferencedROISequence?: { referencedROINumber: number }[];
  }[];
  pixelDataInfo: PixelData;
  fileName: string;
}

// RTPLAN Interfaces
export interface FractionGroup {
  fractionGroupNumber: number;
  numberOfFractionsPlanned?: number;
  numberOfBeams: number;
  numberOfBrachyApplicationSetups?: number;
  referencedBeams: ReferencedBeam[];
}

export interface ReferencedBeam {
  referencedBeamNumber: number;
}

export interface BeamLimitingDevicePosition {
  rtBeamLimitingDeviceType: string;
  leafJawPositions: number[];
}

export interface ControlPoint {
  controlPointIndex: number;
  nominalBeamEnergy?: number;
  doseRateSet?: number;
  gantryAngle?: number;
  beamLimitingDeviceAngle?: number;
  patientSupportAngle?: number;
  tableTopEccentricAngle?: number;
  tableTopPitchAngle?: number;
  tableTopRollAngle?: number;
  tableTopVerticalPosition?: number;
  tableTopLongitudinalPosition?: number;
  tableTopLateralPosition?: number;
  isocenterPosition?: [number, number, number];
  beamLimitingDevicePositionSequence?: BeamLimitingDevicePosition[];
  cumulativeMetersetWeight: number;
}

export interface Beam {
  beamNumber: number;
  beamName?: string;
  beamDescription?: string;
  beamType: string;
  radiationType: string;
  treatmentMachineName?: string;
  manufacturer?: string;
  institutionName?: string;
  primaryDosimeterUnit?: string;
  sourceAxisDistance?: number;
  beamLimitingDeviceSequence?: {
    rtBeamLimitingDeviceType: string;
    numberOfLeafJawPairs?: number;
    leafPositionBoundaries?: number[];
  }[];
  numberOfControlPoints: number;
  controlPointSequence: ControlPoint[];
  finalCumulativeMetersetWeight?: number;
  primaryFluenceModeSequence?: {
    fluenceMode: string;
    fluenceModeID?: string;
  }[];
}

export interface ParsedRTPlan {
  seriesInstanceUID: string;
  seriesDescription: string;
  seriesNumber: number;
  modality: string;
  sopCommon: SOPCommonData & {
    // Specific to RTPlan
    rtPlanLabel: string;
    rtPlanName?: string;
    rtPlanDate?: string;
    rtPlanTime?: string;
  };
  rtPlanGeometry: string;
  doseReferenceSequence?: {
    doseReferenceNumber: number;
    doseReferenceUID: string;
    doseReferenceStructureType: string;
    doseReferenceType: string;
    targetPrescriptionDose?: number;
    referencedROINumber?: number;
  }[];
  fractionGroups: FractionGroup[];
  beams: Beam[];
  toleranceTables?: {
    toleranceTableNumber: number;
    toleranceTableLabel?: string;
    gantryAngleTolerance?: number;
  }[];
  fileName: string;
}

// Hierarchical Data Structure
export interface ParsedDicomHierarchy {
  patients: PatientData[];
  unrecognizedFiles: { fileName: string; error?: string }[];
  errors: { fileName: string; message: string; details?: any }[];
}

export interface PatientData {
  patientID: string;
  patientName?: string;
  patientBirthDate?: string;
  patientSex?: string;
  studies: StudyData[];
}

export interface StudyData {
  studyInstanceUID: string;
  studyID?: string;
  studyDate?: string;
  studyTime?: string;
  accessionNumber?: string;
  referringPhysicianName?: string;
  studyDescription?: string;
  series: (
    | ParsedRTStruct
    | ParsedRTDose
    | ParsedRTPlan
    | ParsedImage
    | ImageSeries
  )[];
}

export interface WindowCenter {
  value: number;
  index?: number;
}

export interface WindowWidth {
  value: number;
  index?: number;
}

export interface VoiLut {
  windowCenter: WindowCenter[];
  windowWidth: WindowWidth[];
  function?: string;
}

export interface ParsedImage {
  seriesInstanceUID: string;
  seriesDescription: string;
  seriesNumber: number;
  modality: string;
  sopCommon: SOPCommonData;
  acquisitionNumber?: number;
  acquisitionDate?: string;
  acquisitionTime?: string;
  imageType?: string[];
  lossyImageCompression?: string;
  frameOfReferenceUID?: string;
  instanceUID: string;
  instanceNumber?: number;

  // Image specific attributes
  rows: number;
  columns: number;
  samplesPerPixel: number;
  photometricInterpretation: string;
  bitsAllocated: number;
  bitsStored: number;
  highBit: number;
  pixelRepresentation: number;
  pixelSpacing?: [number, number]; // [row spacing, column spacing] in mm
  sliceThickness?: number;
  sliceLocation?: number;
  imagePositionPatient?: [number, number, number]; // [x, y, z] in mm
  imageOrientationPatient?: [number, number, number, number, number, number]; // [row x, row y, row z, col x, col y, col z]
  rescaleIntercept?: number;
  rescaleSlope?: number;
  rescaleType?: string;

  // Window/level
  windowCenter?: number | number[];
  windowWidth?: number | number[];
  voiLutFunction?: string;

  // Enhanced multi-frame attributes
  numberOfFrames?: number;
  frameIncrementPointer?: string;
  gridFrameOffsetVector?: number[];

  // CT specific
  kvp?: number;
  exposureTime?: number;
  xRayTubeCurrent?: number;
  exposure?: number;

  // MR specific
  scanningSequence?: string[];
  sequenceVariant?: string[];
  scanOptions?: string[];
  repetitionTime?: number;
  echoTime?: number;
  inversionTime?: number;
  flipAngle?: number;

  // Transfer Syntax related
  transferSyntaxUID?: string;
  isCompressed?: boolean;

  // Pixel data will be handled separately during loading
  hasPixelData: boolean;

  fileName: string;
}

export interface ImageSeries {
  seriesInstanceUID: string;
  seriesDescription: string;
  seriesNumber: number;
  modality: string;

  // 基本系列信息
  frameOfReferenceUID?: string;
  seriesDate?: string;
  seriesTime?: string;

  // 图像相关共同属性
  rows: number;
  columns: number;
  samplesPerPixel: number;
  photometricInterpretation: string;
  bitsAllocated: number;
  bitsStored: number;
  highBit: number;
  pixelRepresentation: number;

  // 常见属性
  pixelSpacing?: [number, number];
  sliceThickness?: number;

  // 窗宽窗位默认值
  windowCenter?: number | number[];
  windowWidth?: number | number[];
  voiLutFunction?: string;

  // 实例集合
  instances: ParsedImage[];

  // 文件名 (使用第一个实例的文件名)
  fileName: string;
}

// --- Parsing Functions ---

// Generic function to populate SOPCommonData
function getSOPCommonData(dataSet: dicomParser.DataSet): SOPCommonData {
  return {
    sopClassUID: getString(dataSet, 'x00080016'),
    sopInstanceUID: getString(dataSet, 'x00080018'),
    seriesInstanceUID: getString(dataSet, 'x0020000e'),
    studyInstanceUID: getString(dataSet, 'x0020000d'),
    patientID: getString(dataSet, 'x00100020'),
    patientName: getOptionalString(dataSet, 'x00100010'),
    patientBirthDate: getOptionalString(dataSet, 'x00100030'),
    patientSex: getOptionalString(dataSet, 'x00100040'),
    studyID: getOptionalString(dataSet, 'x00200010'),
    studyDate: getOptionalString(dataSet, 'x00080020'),
    studyTime: getOptionalString(dataSet, 'x00080030'),
    accessionNumber: getOptionalString(dataSet, 'x00080050'),
    referringPhysicianName: getOptionalString(dataSet, 'x00080090'),
    studyDescription: getOptionalString(dataSet, 'x00081030'),
    seriesNumber: getOptionalNumber(dataSet, 'x00200011'),
    seriesDate: getOptionalString(dataSet, 'x00080021'),
    seriesTime: getOptionalString(dataSet, 'x00080031'),
    seriesDescription: getOptionalString(dataSet, 'x0008103e'),
    modality: getString(dataSet, 'x00080060'),
    instanceNumber: getOptionalNumber(dataSet, 'x00200013'),
    bodyPartExamined: getOptionalString(dataSet, 'x00180015'),
    patientPosition: getOptionalString(dataSet, 'x00185100'),
    laterality: getOptionalString(dataSet, 'x00200060'),
  };
}

function parseRTStruct(
  dataSet: dicomParser.DataSet,
  fileName: string,
): ParsedRTStruct {
  const sopCommonBase = getSOPCommonData(dataSet);
  const sopCommon: ParsedRTStruct['sopCommon'] = {
    ...sopCommonBase,
    structureSetLabel: getString(dataSet, 'x30060002'),
    structureSetName: getOptionalString(dataSet, 'x30060004'),
    structureSetDate: getOptionalString(dataSet, 'x30060008'),
    structureSetTime: getOptionalString(dataSet, 'x30060009'),
  };

  const referencedFrameOfReferences: ReferencedFrameOfReference[] = [];
  const structureSetROISequence = dataSet.elements.x30060020?.items ?? [];
  const roiContourSequenceItems = dataSet.elements.x30060039?.items ?? [];
  const rtROIObservationsSequence = dataSet.elements.x30060080?.items ?? [];
  const refFoRSeq = dataSet.elements.x30060010?.items ?? [];

  for (const refFoRItem of refFoRSeq) {
    const frameOfReferenceUID = getString(refFoRItem.dataSet!, 'x00200052');
    const rtReferencedStudySequenceItems =
      refFoRItem.dataSet!.elements.x30060012?.items ?? [];
    const rtReferencedStudySequence = rtReferencedStudySequenceItems.map(
      (studyItem) => {
        const rtReferencedSeriesSequenceItems =
          studyItem.dataSet!.elements.x30060014?.items ?? [];
        const innerRtReferencedSeriesSequence =
          rtReferencedSeriesSequenceItems.map((seriesItem) => {
            const contourImageSequenceItems =
              seriesItem.dataSet!.elements.x30060016?.items ?? [];
            const contourImageSequence = contourImageSequenceItems.map(
              (imgItem) => ({
                referencedSOPClassUID: getString(imgItem.dataSet!, 'x00081150'),
                referencedSOPInstanceUID: getString(
                  imgItem.dataSet!,
                  'x00081155',
                ),
                referencedFrameNumber: getOptionalNumberArray(
                  imgItem.dataSet!,
                  'x00081160',
                ),
              }),
            );
            return {
              seriesInstanceUID: getString(seriesItem.dataSet!, 'x0020000e'),
              contourImageSequence:
                contourImageSequence.length > 0
                  ? contourImageSequence
                  : undefined,
            };
          });
        return {
          referencedSOPClassUID: getString(studyItem.dataSet!, 'x00081150'),
          referencedSOPInstanceUID: getString(studyItem.dataSet!, 'x00081155'),
          rtReferencedSeriesSequence:
            innerRtReferencedSeriesSequence.length > 0
              ? innerRtReferencedSeriesSequence
              : undefined,
        };
      },
    );

    referencedFrameOfReferences.push({
      frameOfReferenceUID,
      rtReferencedStudySequence:
        rtReferencedStudySequence.length > 0
          ? rtReferencedStudySequence
          : undefined,
    });
  }

  const roiObservations: RTROIObservation[] = rtROIObservationsSequence.map(
    (item) => ({
      observationNumber: getNumber(item.dataSet!, 'x30060082'),
      referencedROINumber: getNumber(item.dataSet!, 'x30060084'),
      roiObservationLabel: getOptionalString(item.dataSet!, 'x30060085'),
      rtroiInterpretedType: getOptionalString(item.dataSet!, 'x300600a4'),
      roiInterpreter: getOptionalString(item.dataSet!, 'x300600a6'),
    }),
  );

  const rois: RTROI[] = structureSetROISequence.map((roiItem) => {
    const roiNumber = getNumber(roiItem.dataSet!, 'x30060022');
    const referencedFrameOfReferenceUID = getString(
      roiItem.dataSet!,
      'x30060024',
    );
    const roiName = getOptionalString(roiItem.dataSet!, 'x30060026');
    const roiDescription = getOptionalString(roiItem.dataSet!, 'x30060028');
    const roiGenerationAlgorithm = getOptionalString(
      roiItem.dataSet!,
      'x30060036',
    );
    const roiGenerationDescription = getOptionalString(
      roiItem.dataSet!,
      'x30060038',
    );
    const roiVolume = getOptionalNumber(roiItem.dataSet!, 'x3006002a');

    const rtcontoursForThisROI: RTROIContour[] = [];
    const matchingRoiContourItem = roiContourSequenceItems.find(
      (item) => getNumber(item.dataSet!, 'x30060084') === roiNumber,
    );

    if (matchingRoiContourItem) {
      const contourSequenceItems =
        matchingRoiContourItem.dataSet!.elements.x30060040?.items ?? [];
      for (const contour of contourSequenceItems) {
        const contourImageSeqItems =
          contour.dataSet!.elements.x30060016?.items ?? [];
        const contourImageSequence: ContourImage[] = contourImageSeqItems.map(
          (imgItem) => ({
            referencedSOPClassUID: getString(imgItem.dataSet!, 'x00081150'),
            referencedSOPInstanceUID: getString(imgItem.dataSet!, 'x00081155'),
            referencedFrameNumber: getOptionalNumberArray(
              imgItem.dataSet!,
              'x00081160',
            ),
          }),
        );

        const contourDataRaw = getNumberArray(contour.dataSet!, 'x30060050');
        const contourPoints: ContourPoint[] = [];
        for (let i = 0; i < contourDataRaw.length; i += 3) {
          contourPoints.push({
            x: contourDataRaw[i],
            y: contourDataRaw[i + 1],
            z: contourDataRaw[i + 2],
          });
        }

        rtcontoursForThisROI.push({
          contourNumber: getOptionalNumber(contour.dataSet!, 'x30060048'),
          contourGeometricType: getString(contour.dataSet!, 'x30060042'),
          numberOfContourPoints: getNumber(contour.dataSet!, 'x30060046'),
          contourData: contourPoints,
          contourImageSequence:
            contourImageSequence.length > 0 ? contourImageSequence : undefined,
          attachedContours: getOptionalNumber(contour.dataSet!, 'x30060049'),
          contourSlabThickness: getOptionalNumber(
            contour.dataSet!,
            'x30060044',
          ),
        });
      }
    }

    return {
      roiNumber,
      referencedFrameOfReferenceUID,
      roiName,
      roiDescription,
      roiGenerationAlgorithm,
      roiGenerationDescription,
      roiVolume,
      rtroiContours: rtcontoursForThisROI,
    };
  });
  const seriesInstanceUID = getString(dataSet, 'x0020000e');
  const seriesDescription = getOptionalString(dataSet, 'x0008103e');
  const seriesNumber = getOptionalNumber(dataSet, 'x00200011');
  const modality = getString(dataSet, 'x00080060');

  return {
    sopCommon,
    seriesInstanceUID,
    seriesDescription: seriesDescription ?? '',
    seriesNumber: seriesNumber ?? 0,
    modality,
    referencedFrameOfReferences,
    roiObservations,
    rois,
    fileName,
  };
}

function parseRTDose(
  dataSet: dicomParser.DataSet,
  fileName: string,
): ParsedRTDose {
  const sopCommon = getSOPCommonData(dataSet);

  const dvhSequenceItems = dataSet.elements.x30040050?.items ?? [];
  const dvhs = dvhSequenceItems.map((item) => {
    const dvhDataRaw = getNumberArray(item.dataSet!, 'x30040058');
    const dvhData: [number, number][] = [];
    for (let i = 0; i < dvhDataRaw.length; i += 2) {
      if (dvhDataRaw[i + 1] !== undefined) {
        dvhData.push([dvhDataRaw[i], dvhDataRaw[i + 1]]);
      }
    }
    const dvhReferencedROISequenceItems =
      item.dataSet!.elements.x30040060?.items ?? [];
    const dvhReferencedROISequence = dvhReferencedROISequenceItems.map(
      (roiItem) => ({
        referencedROINumber: getNumber(roiItem.dataSet!, 'x30060084'),
      }),
    );
    return {
      dvhType: getString(item.dataSet!, 'x30040052'),
      doseUnits: getString(item.dataSet!, 'x30040002'),
      dvhData,
      dvhReferencedROISequence:
        dvhReferencedROISequence.length > 0
          ? dvhReferencedROISequence
          : undefined,
    };
  });

  const psArray = getNumberArray(dataSet, 'x00280030');
  const pixelSpacing: [number, number] =
    psArray.length === 2 ? (psArray as [number, number]) : [1, 1];

  const ippArray = getNumberArray(dataSet, 'x00200032');
  const imagePositionPatient: [number, number, number] =
    ippArray.length === 3 ? (ippArray as [number, number, number]) : [0, 0, 0];

  const iopArray = getNumberArray(dataSet, 'x00200037');
  const imageOrientationPatient: [
    number,
    number,
    number,
    number,
    number,
    number,
  ] =
    iopArray.length === 6
      ? (iopArray as [number, number, number, number, number, number])
      : [1, 0, 0, 0, 1, 0];

  const pixelDataInfo: PixelData = {
    rows: getNumber(dataSet, 'x00280010'),
    columns: getNumber(dataSet, 'x00280011'),
    pixelSpacing: pixelSpacing,
    imagePositionPatient: imagePositionPatient,
    imageOrientationPatient: imageOrientationPatient,
    sliceThickness: getOptionalNumber(dataSet, 'x00180050'),
    frameOfReferenceUID: getString(dataSet, 'x00200052'),
    samplesPerPixel: getNumber(dataSet, 'x00280002', 1),
    photometricInterpretation: getString(dataSet, 'x00280004'),
    bitsAllocated: getNumber(dataSet, 'x00280100'),
    bitsStored: getNumber(dataSet, 'x00280101'),
    highBit: getNumber(dataSet, 'x00280102'),
    pixelRepresentation: getNumber(dataSet, 'x00280103'),
    numberOfFrames: getOptionalNumber(dataSet, 'x00280008'),
    frameIncrementPointer: getOptionalString(dataSet, 'x00280009'),
    gridFrameOffsetVector: getOptionalNumberArray(dataSet, 'x3004000c'),
  };

  const thcStrings: string[] = [];
  const numThc = dataSet.numStringValues('x30040014');
  if (numThc !== undefined) {
    for (let i = 0; i < numThc; i++) {
      const val = dataSet.string('x30040014', i);
      if (val) thcStrings.push(val);
    }
  }

  return {
    seriesInstanceUID: getString(dataSet, 'x0020000e'),
    seriesDescription: getOptionalString(dataSet, 'x0008103e') ?? '',
    seriesNumber: getOptionalNumber(dataSet, 'x00200011') ?? 0,
    modality: getString(dataSet, 'x00080060'),
    sopCommon,
    doseUnits: getString(dataSet, 'x30040002'),
    doseType: getString(dataSet, 'x30040004'),
    doseSummationType: getString(dataSet, 'x3004000a'),
    doseGridScaling: {
      doseGridScaling: getOptionalNumber(dataSet, 'x3004000e'),
    },
    tissueHeterogeneityCorrection:
      thcStrings.length > 0 ? thcStrings : undefined,
    dvhs: dvhs.length > 0 ? dvhs : undefined,
    pixelDataInfo,
    fileName,
  };
}

function parseRTPlan(
  dataSet: dicomParser.DataSet,
  fileName: string,
): ParsedRTPlan {
  const sopCommonBase = getSOPCommonData(dataSet);
  const sopCommon: ParsedRTPlan['sopCommon'] = {
    ...sopCommonBase,
    rtPlanLabel: getString(dataSet, 'x300a0002'),
    rtPlanName: getOptionalString(dataSet, 'x300a0003'),
    rtPlanDate: getOptionalString(dataSet, 'x300a0006'),
    rtPlanTime: getOptionalString(dataSet, 'x300a0007'),
  };

  const doseReferenceSequenceItems = dataSet.elements.x300a0010?.items ?? [];
  const doseReferenceSequence = doseReferenceSequenceItems.map((item) => ({
    doseReferenceNumber: getNumber(item.dataSet!, 'x300a0012'),
    doseReferenceUID: getString(item.dataSet!, 'x300a0013'),
    doseReferenceStructureType: getString(item.dataSet!, 'x300a0014'),
    doseReferenceType: getString(item.dataSet!, 'x300a001a'),
    targetPrescriptionDose: getOptionalNumber(item.dataSet!, 'x300a0026'),
    referencedROINumber: getOptionalNumber(item.dataSet!, 'x30060084'),
  }));

  const fractionGroupSequenceItems = dataSet.elements.x300a0070?.items ?? [];
  const fractionGroups: FractionGroup[] = fractionGroupSequenceItems.map(
    (item) => {
      const referencedBeamSequenceItems =
        item.dataSet!.elements.x300a0080?.items ?? [];
      const referencedBeams: ReferencedBeam[] = referencedBeamSequenceItems.map(
        (beamItem) => ({
          referencedBeamNumber: getNumber(beamItem.dataSet!, 'x300c0006'),
        }),
      );
      return {
        fractionGroupNumber: getNumber(item.dataSet!, 'x300a0071'),
        numberOfFractionsPlanned: getOptionalNumber(item.dataSet!, 'x300a0078'),
        numberOfBeams: getNumber(item.dataSet!, 'x300a007a'),
        numberOfBrachyApplicationSetups: getOptionalNumber(
          item.dataSet!,
          'x300a007c',
        ),
        referencedBeams,
      };
    },
  );

  const beamSequenceItems = dataSet.elements.x300a00b0?.items ?? [];
  const beams: Beam[] = beamSequenceItems.map((beamItem) => {
    const controlPointSequenceItems =
      beamItem.dataSet!.elements.x300a0111?.items ?? [];
    const controlPointSequence: ControlPoint[] = controlPointSequenceItems.map(
      (cpItem) => {
        const bldSeqItems = cpItem.dataSet!.elements.x300a011a?.items ?? [];
        const beamLimitingDevicePositionSequence: BeamLimitingDevicePosition[] =
          bldSeqItems.map((bldItem) => ({
            rtBeamLimitingDeviceType: getString(bldItem.dataSet!, 'x300a00b8'),
            leafJawPositions: getNumberArray(bldItem.dataSet!, 'x300a011c'),
          }));

        const isocenterPosArray = getOptionalNumberArray(
          cpItem.dataSet!,
          'x300a012c',
        );
        const isocenterPosition: [number, number, number] | undefined =
          isocenterPosArray && isocenterPosArray.length === 3
            ? (isocenterPosArray as [number, number, number])
            : undefined;

        return {
          controlPointIndex: getNumber(cpItem.dataSet!, 'x300a0112'),
          nominalBeamEnergy: getOptionalNumber(cpItem.dataSet!, 'x300a0114'),
          doseRateSet: getOptionalNumber(cpItem.dataSet!, 'x300a0115'),
          gantryAngle: getOptionalNumber(cpItem.dataSet!, 'x300a011e'),
          beamLimitingDeviceAngle: getOptionalNumber(
            cpItem.dataSet!,
            'x300a0120',
          ),
          patientSupportAngle: getOptionalNumber(cpItem.dataSet!, 'x300a0122'),
          tableTopEccentricAngle: getOptionalNumber(
            cpItem.dataSet!,
            'x300a0124',
          ),
          tableTopPitchAngle: getOptionalNumber(cpItem.dataSet!, 'x300a0232'),
          tableTopRollAngle: getOptionalNumber(cpItem.dataSet!, 'x300a0234'),
          tableTopVerticalPosition: getOptionalNumber(
            cpItem.dataSet!,
            'x300a0128',
          ),
          tableTopLongitudinalPosition: getOptionalNumber(
            cpItem.dataSet!,
            'x300a0129',
          ),
          tableTopLateralPosition: getOptionalNumber(
            cpItem.dataSet!,
            'x300a012a',
          ),
          isocenterPosition: isocenterPosition,
          beamLimitingDevicePositionSequence:
            beamLimitingDevicePositionSequence.length > 0
              ? beamLimitingDevicePositionSequence
              : undefined,
          cumulativeMetersetWeight: getNumber(cpItem.dataSet!, 'x300a0134'),
        };
      },
    );

    const beamLimitingDeviceSequenceItems =
      beamItem.dataSet!.elements.x300a00b6?.items ?? [];
    const beamLimitingDeviceSequence = beamLimitingDeviceSequenceItems.map(
      (bldItem) => ({
        rtBeamLimitingDeviceType: getString(bldItem.dataSet!, 'x300a00b8'),
        numberOfLeafJawPairs: getOptionalNumber(bldItem.dataSet!, 'x300a00bc'),
        leafPositionBoundaries: getOptionalNumberArray(
          bldItem.dataSet!,
          'x300a00be',
        ),
      }),
    );

    const primaryFluenceModeSequenceItems =
      beamItem.dataSet!.elements.x300a0611?.items ?? [];
    const primaryFluenceModeSequence = primaryFluenceModeSequenceItems.map(
      (pfmItem) => ({
        fluenceMode: getString(pfmItem.dataSet!, 'x300a0612'),
        fluenceModeID: getOptionalString(pfmItem.dataSet!, 'x300a0613'),
      }),
    );

    return {
      beamNumber: getNumber(beamItem.dataSet!, 'x300a00c0'),
      beamName: getOptionalString(beamItem.dataSet!, 'x300a00c2'),
      beamDescription: getOptionalString(beamItem.dataSet!, 'x300a00c3'),
      beamType: getString(beamItem.dataSet!, 'x300a00c4'),
      radiationType: getString(beamItem.dataSet!, 'x300a00c6'),
      treatmentMachineName: getOptionalString(beamItem.dataSet!, 'x300a00b2'),
      manufacturer: getOptionalString(beamItem.dataSet!, 'x00080070'),
      institutionName: getOptionalString(beamItem.dataSet!, 'x00080080'),
      primaryDosimeterUnit: getOptionalString(beamItem.dataSet!, 'x300a00b3'),
      sourceAxisDistance: getOptionalNumber(beamItem.dataSet!, 'x300a00b4'),
      beamLimitingDeviceSequence:
        beamLimitingDeviceSequence.length > 0
          ? beamLimitingDeviceSequence
          : undefined,
      numberOfControlPoints: getNumber(beamItem.dataSet!, 'x300a0110'),
      controlPointSequence,
      finalCumulativeMetersetWeight: getOptionalNumber(
        beamItem.dataSet!,
        'x300a010e',
      ),
      primaryFluenceModeSequence:
        primaryFluenceModeSequence.length > 0
          ? primaryFluenceModeSequence
          : undefined,
    };
  });

  const toleranceTableSequenceItems = dataSet.elements.x300a0040?.items ?? [];
  const toleranceTables = toleranceTableSequenceItems.map((item) => ({
    toleranceTableNumber: getNumber(item.dataSet!, 'x300a0042'),
    toleranceTableLabel: getOptionalString(item.dataSet!, 'x300a0043'),
    gantryAngleTolerance: getOptionalNumber(item.dataSet!, 'x300a0044'),
  }));

  return {
    seriesInstanceUID: getString(dataSet, 'x0020000e'),
    seriesDescription: getOptionalString(dataSet, 'x0008103e') ?? '',
    seriesNumber: getOptionalNumber(dataSet, 'x00200011') ?? 0,
    modality: getString(dataSet, 'x00080060'),
    sopCommon,
    rtPlanGeometry: getString(dataSet, 'x300a000c'),
    doseReferenceSequence:
      doseReferenceSequence.length > 0 ? doseReferenceSequence : undefined,
    fractionGroups,
    beams,
    toleranceTables: toleranceTables.length > 0 ? toleranceTables : undefined,
    fileName,
  };
}

function parseImage(
  dataSet: dicomParser.DataSet,
  fileName: string,
): ParsedImage {
  const sopCommon = getSOPCommonData(dataSet);

  // Get image type as array
  const imageTypeStr = getOptionalString(dataSet, 'x00080008');
  const imageType = imageTypeStr ? imageTypeStr.split('\\') : undefined;

  // Get window/level information
  const windowCenterValues = getOptionalNumberArray(dataSet, 'x00281050');
  const windowWidthValues = getOptionalNumberArray(dataSet, 'x00281051');
  const windowCenter =
    windowCenterValues && windowCenterValues.length === 1
      ? windowCenterValues[0]
      : windowCenterValues;
  const windowWidth =
    windowWidthValues && windowWidthValues.length === 1
      ? windowWidthValues[0]
      : windowWidthValues;

  // Get pixel spacing information
  const pixelSpacingArray = getOptionalNumberArray(dataSet, 'x00280030');
  const pixelSpacing =
    pixelSpacingArray && pixelSpacingArray.length === 2
      ? ([pixelSpacingArray[0], pixelSpacingArray[1]] as [number, number])
      : undefined;

  // Get patient position information
  const imagePositionPatientArray = getOptionalNumberArray(
    dataSet,
    'x00200032',
  );
  const imagePositionPatient =
    imagePositionPatientArray && imagePositionPatientArray.length === 3
      ? ([
          imagePositionPatientArray[0],
          imagePositionPatientArray[1],
          imagePositionPatientArray[2],
        ] as [number, number, number])
      : undefined;

  // Get orientation information
  const imageOrientationPatientArray = getOptionalNumberArray(
    dataSet,
    'x00200037',
  );
  const imageOrientationPatient =
    imageOrientationPatientArray && imageOrientationPatientArray.length === 6
      ? ([
          imageOrientationPatientArray[0],
          imageOrientationPatientArray[1],
          imageOrientationPatientArray[2],
          imageOrientationPatientArray[3],
          imageOrientationPatientArray[4],
          imageOrientationPatientArray[5],
        ] as [number, number, number, number, number, number])
      : undefined;

  // Get MR specific parameters
  const scanningSequenceStr = getOptionalString(dataSet, 'x00180020');
  const scanningSequence = scanningSequenceStr
    ? scanningSequenceStr.split('\\')
    : undefined;

  const sequenceVariantStr = getOptionalString(dataSet, 'x00180021');
  const sequenceVariant = sequenceVariantStr
    ? sequenceVariantStr.split('\\')
    : undefined;

  const scanOptionsStr = getOptionalString(dataSet, 'x00180022');
  const scanOptions = scanOptionsStr ? scanOptionsStr.split('\\') : undefined;

  // Check for transfer syntax and compression
  const transferSyntaxUID = getOptionalString(dataSet, 'x00020010');
  const isCompressed = transferSyntaxUID
    ? ![
        '1.2.840.10008.1.2',
        '1.2.840.10008.1.2.1',
        '1.2.840.10008.1.2.2',
      ].includes(transferSyntaxUID)
    : false;

  // Check if file has pixel data
  const hasPixelData = dataSet.elements.x7fe00010 !== undefined;

  const instanceUID = getString(dataSet, 'x00080018');
  const instanceNumber = getOptionalNumber(dataSet, 'x00200013') ?? 0;

  return {
    seriesInstanceUID: getString(dataSet, 'x0020000e'),
    seriesDescription: getOptionalString(dataSet, 'x0008103e') ?? '',
    seriesNumber: getOptionalNumber(dataSet, 'x00200011') ?? 0,
    modality: getString(dataSet, 'x00080060'),
    sopCommon,
    acquisitionNumber: getOptionalNumber(dataSet, 'x00200012'),
    acquisitionDate: getOptionalString(dataSet, 'x00080022'),
    acquisitionTime: getOptionalString(dataSet, 'x00080032'),
    imageType,
    lossyImageCompression: getOptionalString(dataSet, 'x00282110'),
    frameOfReferenceUID: getOptionalString(dataSet, 'x00200052'),
    instanceUID: instanceUID,
    instanceNumber: instanceNumber,

    // Image attributes
    rows: getNumber(dataSet, 'x00280010'),
    columns: getNumber(dataSet, 'x00280011'),
    samplesPerPixel: getNumber(dataSet, 'x00280002', 1),
    photometricInterpretation: getString(dataSet, 'x00280004'),
    bitsAllocated: getNumber(dataSet, 'x00280100'),
    bitsStored: getNumber(dataSet, 'x00280101'),
    highBit: getNumber(dataSet, 'x00280102'),
    pixelRepresentation: getNumber(dataSet, 'x00280103'),
    pixelSpacing,
    sliceThickness: getOptionalNumber(dataSet, 'x00180050'),
    sliceLocation: getOptionalNumber(dataSet, 'x00201041'),
    imagePositionPatient,
    imageOrientationPatient,
    rescaleIntercept: getOptionalNumber(dataSet, 'x00281052'),
    rescaleSlope: getOptionalNumber(dataSet, 'x00281053'),
    rescaleType: getOptionalString(dataSet, 'x00281054'),

    // Window/level
    windowCenter,
    windowWidth,
    voiLutFunction: getOptionalString(dataSet, 'x00281056'),

    // Enhanced multi-frame attributes
    numberOfFrames: getOptionalNumber(dataSet, 'x00280008'),
    frameIncrementPointer: getOptionalString(dataSet, 'x00280009'),
    gridFrameOffsetVector: getOptionalNumberArray(dataSet, 'x3004000c'),

    // CT specific
    kvp: getOptionalNumber(dataSet, 'x00180060'),
    exposureTime: getOptionalNumber(dataSet, 'x00181150'),
    xRayTubeCurrent: getOptionalNumber(dataSet, 'x00181151'),
    exposure: getOptionalNumber(dataSet, 'x00181152'),

    // MR specific
    scanningSequence,
    sequenceVariant,
    scanOptions,
    repetitionTime: getOptionalNumber(dataSet, 'x00180080'),
    echoTime: getOptionalNumber(dataSet, 'x00180081'),
    inversionTime: getOptionalNumber(dataSet, 'x00180084'),
    flipAngle: getOptionalNumber(dataSet, 'x00181314'),

    // Transfer Syntax
    transferSyntaxUID,
    isCompressed,

    hasPixelData,
    fileName,
  };
}

export async function readDicomRT(
  files: File[],
): Promise<ParsedDicomHierarchy> {
  const hierarchy: ParsedDicomHierarchy = {
    patients: [],
    unrecognizedFiles: [],
    errors: [],
  };

  // 第一阶段：临时存储所有图像，按系列分组
  const imageSeriesMap = new Map<
    string,
    Map<string, Map<string, ParsedImage>>
  >();

  for (const file of files) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const byteArray = new Uint8Array(arrayBuffer);
      const dataSet = dicomParser.parseDicom(byteArray);
      const commonData = getSOPCommonData(dataSet);

      // Find or create Patient
      let patientNode = hierarchy.patients.find(
        (p) => p.patientID === commonData.patientID,
      );
      if (!patientNode) {
        patientNode = {
          patientID: commonData.patientID,
          patientName: commonData.patientName,
          patientBirthDate: commonData.patientBirthDate,
          patientSex: commonData.patientSex,
          studies: [],
        };
        hierarchy.patients.push(patientNode);
      } else {
        // Update patient info if this file has more complete data (optional, simple overwrite for now)
        if (commonData.patientName && !patientNode.patientName)
          patientNode.patientName = commonData.patientName;
        if (commonData.patientBirthDate && !patientNode.patientBirthDate)
          patientNode.patientBirthDate = commonData.patientBirthDate;
        if (commonData.patientSex && !patientNode.patientSex)
          patientNode.patientSex = commonData.patientSex;
      }

      // Find or create Study
      let studyNode = patientNode.studies.find(
        (s) => s.studyInstanceUID === commonData.studyInstanceUID,
      );
      if (!studyNode) {
        studyNode = {
          studyInstanceUID: commonData.studyInstanceUID,
          studyID: commonData.studyID,
          studyDate: commonData.studyDate,
          studyTime: commonData.studyTime,
          accessionNumber: commonData.accessionNumber,
          referringPhysicianName: commonData.referringPhysicianName,
          studyDescription: commonData.studyDescription,
          series: [],
        };
        patientNode.studies.push(studyNode);
      } else {
        // Update study info (optional)
        if (commonData.studyID && !studyNode.studyID)
          studyNode.studyID = commonData.studyID;
        // ... (add other fields as needed)
      }

      // Parse the specific RT object and add it to the series
      if (commonData.sopClassUID === RTStructSOPClassUID) {
        const rtStruct = parseRTStruct(dataSet, file.name);
        // Check if it already exists with the same seriesInstanceUID
        const existingIndex = studyNode.series.findIndex(
          (item) =>
            'referencedFrameOfReferences' in item &&
            item.seriesInstanceUID === rtStruct.seriesInstanceUID,
        );

        if (existingIndex >= 0) {
          console.warn(
            `Study already has an RTStruct with series UID ${rtStruct.seriesInstanceUID}. Overwriting.`,
          );
          studyNode.series[existingIndex] = rtStruct;
        } else {
          studyNode.series.push(rtStruct);
        }
      } else if (commonData.sopClassUID === RTDoseSOPClassUID) {
        const rtDose = parseRTDose(dataSet, file.name);
        // Check if it already exists with the same seriesInstanceUID
        const existingIndex = studyNode.series.findIndex(
          (item) =>
            'doseUnits' in item &&
            item.seriesInstanceUID === rtDose.seriesInstanceUID,
        );

        if (existingIndex >= 0) {
          console.warn(
            `Study already has an RTDose with series UID ${rtDose.seriesInstanceUID}. Overwriting.`,
          );
          studyNode.series[existingIndex] = rtDose;
        } else {
          studyNode.series.push(rtDose);
        }
      } else if (commonData.sopClassUID === RTPlanSOPClassUID) {
        const rtPlan = parseRTPlan(dataSet, file.name);
        // Check if it already exists with the same seriesInstanceUID
        const existingIndex = studyNode.series.findIndex(
          (item) =>
            'rtPlanGeometry' in item &&
            item.seriesInstanceUID === rtPlan.seriesInstanceUID,
        );

        if (existingIndex >= 0) {
          console.warn(
            `Study already has an RTPlan with series UID ${rtPlan.seriesInstanceUID}. Overwriting.`,
          );
          studyNode.series[existingIndex] = rtPlan;
        } else {
          studyNode.series.push(rtPlan);
        }
      } else if (
        Object.keys(SOP_CLASS_TO_MODALITY).includes(commonData.sopClassUID) ||
        commonData.modality === 'CT' ||
        commonData.modality === 'MR' ||
        commonData.modality === 'PT' ||
        commonData.modality === 'CR' ||
        commonData.modality === 'US' ||
        commonData.modality === 'XA'
      ) {
        // 解析图像并暂存
        const parsedImage = parseImage(dataSet, file.name);

        // 按study和seriesInstanceUID组织图像
        const studyUID = commonData.studyInstanceUID;
        const seriesUID = parsedImage.seriesInstanceUID;
        const instanceUID = parsedImage.instanceUID;

        // 确保有这个study的映射
        if (!imageSeriesMap.has(studyUID)) {
          imageSeriesMap.set(
            studyUID,
            new Map<string, Map<string, ParsedImage>>(),
          );
        }

        // 确保有这个series的映射
        const studyMap = imageSeriesMap.get(studyUID)!;
        if (!studyMap.has(seriesUID)) {
          studyMap.set(seriesUID, new Map<string, ParsedImage>());
        }

        // 存储这个实例
        const seriesMap = studyMap.get(seriesUID)!;
        seriesMap.set(instanceUID, parsedImage);
      } else {
        const errorMessage = commonData.sopClassUID
          ? `Unsupported SOP Class UID: ${commonData.sopClassUID} for modality ${commonData.modality}`
          : 'SOP Class UID not found or unreadable';
        hierarchy.unrecognizedFiles.push({
          fileName: file.name,
          error: errorMessage,
        });
      }
    } catch (error: any) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown parsing error';
      hierarchy.errors.push({
        fileName: file.name,
        message: errorMessage,
        details: error,
      });
      if (!hierarchy.unrecognizedFiles.some((f) => f.fileName === file.name)) {
        hierarchy.unrecognizedFiles.push({
          fileName: file.name,
          error: errorMessage,
        });
      }
    }
  }

  // 第二阶段：构建图像系列
  for (const [studyUID, studyMap] of imageSeriesMap.entries()) {
    // 找到对应的study
    const patientIndex = hierarchy.patients.findIndex((patient) =>
      patient.studies.some((study) => study.studyInstanceUID === studyUID),
    );

    if (patientIndex >= 0) {
      const patient = hierarchy.patients[patientIndex];
      const studyIndex = patient.studies.findIndex(
        (study) => study.studyInstanceUID === studyUID,
      );

      if (studyIndex >= 0) {
        const study = patient.studies[studyIndex];

        // 处理每个图像系列
        for (const [seriesUID, instanceMap] of studyMap.entries()) {
          if (instanceMap.size === 0) continue;

          // 使用第一个实例作为系列信息的参考
          const instances = Array.from(instanceMap.values());
          const firstInstance = instances[0];

          // 创建图像系列
          const imageSeries: ImageSeries = {
            seriesInstanceUID: seriesUID,
            seriesDescription: firstInstance.seriesDescription,
            seriesNumber: firstInstance.seriesNumber,
            modality: firstInstance.modality,
            frameOfReferenceUID: firstInstance.frameOfReferenceUID,
            seriesDate: firstInstance.sopCommon.seriesDate,
            seriesTime: firstInstance.sopCommon.seriesTime,

            // 图像属性
            rows: firstInstance.rows,
            columns: firstInstance.columns,
            samplesPerPixel: firstInstance.samplesPerPixel,
            photometricInterpretation: firstInstance.photometricInterpretation,
            bitsAllocated: firstInstance.bitsAllocated,
            bitsStored: firstInstance.bitsStored,
            highBit: firstInstance.highBit,
            pixelRepresentation: firstInstance.pixelRepresentation,

            // 可选属性
            pixelSpacing: firstInstance.pixelSpacing,
            sliceThickness: firstInstance.sliceThickness,

            // 窗宽窗位
            windowCenter: firstInstance.windowCenter,
            windowWidth: firstInstance.windowWidth,
            voiLutFunction: firstInstance.voiLutFunction,

            // 实例列表 - 按instanceNumber排序
            instances: instances.sort(
              (a, b) => (a.instanceNumber ?? 0) - (b.instanceNumber ?? 0),
            ),

            fileName: firstInstance.fileName,
          };

          // 添加到study中
          study.series.push(imageSeries);
        }
      }
    }
  }

  return hierarchy;
}
