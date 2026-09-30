import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
      title={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
      className={`p-2 rounded-lg border border-theme-border-control text-theme-text hover:bg-theme-primary-tint/20 transition-colors focus-visible:outline-2 focus-visible:outline-theme-primary ${className}`}
    >
      {theme === 'light' ? (
        <Moon className="w-[18px] h-[18px] text-theme-text" strokeWidth={1.8} />
      ) : (
        <Sun className="w-[18px] h-[18px] text-theme-warning-text" strokeWidth={1.8} />
      )}
    </button>
  );
};
