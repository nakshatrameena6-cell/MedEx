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
          ? 'bg-medex-amber/15 border-medex-amber/40 text-medex-amber-light hover:bg-medex-amber/25'
          : 'bg-medex-elevated border-medex-border text-medex-muted hover:text-medex-primary'
      }`}
    >
      <Database className="w-3 h-3" />
      <span>{isMockMode ? 'MOCK MODE (FIXTURES)' : 'LIVE BACKEND'}</span>
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
