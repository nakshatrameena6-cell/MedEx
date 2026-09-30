import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  errorDetails?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Service Unavailable',
  message = 'An unexpected system error occurred while processing your request.',
  errorDetails,
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`medex-panel p-6 border-medex-red/40 bg-medex-red/5 flex flex-col items-center justify-center text-center min-h-[220px] ${className}`}
    >
      <div className="p-3 rounded-full bg-medex-red/15 border border-medex-red/30 text-medex-red-light mb-3">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-semibold text-medex-red-light">{title}</h4>
      <p className="text-xs text-medex-secondary max-w-md mt-1 mb-2">{message}</p>

      {errorDetails && (
        <pre className="text-2xs font-mono bg-medex-bg/80 border border-medex-border p-2 rounded text-medex-muted max-w-lg overflow-x-auto text-left mb-4">
          {errorDetails}
        </pre>
      )}

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-medex-red/20 border border-medex-red/40 text-xs font-semibold text-medex-red-light hover:bg-medex-red/30 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Operation</span>
        </button>
      )}
    </div>
  );
};
