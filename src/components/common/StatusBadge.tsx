import React from 'react';
import { RiskStatus } from '../../types/api';

interface StatusBadgeProps {
  status: RiskStatus | 'CYAN' | 'NEUTRAL';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'md',
  showDot = true,
}) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'RED':
        return 'status-badge-red';
      case 'AMBER':
        return 'status-badge-amber';
      case 'GREEN':
        return 'status-badge-green';
      case 'CYAN':
        return 'status-badge-cyan';
      default:
        return 'status-badge-neutral';
    }
  };

  const getDotStyle = () => {
    switch (status) {
      case 'RED':
        return 'bg-medex-red animate-pulse-subtle';
      case 'AMBER':
        return 'bg-medex-amber';
      case 'GREEN':
        return 'bg-medex-green';
      case 'CYAN':
        return 'bg-medex-cyan';
      default:
        return 'bg-medex-muted';
    }
  };

  const sizeClasses = {
    sm: 'text-2xs px-1.5 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3 py-1.5 font-semibold',
  };

  const displayLabel = label || status;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full uppercase tracking-wider font-mono ${getBadgeStyle()} ${sizeClasses[size]}`}
    >
      {showDot && (
        <span className={`h-1.5 w-1.5 rounded-full ${getDotStyle()}`} />
      )}
      {displayLabel}
    </span>
  );
};
