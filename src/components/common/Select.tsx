import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
  disabled?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  label,
  size = 'md',
  className = '',
  disabled = false,
}) => {
  const sizeClasses = {
    sm: 'text-2xs py-1 pl-2.5 pr-7',
    md: 'text-xs py-1.5 pl-3 pr-8',
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-2xs font-medium uppercase tracking-wider text-medex-muted">
          {label}
        </label>
      )}
      <div className="relative inline-block w-full">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full appearance-none bg-medex-surface border border-medex-border text-medex-primary rounded-md focus:outline-none focus:border-medex-cyan/50 focus:ring-1 focus:ring-medex-cyan/30 disabled:opacity-50 disabled:cursor-not-allowed font-sans transition-colors cursor-pointer ${sizeClasses[size]}`}
        >
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              disabled={opt.disabled}
              className="bg-medex-sidebar text-medex-primary py-1"
            >
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-medex-muted pointer-events-none" />
      </div>
    </div>
  );
};
