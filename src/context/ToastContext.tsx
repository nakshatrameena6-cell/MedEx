import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-4), { id, type, message }]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const success = useCallback((msg: string) => showToast('success', msg), [showToast]);
  const error = useCallback((msg: string) => showToast('error', msg), [showToast]);
  const info = useCallback((msg: string) => showToast('info', msg), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info }}>
      {children}

      {/* Accessible Toast Notification Container */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none pr-4 sm:pr-0"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border shadow-xl font-sans text-xs transition-all duration-150 ease-out animate-slide-up motion-reduce:animate-none ${
              t.type === 'success'
                ? 'bg-theme-healthy-bg text-theme-healthy-text border-theme-healthy/40'
                : t.type === 'error'
                ? 'bg-theme-critical-bg text-theme-critical-text border-theme-critical/40'
                : 'bg-theme-surface text-theme-text border-theme-border'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {t.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-theme-healthy shrink-0" />
              ) : t.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-theme-critical shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-theme-primary shrink-0" />
              )}
              <span className="font-medium leading-normal">{t.message}</span>
            </div>

            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="p-1 rounded hover:bg-black/10 transition-colors ml-2 shrink-0"
              aria-label="Close notification"
            >
              <X className="w-3.5 h-3.5 opacity-70 hover:opacity-100" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
};
