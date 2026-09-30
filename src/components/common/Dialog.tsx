import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footerSlot?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footerSlot,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-medex-bg/80 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full ${maxWidthClasses[maxWidth]} bg-medex-sidebar border border-medex-border shadow-medex-panel rounded-lg overflow-hidden flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || subtitle) && (
          <div className="px-5 py-4 border-b border-medex-border flex items-center justify-between gap-4">
            <div>
              {title && (
                <h3 className="text-sm font-semibold text-medex-primary">{title}</h3>
              )}
              {subtitle && (
                <p className="text-2xs text-medex-secondary mt-0.5">{subtitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded text-medex-muted hover:text-medex-primary hover:bg-medex-hover transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1">{children}</div>

        {/* Footer */}
        {footerSlot && (
          <div className="px-5 py-3.5 bg-medex-surface border-t border-medex-border flex items-center justify-end gap-3">
            {footerSlot}
          </div>
        )}
      </div>
    </div>
  );
};
