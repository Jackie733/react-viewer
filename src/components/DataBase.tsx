import { useState, useEffect } from 'react';
import { useDicomStore } from '@/store/dicom';
import { useRoiStore } from '@/store/roi';
import {
  PatientData,
  StudyData,
  ParsedRTStruct,
  ParsedRTDose,
  ParsedRTPlan,
  ParsedImage,
  ImageSeries,
  RTROI,
} from '@/io/dicomRTParser';
import { Info, Eye, EyeOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type SeriesData =
  | ImageSeries
  | ParsedRTStruct
  | ParsedRTDose
  | ParsedRTPlan
  | ParsedImage;

// 为没有颜色的ROI生成一个随机颜色
export function getROIColor(roi: RTROI): [number, number, number] {
  if (roi.color) {
    return roi.color;
  }

  // 基于ROI编号生成一个确定性颜色，保证每次渲染相同ROI有相同颜色
  const hue = (roi.roiNumber * 137.508) % 360; // 黄金角以获得良好的颜色分布

  // HSL转RGB，使用适中的饱和度和亮度
  const saturation = 0.75;
  const lightness = 0.6;

  // HSL到RGB转换
  const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = lightness - c / 2;

  let r, g, b;
  if (hue < 60) {
    [r, g, b] = [c, x, 0];
  } else if (hue < 120) {
    [r, g, b] = [x, c, 0];
  } else if (hue < 180) {
    [r, g, b] = [0, c, x];
  } else if (hue < 240) {
    [r, g, b] = [0, x, c];
  } else if (hue < 300) {
    [r, g, b] = [x, 0, c];
  } else {
    [r, g, b] = [c, 0, x];
  }

  // 转换为0-255范围
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

interface ExpandableItemProps {
  item: PatientData | StudyData | SeriesData | RTROI;
  type: 'patient' | 'study' | 'series' | 'roi';
  isExpanded: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}

const ExpandableListItem: React.FC<ExpandableItemProps> = ({
  item,
  type,
  isExpanded,
  onToggle,
  children,
}) => {
  let titleText = '';
  let detailLines: { label: string; value?: string }[] = [];
  const hasNestedChildren =
    type === 'patient' || type === 'study' || type === 'series';

  // 使用ROI可见性状态
  const { isRoiVisible, toggleRoiVisibility } = useRoiStore();

  if (type === 'patient') {
    const patient = item as PatientData;
    titleText = `${patient.patientName || patient.patientID || 'N/A'}`;
    detailLines = [
      { label: 'ID', value: patient.patientID },
      { label: 'DOB', value: patient.patientBirthDate },
      { label: 'Sex', value: patient.patientSex },
    ];
  } else if (type === 'study') {
    const study = item as StudyData;
    titleText = `${study.studyDescription || study.studyInstanceUID || 'N/A'}`;
    detailLines = [
      { label: 'UID', value: study.studyInstanceUID },
      { label: 'Date', value: study.studyDate },
      { label: 'Time', value: study.studyTime },
    ];
  } else if (type === 'series') {
    const series = item as SeriesData;
    titleText = `${series.seriesDescription || series.modality || series.seriesInstanceUID || 'N/A'}`;
    detailLines = [
      { label: 'UID', value: series.seriesInstanceUID },
      { label: 'Modality', value: series.modality },
      { label: '#', value: series.seriesNumber.toString() },
    ];
  } else if (type === 'roi') {
    const roi = item as RTROI;
    titleText = `${roi.roiName || roi.roiNumber.toString() || 'N/A'}`;
    const roiColor = getROIColor(roi);
    detailLines = [
      { label: 'Number', value: roi.roiNumber.toString() },
      { label: 'Description', value: roi.roiDescription },
      {
        label: 'Color',
        value: `RGB(${roiColor[0]}, ${roiColor[1]}, ${roiColor[2]})${!roi.color ? ' (auto)' : ''}`,
      },
    ];
  }

  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
  const fullItemTitleForHover = `${typeLabel}: ${titleText}`;

  const validDetailLines = detailLines.filter((d) => d.value);

  return (
    <div className="flex flex-col text-sm">
      <div
        className="group relative flex cursor-default items-center justify-between rounded-sm py-1 pr-1 select-none"
        title={fullItemTitleForHover}
      >
        <div
          className="flex flex-grow items-center truncate"
          onClick={hasNestedChildren ? onToggle : undefined}
          style={{ cursor: hasNestedChildren ? 'pointer' : 'default' }}
        >
          {hasNestedChildren && !!children ? (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className="mr-1 inline-flex h-4 w-4 flex-shrink-0 cursor-pointer items-center justify-center text-gray-500 dark:text-gray-400"
            >
              {isExpanded ? '▼' : '►'}
            </span>
          ) : (
            <span className="mr-1 h-4 w-4 flex-shrink-0" />
          )}
          <span className="flex items-center truncate text-xs text-gray-700 dark:text-gray-300">
            {type === 'roi' && (
              <span
                style={{
                  backgroundColor: `rgb(${getROIColor(item as RTROI).join(', ')})`,
                  width: '10px',
                  height: '10px',
                  borderRadius: '2px',
                  display: 'inline-block',
                  marginRight: '4px',
                  verticalAlign: 'middle',
                  border: '1px solid rgba(0,0,0,0.1)',
                }}
                title={`Color: ${(item as RTROI).color ? 'Original' : 'Auto-generated'}`}
              />
            )}
            <span className="mr-1 font-semibold text-gray-500 dark:text-gray-400">
              {typeLabel}:
            </span>
            <span>{titleText}</span>
          </span>
        </div>
        {/* 为ROI类型添加眼睛图标 */}
        {type === 'roi' && (
          <div
            className="ml-1 flex-shrink-0 cursor-pointer"
            title={
              isRoiVisible((item as RTROI).roiNumber) ? 'Hide ROI' : 'Show ROI'
            }
            onClick={(e) => {
              e.stopPropagation();
              toggleRoiVisibility((item as RTROI).roiNumber);
            }}
          >
            {isRoiVisible((item as RTROI).roiNumber) ? (
              <Eye size={16} className="text-blue-500 dark:text-blue-400" />
            ) : (
              <EyeOff size={16} className="text-gray-400 dark:text-gray-500" />
            )}
          </div>
        )}
        {validDetailLines.length > 0 && (
          <Dialog>
            <DialogTrigger asChild>
              <div
                className="ml-2 flex-shrink-0 cursor-pointer"
                title={`View ${typeLabel.toLowerCase()} details`}
              >
                <Info size={16} className="text-gray-400 dark:text-gray-500" />
              </div>
            </DialogTrigger>
            <DialogContent className="bg-white sm:max-w-[425px] dark:bg-gray-800">
              <DialogHeader>
                <DialogTitle className="text-gray-900 dark:text-white">
                  {titleText}
                </DialogTitle>
                <DialogDescription>{typeLabel}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-2 py-1 text-sm text-gray-700 dark:text-gray-300">
                {validDetailLines.map(
                  (detail: { label: string; value?: string }) => (
                    <div
                      key={detail.label}
                      className="flex gap-x-2 truncate"
                      title={`${detail.label}: ${detail.value}`}
                    >
                      <span className="font-semibold">{detail.label}:</span>
                      {detail.label === 'Color' && type === 'roi' ? (
                        <div className="flex items-center">
                          <span
                            style={{
                              backgroundColor: `rgb(${getROIColor(item as RTROI).join(', ')})`,
                              width: '14px',
                              height: '14px',
                              borderRadius: '2px',
                              display: 'inline-block',
                              marginRight: '6px',
                              border: '1px solid rgba(0,0,0,0.1)',
                            }}
                          />
                          <span className="truncate">{detail.value}</span>
                        </div>
                      ) : (
                        <span className="truncate">{detail.value}</span>
                      )}
                    </div>
                  ),
                )}
                {validDetailLines.length === 0 && <p>No details available.</p>}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {hasNestedChildren && isExpanded && (
        <div className="ml-2 flex flex-col gap-0.5 border-l border-gray-300 py-0.5 pl-3 dark:border-gray-600">
          {children}
        </div>
      )}
    </div>
  );
};

export function DataBase() {
  const patientHierarchy = useDicomStore((state) => state.patientHierarchy);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    const newExpandedItems: Record<string, boolean> = {};
    if (Array.isArray(patientHierarchy) && patientHierarchy.length > 0) {
      patientHierarchy.forEach((patient) => {
        const patientKey = `patient-${patient.patientID}`;
        newExpandedItems[patientKey] = true;
        patient.studies.forEach((study) => {
          const studyKey = `study-${study.studyInstanceUID}`;
          newExpandedItems[studyKey] = true;
          study.series
            .filter((s) => s.modality === 'RTSTRUCT')
            .forEach((s) => {
              const seriesKey = `series-${s.seriesInstanceUID}`;
              newExpandedItems[seriesKey] = true;
            });
        });
      });
    }
    setExpandedItems(newExpandedItems);
  }, [patientHierarchy]);

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  if (!Array.isArray(patientHierarchy) || patientHierarchy.length === 0) {
    return (
      <div className="p-3 text-sm text-gray-500 dark:text-gray-400">
        No DICOM data loaded.
      </div>
    );
  }

  return (
    <div className="flex max-h-[calc(100vh-150px)] flex-col gap-0.5 overflow-y-auto rounded-md bg-white p-1 text-xs dark:bg-gray-800">
      {patientHierarchy.map((patient: PatientData) => (
        <ExpandableListItem
          key={`patient-${patient.patientID}`}
          item={patient}
          type="patient"
          isExpanded={!!expandedItems[`patient-${patient.patientID}`]}
          onToggle={() => toggleExpand(`patient-${patient.patientID}`)}
        >
          {patient.studies.map((study: StudyData) => (
            <ExpandableListItem
              key={`study-${study.studyInstanceUID}`}
              item={study}
              type="study"
              isExpanded={!!expandedItems[`study-${study.studyInstanceUID}`]}
              onToggle={() => toggleExpand(`study-${study.studyInstanceUID}`)}
            >
              {study.series.map((seriesItem: SeriesData) => (
                <ExpandableListItem
                  key={`series-${seriesItem.seriesInstanceUID}`}
                  item={seriesItem}
                  type="series"
                  isExpanded={
                    !!expandedItems[`series-${seriesItem.seriesInstanceUID}`]
                  }
                  onToggle={() => {
                    if (seriesItem.modality === 'RTSTRUCT') {
                      toggleExpand(`series-${seriesItem.seriesInstanceUID}`);
                    }
                  }}
                >
                  {seriesItem.modality === 'RTSTRUCT' &&
                    (seriesItem as ParsedRTStruct).rois.map((roi) => (
                      <ExpandableListItem
                        key={`roi-${roi.roiNumber}`}
                        item={roi}
                        type="roi"
                        isExpanded={false}
                        onToggle={() => {
                          //
                        }}
                      />
                    ))}
                </ExpandableListItem>
              ))}
            </ExpandableListItem>
          ))}
        </ExpandableListItem>
      ))}
    </div>
  );
}
