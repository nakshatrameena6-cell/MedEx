import React from 'react';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';

export interface DeltaChipProps {
  value: number;
  unit?: string;
  className?: string;
}

export const DeltaChip: React.FC<DeltaChipProps> = ({
  value,
  unit = 'pts',
  className = '',
}) => {
  const isNegative = value < 0;
  const isZero = value === 0;

  const bgClass = isZero
    ? 'bg-theme-border/60 text-theme-muted'
    : isNegative
    ? 'bg-theme-critical-bg text-theme-critical-text'
    : 'bg-theme-healthy-bg text-theme-healthy-text';

  const Icon = isZero ? Minus : isNegative ? ArrowDown : ArrowUp;
  const absValue = Math.abs(value);

  return (
    <span
      className={`inline-flex items-center gap-1 h-6 px-2 rounded text-[12px] font-medium leading-none select-none ${bgClass} ${className}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.8} />
      <span>
        {absValue} {unit}
      </span>
    </span>
  );
};
