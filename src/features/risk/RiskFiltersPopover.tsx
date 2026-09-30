import React, { useRef, useEffect } from 'react';
import { RotateCcw, X } from 'lucide-react';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';

export interface RiskFiltersPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  statusFilter: string;
  onStatusChange: (val: string) => void;
  drugFilter: string;
  onDrugChange: (val: string) => void;
  limitFilter: string;
  onLimitChange: (val: string) => void;
  onReset: () => void;
}

export const RiskFiltersPopover: React.FC<RiskFiltersPopoverProps> = ({
  isOpen,
  onClose,
  statusFilter,
  onStatusChange,
  drugFilter,
  onDrugChange,
  limitFilter,
  onLimitChange,
  onReset,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className="absolute right-0 top-12 z-30 w-80 bg-theme-surface border border-theme-border rounded-xl shadow-xl p-4 space-y-4 font-sans animate-fade-in text-theme-text"
      role="dialog"
      aria-label="Filter Options"
    >
      <div className="flex items-center justify-between border-b border-theme-border pb-2">
        <h3 className="text-[14px] font-semibold text-theme-text">Filter Risk Items</h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded text-theme-muted hover:text-theme-text"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        <Select
          label="Risk Status"
          value={statusFilter}
          onChange={onStatusChange}
          options={[
            { value: 'ALL', label: 'All Statuses (RED / AMBER / GREEN)' },
            { value: 'RED', label: 'RED (Critical Stockout Risk)' },
            { value: 'AMBER', label: 'AMBER (Watch Cover)' },
            { value: 'GREEN', label: 'GREEN (Stable Cover)' },
          ]}
        />

        <Select
          label="Medicine"
          value={drugFilter}
          onChange={onDrugChange}
          options={[
            { value: 'ALL', label: 'All Essential Drugs' },
            { value: 'ORS', label: 'ORS (Oral Rehydration Salts)' },
            { value: 'PARA500', label: 'PARA500 (Paracetamol 500mg)' },
            { value: 'AMOX500', label: 'AMOX500 (Amoxicillin 500mg)' },
          ]}
        />

        <Select
          label="Result Limit"
          value={limitFilter}
          onChange={onLimitChange}
          options={[
            { value: '10', label: 'Top 10 Priority' },
            { value: '25', label: 'Top 25 Priority' },
            { value: '50', label: 'Top 50 Priority' },
            { value: '100', label: 'Top 100 Priority' },
          ]}
        />
      </div>

      <div className="pt-2 border-t border-theme-border flex items-center justify-between">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-theme-muted hover:text-theme-primary transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>

        <Button variant="primary" size="sm" onClick={onClose}>
          Apply
        </Button>
      </div>
    </div>
  );
};
