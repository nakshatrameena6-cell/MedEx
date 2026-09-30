import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: 'md' | 'lg' | 'xl';
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = 'lg',
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

  const widthClasses = {
    md: 'w-full md:w-96',
    lg: 'w-full md:w-[480px]',
    xl: 'w-full md:w-[600px]',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-medex-bg/60 backdrop-blur-xs">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className={`fixed inset-y-0 right-0 max-w-full flex pl-10 animate-slide-in-right z-10`}
      >
        <div className={`w-screen ${widthClasses[width]} bg-medex-sidebar border-l border-medex-border shadow-2xl flex flex-col`}>
          {/* Header */}
          <div className="p-4 border-b border-medex-border flex items-center justify-between gap-4 bg-medex-topbar">
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

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4">{children}</div>
        </div>
      </div>
    </div>
  );
};
