import React from 'react';
import { Wifi, WifiOff, Database } from 'lucide-react';
import { useAuthRole } from '../../context/AuthRoleContext';

export const MockBadge: React.FC = () => {
  const { isMockMode, setIsMockMode } = useAuthRole();

  return (
    <button
      type="button"
      onClick={() => setIsMockMode(!isMockMode)}
      title="Toggle Mock Fixture Mode (X-Mock: true)"
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-2xs font-mono font-semibold transition-all border ${
        isMockMode
          ? 'bg-theme-warning-bg border-theme-warning/40 text-theme-warning-text hover:bg-theme-warning-bg/80'
          : 'bg-theme-healthy-bg border-theme-healthy/40 text-theme-healthy-text hover:bg-theme-healthy-bg/80 animate-pulse-subtle'
      }`}
    >
      <Database className="w-3 h-3" />
      <span>{isMockMode ? 'MOCK MODE' : 'LIVE BACKEND'}</span>
    </button>
  );
};

export const OfflineBadge: React.FC = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return (
      <span className="inline-flex items-center gap-1 text-2xs font-mono text-medex-green-light">
        <Wifi className="w-3 h-3 text-medex-green" />
        <span className="hidden lg:inline">ONLINE</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-medex-red/15 border border-medex-red/40 text-2xs font-mono text-medex-red-light animate-pulse-subtle">
      <WifiOff className="w-3 h-3 text-medex-red" />
      <span>OFFLINE</span>
    </span>
  );
};
