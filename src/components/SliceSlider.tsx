import React, { useRef, useState, useEffect } from 'react';

interface SliceSliderProps {
  sliceIndex: number;
  maxSlice: number;
  onSliceChange: (slice: number) => void;
  className?: string;
}

const SliceSlider: React.FC<SliceSliderProps> = ({
  sliceIndex,
  maxSlice,
  onSliceChange,
  className = '',
}) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const updateSliceFromMousePosition = (clientY: number) => {
    if (!sliderRef.current || maxSlice === 0) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const relativeY = clientY - rect.top;
    const percentage = 1 - Math.min(Math.max(relativeY / rect.height, 0), 1);
    const newSlice = Math.round(percentage * maxSlice);

    if (newSlice !== sliceIndex) {
      onSliceChange(newSlice);
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      updateSliceFromMousePosition(e.clientY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, maxSlice, sliceIndex, onSliceChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updateSliceFromMousePosition(e.clientY);
  };

  // TODO: 需要优化，在上下边界时，滑块位置会超出边界
  const getPosition = () => {
    if (maxSlice <= 0) return '50%';

    const position = 100 - (sliceIndex / maxSlice) * 100;
    return `${position}%`;
  };

  const thumbPosition = getPosition();

  return (
    <div
      ref={sliderRef}
      className={`relative h-full w-6 cursor-pointer bg-black ${className}`}
      onMouseDown={handleMouseDown}
    >
      <div className="h-full py-2">
        <div className="mx-auto h-full w-0.5 bg-gray-600" />

        <div
          className="absolute left-1/2 h-8 w-3 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-gray-400 shadow-md"
          style={{ top: thumbPosition }}
        />
      </div>
    </div>
  );
};

export default SliceSlider;
