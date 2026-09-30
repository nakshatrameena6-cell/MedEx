import React from 'react';

export interface RiskSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
}

export const RiskSparkline: React.FC<RiskSparklineProps> = ({
  data,
  width = 60,
  height = 20,
  className = '',
}) => {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max === min ? 1 : max - min;

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg
      width={width}
      height={height}
      className={`inline-block overflow-visible ${className}`}
      aria-hidden="true"
    >
      <polyline
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};
