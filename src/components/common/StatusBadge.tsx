import React from 'react';
import { AlertTriangle, Clock, CheckCircle2, Info, Circle } from 'lucide-react';

export type StatusType =
  | 'RED'
  | 'AMBER'
  | 'GREEN'
  | 'CYAN'
  | 'NEUTRAL'
  | 'CRITICAL'
  | 'WATCH'
  | 'STABLE';

export interface StatusBadgeProps {
  status: StatusType | string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'md',
  className = '',
}) => {
  const normalized = String(status).toUpperCase();

  let Icon = Info;
  let bgClass = 'bg-theme-border/50 text-theme-muted';
  let textLabel = label;

  if (normalized === 'RED' || normalized === 'CRITICAL') {
    Icon = AlertTriangle;
    bgClass = 'bg-theme-critical-bg text-theme-critical-text';
    textLabel = label || 'Critical';
  } else if (normalized === 'AMBER' || normalized === 'WATCH' || normalized === 'WARNING') {
    Icon = Clock;
    bgClass = 'bg-theme-warning-bg text-theme-warning-text';
    textLabel = label || 'Watch';
  } else if (normalized === 'GREEN' || normalized === 'STABLE' || normalized === 'HEALTHY') {
    Icon = CheckCircle2;
    bgClass = 'bg-theme-healthy-bg text-theme-healthy-text';
    textLabel = label || 'Stable';
  } else if (normalized === 'CYAN' || normalized === 'PRIMARY') {
    Icon = Info;
    bgClass = 'bg-theme-primary-tint text-theme-primary';
    textLabel = label || 'Active';
  } else if (normalized === 'NEUTRAL') {
    Icon = Circle;
    bgClass = 'bg-theme-border/60 text-theme-muted';
    textLabel = label || 'Info';
  } else {
    textLabel = label || status;
  }

  const sizeClasses = {
    sm: 'h-6 px-2 text-[11px]',
    md: 'h-7 px-2.5 text-[12px]',
    lg: 'h-8 px-3 text-[13px]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-medium leading-none select-none ${sizeClasses[size]} ${bgClass} ${className}`}
    >
      <Icon className="w-4 h-4 shrink-0" strokeWidth={1.8} />
      <span>{textLabel}</span>
    </span>
  );
};
