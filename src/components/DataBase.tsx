import { useState, useEffect } from 'react';
import { useDicomStore } from '@/store/dicom';
import { Patient, Study, Series } from '@/types/dicom';
import { Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

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
  const fullItemTitleForHover = `${typeLabel}: ${titleText}`;

  const validDetailLines = detailLines.filter((d) => d.value);

  return (
    <div
      style={{ paddingLeft: `${level * 0}px` }}
      className="flex flex-col text-sm"
    >
      <div
        className="group relative flex cursor-default items-center justify-between rounded-sm py-1 pr-1 select-none"
        title={fullItemTitleForHover}
      >
        <div
          className="flex flex-grow items-center truncate"
          onClick={hasNestedChildren ? onToggle : undefined}
          style={{ cursor: hasNestedChildren ? 'pointer' : 'default' }}
        >
          {hasNestedChildren ? (
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
          <span className="truncate text-xs text-gray-700 dark:text-gray-300">
            <span className="mr-1 font-semibold text-gray-500 dark:text-gray-400">
              {typeLabel}:
            </span>{' '}
            {titleText}
          </span>
        </div>

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
                      <span className="truncate">{detail.value}</span>
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
        const patientKey = `patient-${patient.id}`;
        newExpandedItems[patientKey] = true;
        patient.studies.forEach((study) => {
          const studyKey = `study-${study.id}`;
          newExpandedItems[studyKey] = true;
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
                  isExpanded={false}
                  onToggle={() => {
                    /* Series 点击主标题或展开图标无默认操作 */
                  }}
                />
              ))}
            </ExpandableListItem>
          ))}
        </ExpandableListItem>
      ))}
    </div>
  );
}
