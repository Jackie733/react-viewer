import { RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

interface CameraResetButtonProps {
  onClick: () => void;
  className?: string;
}

const CameraResetButton: React.FC<CameraResetButtonProps> = ({
  onClick,
  className = '',
}) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      title="Reset Camera"
      className={`h-4 w-4 text-white ${className}`}
    >
      <RefreshCw />
    </Button>
  );
};

export default CameraResetButton;
