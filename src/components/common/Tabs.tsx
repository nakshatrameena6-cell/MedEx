import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'segmented' | 'underline';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'segmented',
  className = '',
}) => {
  if (variant === 'underline') {
    return (
      <div className={`flex items-center gap-4 border-b border-medex-border ${className}`}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && onChange(tab.id)}
              disabled={tab.disabled}
              className={`pb-2 text-xs font-semibold tracking-wide transition-all relative ${
                isActive
                  ? 'text-medex-cyan border-b-2 border-medex-cyan'
                  : 'text-medex-secondary hover:text-medex-primary'
              } ${tab.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {tab.label}
              {typeof tab.count === 'number' && (
                <span
                  className={`ml-1.5 px-1.5 py-0.2 rounded-full text-2xs font-mono ${
                    isActive ? 'bg-medex-cyan/20 text-medex-cyan' : 'bg-medex-elevated text-medex-muted'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Segmented Variant (default)
  return (
    <div
      className={`inline-flex items-center p-1 bg-medex-surface border border-medex-border rounded-md ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onChange(tab.id)}
            disabled={tab.disabled}
            className={`px-3 py-1 rounded text-2xs font-semibold tracking-wider uppercase font-mono transition-all ${
              isActive
                ? 'bg-medex-elevated text-medex-cyan border border-medex-cyan/30 shadow-sm'
                : 'text-medex-secondary hover:text-medex-primary hover:bg-medex-hover'
            } ${tab.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {tab.label}
            {typeof tab.count === 'number' && (
              <span
                className={`ml-1.5 px-1.5 py-0.2 rounded-full text-2xs ${
                  isActive ? 'bg-medex-cyan/20 text-medex-cyan-light' : 'bg-medex-elevated text-medex-muted'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
