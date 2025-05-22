export const CircularProgress: React.FC<{ progress: number }> = ({
  progress,
}) => {
  const radius = 10;
  const strokeWidth = 2;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const offset = circumference - (progress / 100) * circumference;
  const svgSize = (radius + strokeWidth) * 2;

  return (
    <svg
      className="ml-2 -rotate-90 transform"
      width={svgSize}
      height={svgSize}
      viewBox={`0 0 ${svgSize} ${svgSize}`}
    >
      <circle
        className="text-gray-300 dark:text-gray-300"
        strokeWidth={strokeWidth}
        stroke="currentColor"
        fill="transparent"
        r={normalizedRadius}
        cx={svgSize / 2}
        cy={svgSize / 2}
      />
      <circle
        className="text-blue-500"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        stroke="currentColor"
        fill="transparent"
        r={normalizedRadius}
        cx={svgSize / 2}
        cy={svgSize / 2}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy=".3em"
        className="origin-center rotate-90 text-xs text-gray-700 dark:text-gray-300"
        fill="currentColor"
      >
        {Math.round(progress)}
      </text>
    </svg>
  );
};
