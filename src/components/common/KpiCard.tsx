import React, { useState, useEffect } from 'react';
import { LucideIcon } from 'lucide-react';
import { DeltaChip } from './DeltaChip';
import { StatusBadge, StatusType } from './StatusBadge';
import { Card3D } from '../3d/Card3D';

export interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  delta?: {
    value: number;
    unit?: string;
  };
  status?: StatusType;
  subtext?: string;
  icon?: LucideIcon;
  className?: string;
  telemetryIndex?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  unit,
  delta,
  status,
  subtext,
  icon: Icon,
  className = '',
  telemetryIndex,
}) => {
  const [displayValue, setDisplayValue] = useState<string | number>(value);

  useEffect(() => {
    const numericVal = typeof value === 'number' ? value : parseFloat(String(value));
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isNaN(numericVal) || prefersReduced) {
      setDisplayValue(value);
      return;
    }

    const strVal = String(value);
    const isFloat = strVal.includes('.');
    const decimals = isFloat ? (strVal.split('.')[1]?.length || 1) : 0;
    const duration = 400;
    const startTime = performance.now();
    let frame = 0;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = numericVal * progress;

      setDisplayValue(decimals > 0 ? current.toFixed(decimals) : Math.round(current));

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  const glowColorMap: Record<string, string> = {
    RED: 'rgba(239, 68, 68, 0.22)',
    AMBER: 'rgba(245, 158, 11, 0.22)',
    GREEN: 'rgba(16, 185, 129, 0.22)',
    CYAN: 'rgba(45, 212, 191, 0.25)',
  };

  const currentGlow = status ? glowColorMap[status] || 'rgba(45, 212, 191, 0.2)' : 'rgba(45, 212, 191, 0.2)';

  return (
    <Card3D glowColor={currentGlow} className={`h-full ${className}`}>
      <div className="p-5 font-sans flex flex-col justify-between h-full space-y-3">
        {/* Header: Title, Telemetry Index & Optional Icon / Status */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {telemetryIndex && (
              <span className="font-mono text-[10px] text-theme-primary font-bold tracking-wider">
                {telemetryIndex}
              </span>
            )}
            <span className="text-[13px] font-medium text-theme-muted leading-tight">
              {title}
            </span>
          </div>

          {status ? (
            <StatusBadge status={status} size="sm" />
          ) : Icon ? (
            <div className="p-1.5 rounded-md bg-theme-primary-tint/20 text-theme-primary border border-theme-primary/20">
              <Icon className="w-4 h-4" strokeWidth={1.8} />
            </div>
          ) : null}
        </div>

        {/* Main KPI Value */}
        <div className="flex items-baseline gap-2 flex-wrap pt-1">
          <span className="metric-value text-[40px] font-medium text-theme-text leading-none">
            {displayValue}
          </span>
          {unit && (
            <span className="text-[13px] font-medium text-theme-muted font-mono">
              {unit}
            </span>
          )}
          {delta && (
            <div className="ml-auto">
              <DeltaChip value={delta.value} unit={delta.unit} />
            </div>
          )}
        </div>

        {/* Optional Subtext / Telemetry Bar */}
        <div className="pt-3 border-t border-theme-border flex items-center justify-between">
          {subtext ? (
            <p className="text-[11px] text-theme-muted leading-tight truncate">
              {subtext}
            </p>
          ) : (
            <span className="text-[10px] font-mono text-theme-muted uppercase tracking-widest">
              CURRENT OVERVIEW
            </span>
          )}

          {/* Micro Status Pulse Dot */}
        </div>
      </div>
    </Card3D>
  );
};

export default KpiCard;
