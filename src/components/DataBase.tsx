import { useState, useEffect } from 'react';
import { useDicomStore } from '@/store/dicom';
import { Patient, Study, Series } from '@/types/dicom';

interface ExpandableItemProps {
  item: Patient | Study | Series;
  type: 'patient' | 'study' | 'series';
  isExpanded: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
  level: number;
}

const ExpandableListItem: React.FC<ExpandableItemProps> = ({
  item,
  type,
  isExpanded,
  onToggle,
  children,
  level,
}) => {
  let titleText = '';
  let detailLines: { label: string; value?: string }[] = [];
  const hasNestedChildren = type === 'patient' || type === 'study';

  if (type === 'patient') {
    const patient = item as Patient;
    titleText = `${patient.patientName || patient.patientID || 'N/A'}`;
    detailLines = [
      { label: 'ID', value: patient.patientID },
      { label: 'DOB', value: patient.patientBirthDate },
      { label: 'Sex', value: patient.patientSex },
    ];
  } else if (type === 'study') {
    const study = item as Study;
    titleText = `${study.studyDescription || study.studyInstanceUID || 'N/A'}`;
    detailLines = [
      { label: 'UID', value: study.studyInstanceUID },
      { label: 'Date', value: study.studyDate },
      { label: 'Time', value: study.studyTime },
    ];
  } else if (type === 'series') {
    const series = item as Series;
    titleText = `${series.seriesDescription || series.modality || series.seriesInstanceUID || 'N/A'}`;
    detailLines = [
      { label: 'UID', value: series.seriesInstanceUID },
      { label: 'Modality', value: series.modality },
      { label: 'Slices', value: series.numberOfSlices?.toString() },
      { label: '#', value: series.seriesNumber },
    ];
  }

  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
  const fullItemTitle = `${typeLabel}: ${titleText}`;

  return (
    <div
      style={{ paddingLeft: `${level * 0}px` }}
      className="flex flex-col text-sm"
    >
      <div
        className="group flex cursor-pointer items-center rounded-sm py-1 pr-1 select-none hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={onToggle}
        title={fullItemTitle}
      >
        <span className="mr-1 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-200">
          {isExpanded ? '▼' : '►'}
        </span>
        <span className="truncate text-xs text-gray-700 dark:text-gray-300">
          <span className="mr-1 font-semibold text-gray-500 dark:text-gray-400">
            {typeLabel}:
          </span>{' '}
          {titleText}
        </span>
      </div>
      {isExpanded && (
        <div className="ml-2 flex flex-col gap-0.5 border-l border-gray-300 py-0.5 pl-3 text-xs text-gray-600 dark:border-gray-600 dark:text-gray-400">
          {detailLines
            .filter((d) => d.value)
            .map((detail) => (
              <div
                key={detail.label}
                className="truncate"
                title={`${detail.label}: ${detail.value}`}
              >
                <span>{detail.label}:</span> {detail.value}
              </div>
            ))}
          {hasNestedChildren && children}
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
        const patientKey = `patient-${patient.id}`;
        newExpandedItems[patientKey] = true;
        patient.studies.forEach((study) => {
          const studyKey = `study-${study.id}`;
          newExpandedItems[studyKey] = true;
          study.series.forEach((seriesItem) => {
            const seriesKey = `series-${seriesItem.id}`;
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
        未加载DICOM数据。
      </div>
    );
  }

  return (
    <div className="flex max-h-[calc(100vh-150px)] flex-col gap-0.5 overflow-y-auto rounded-md bg-white p-1 text-xs dark:bg-gray-800">
      {patientHierarchy.map((patient: Patient) => (
        <ExpandableListItem
          key={`patient-${patient.id}`}
          item={patient}
          type="patient"
          level={0}
          isExpanded={!!expandedItems[`patient-${patient.id}`]}
          onToggle={() => toggleExpand(`patient-${patient.id}`)}
        >
          {patient.studies.map((study: Study) => (
            <ExpandableListItem
              key={`study-${study.id}`}
              item={study}
              type="study"
              level={1}
              isExpanded={!!expandedItems[`study-${study.id}`]}
              onToggle={() => toggleExpand(`study-${study.id}`)}
            >
              {study.series.map((seriesItem: Series) => (
                <ExpandableListItem
                  key={`series-${seriesItem.id}`}
                  item={seriesItem}
                  type="series"
                  level={2}
                  isExpanded={!!expandedItems[`series-${seriesItem.id}`]}
                  onToggle={() => toggleExpand(`series-${seriesItem.id}`)}
                />
              ))}
            </ExpandableListItem>
          ))}
        </ExpandableListItem>
      ))}
    </div>
  );
}
