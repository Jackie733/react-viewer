import MeasurementTools from './MeasurementTools';
import ViewLayout from './ViewLayout';

export default function ToolModule() {
  return (
    <div className="flex items-center gap-1">
      <ViewLayout />
      <MeasurementTools />
    </div>
  );
}
