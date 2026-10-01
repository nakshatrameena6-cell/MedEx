import React, { createContext, useContext, useEffect, useState } from 'react';

interface DevModeContextType {
  isDevMode: boolean;
  toggleDevMode: () => void;
  setDevMode: (enabled: boolean) => void;
}

const STORAGE_KEY = 'medex_dev_mode';

function getInitialDevMode(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      return saved === 'true';
    }
  } catch (err) {
    console.warn('Unable to access localStorage for dev mode:', err);
  }
  return false; // Default OFF in production view
}

const DevModeContext = createContext<DevModeContextType | undefined>(undefined);

export const DevModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDevMode, setIsDevModeState] = useState<boolean>(getInitialDevMode);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(isDevMode));
    } catch (err) {
      console.warn('Unable to save dev mode to localStorage:', err);
    }
  }, [isDevMode]);

  const toggleDevMode = () => setIsDevModeState((prev) => !prev);
  const setDevMode = (enabled: boolean) => setIsDevModeState(enabled);

  return (
    <DevModeContext.Provider value={{ isDevMode, toggleDevMode, setDevMode }}>
      {children}
    </DevModeContext.Provider>
  );
};

export const useDevMode = (): DevModeContextType => {
  const context = useContext(DevModeContext);
  if (!context) {
    throw new Error('useDevMode must be used within a DevModeProvider');
  }
  return context;
};
