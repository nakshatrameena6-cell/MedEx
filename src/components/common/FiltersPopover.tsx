import React, { useState, useRef, useEffect } from 'react';
import { Filter, RotateCcw, X } from 'lucide-react';
import { Button } from './Button';
import { COPY } from '../../constants/copy';

export interface FiltersPopoverProps {
  activeCount?: number;
  onReset?: () => void;
  children: React.ReactNode;
}

export const FiltersPopover: React.FC<FiltersPopoverProps> = ({
  activeCount = 0,
  onReset,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={popoverRef}>
      <Button
        variant="secondary"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
        aria-label="Toggle Filters"
      >
        <Filter className="w-4 h-4 mr-2" />
        <span>{COPY.actions.filters}</span>
        {activeCount > 0 && (
          <span className="ml-2 px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-theme-primary text-theme-bg">
            {activeCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-30 w-80 bg-theme-surface border border-theme-border rounded-xl shadow-xl p-4 space-y-4 font-sans animate-fade-in text-theme-text">
          <div className="flex items-center justify-between border-b border-theme-border pb-2">
            <h3 className="text-[14px] font-semibold text-theme-text">{COPY.actions.filters}</h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded text-theme-muted hover:text-theme-text"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">{children}</div>

          {onReset && (
            <div className="pt-2 border-t border-theme-border flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  onReset();
                  setIsOpen(false);
                }}
                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-theme-muted hover:text-theme-primary transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{COPY.actions.reset}</span>
              </button>

              <Button variant="primary" size="sm" onClick={() => setIsOpen(false)}>
                Apply
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
