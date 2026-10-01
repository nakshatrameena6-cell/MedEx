import React from 'react';
import { useDevMode } from '../../context/DevModeContext';

export const DevOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = null,
}) => {
  const { isDevMode } = useDevMode();
  if (!isDevMode) return <>{fallback}</>;
  return <>{children}</>;
};
