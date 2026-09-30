import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  delta?: {
    value: number;
    label?: string;
    isPositiveGood?: boolean;
  };
  icon?: LucideIcon;
  status?: 'RED' | 'AMBER' | 'GREEN' | 'CYAN' | 'NEUTRAL';
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  subtext,
  delta,
  icon: Icon,
  status = 'NEUTRAL',
  className = '',
}) => {
  const getBorderColor = () => {
    switch (status) {
      case 'RED':
        return 'border-medex-red/40 hover:border-medex-red/60';
      case 'AMBER':
        return 'border-medex-amber/40 hover:border-medex-amber/60';
      case 'GREEN':
        return 'border-medex-green/40 hover:border-medex-green/60';
      case 'CYAN':
        return 'border-medex-cyan/40 hover:border-medex-cyan/60';
      default:
        return 'border-medex-border hover:border-medex-border-active';
    }
  };

  const getDeltaBadge = () => {
    if (!delta) return null;
    const isPositive = delta.value > 0;
    const isZero = delta.value === 0;

    let isGood = isPositive;
    if (delta.isPositiveGood === false) {
      isGood = !isPositive;
    }

    const colorClass = isZero
      ? 'text-medex-muted bg-medex-muted/10'
      : isGood
      ? 'text-medex-green-light bg-medex-green/15 border border-medex-green/30'
      : 'text-medex-red-light bg-medex-red/15 border border-medex-red/30';

    const DeltaIcon = isZero ? Minus : isPositive ? TrendingUp : TrendingDown;

    return (
      <span className={`inline-flex items-center gap-1 text-2xs px-1.5 py-0.5 rounded font-mono font-medium ${colorClass}`}>
        <DeltaIcon className="w-3 h-3" />
        <span>{delta.value > 0 ? `+${delta.value}` : delta.value}{delta.label || '%'}</span>
      </span>
    );
  };

  return (
    <div
      className={`medex-panel p-4 flex flex-col justify-between transition-all duration-150 ${getBorderColor()} ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-2xs font-semibold uppercase tracking-wider text-medex-secondary truncate">
          {title}
        </span>
        {Icon && (
          <div className="p-1.5 rounded-md bg-medex-elevated text-medex-cyan">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2 mt-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold font-mono tracking-tight text-medex-primary">
            {value}
          </span>
          {unit && (
            <span className="text-xs font-mono text-medex-muted">{unit}</span>
          )}
        </div>
        {getDeltaBadge()}
      </div>

      {subtext && (
        <p className="text-2xs text-medex-muted mt-2 pt-2 border-t border-medex-border-subtle truncate">
          {subtext}
        </p>
      )}
    </div>
  );
};
