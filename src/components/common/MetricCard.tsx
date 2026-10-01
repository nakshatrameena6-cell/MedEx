import React from 'react';
import { KpiCard } from './KpiCard';

export interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  delta?: {
    value: number;
    label?: string;
    isPositiveGood?: boolean;
  };
  status?: any;
  subtext?: string;
  icon?: any;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  delta,
  status,
  subtext,
  icon,
  className,
}) => {
  return (
    <KpiCard
      title={title}
      value={value}
      unit={unit}
      delta={delta ? { value: delta.value, unit: delta.label } : undefined}
      status={status}
      subtext={subtext}
      icon={icon}
      className={className}
    />
  );
};
