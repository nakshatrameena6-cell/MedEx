import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';

interface FilterBarProps {
  children: React.ReactNode;
  onReset?: () => void;
  title?: string;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  children,
  onReset,
  title = 'Filters',
  className = '',
}) => {
  return (
    <div
      className={`medex-panel p-3 flex flex-wrap items-center justify-between gap-3 mb-4 bg-medex-surface/60 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-medex-muted pr-2 border-r border-medex-border">
          <Filter className="w-3.5 h-3.5 text-medex-cyan" />
          <span>{title}</span>
        </div>
        {children}
      </div>

      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 text-2xs font-medium text-medex-secondary hover:text-medex-cyan transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      )}
    </div>
  );
};
