import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  type?: ToastType;
  title: string;
  message?: string;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  type = 'info',
  title,
  message,
  onClose,
}) => {
  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-medex-green/15 border-medex-green/40 text-medex-green-light',
          Icon: CheckCircle2,
        };
      case 'error':
        return {
          bg: 'bg-medex-red/15 border-medex-red/40 text-medex-red-light',
          Icon: AlertCircle,
        };
      default:
        return {
          bg: 'bg-medex-cyan/15 border-medex-cyan/40 text-medex-cyan-light',
          Icon: Info,
        };
    }
  };

  const { bg, Icon } = getStyles();

  return (
    <div
      className={`flex items-start gap-3 p-3.5 rounded-lg border shadow-lg max-w-sm font-sans ${bg} animate-slide-in-right`}
    >
      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
      <div className="flex-1">
        <h5 className="text-xs font-semibold">{title}</h5>
        {message && <p className="text-2xs opacity-80 mt-0.5">{message}</p>}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="opacity-70 hover:opacity-100 transition-opacity p-0.5"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
