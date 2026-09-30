import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchFieldProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export const SearchField: React.FC<SearchFieldProps> = ({
  value = '',
  onChange,
  onClear,
  placeholder = 'Search facilities, drugs, transfers...',
  className = '',
  autoFocus = false,
}) => {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="absolute left-3 w-4 h-4 text-medex-muted pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full bg-medex-surface border border-medex-border text-medex-primary text-xs rounded-md pl-9 pr-8 py-2 placeholder:text-medex-muted focus:outline-none focus:border-medex-cyan/50 focus:ring-1 focus:ring-medex-cyan/30 transition-all font-sans"
      />
      {value ? (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2.5 p-0.5 rounded text-medex-muted hover:text-medex-primary hover:bg-medex-elevated transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : (
        <kbd className="absolute right-2.5 hidden sm:inline-flex items-center px-1.5 py-0.5 text-2xs font-mono text-medex-muted bg-medex-elevated rounded border border-medex-border/40 pointer-events-none">
          Ctrl K
        </kbd>
      )}
    </div>
  );
};
