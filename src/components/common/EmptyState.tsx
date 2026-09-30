import React from 'react';
import { Inbox, LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  actionSlot?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'There are no active records matching your current role or query filters.',
  icon: Icon = Inbox,
  actionSlot,
  className = '',
}) => {
  return (
    <div
      className={`medex-panel p-8 text-center flex flex-col items-center justify-center min-h-[220px] ${className}`}
    >
      <div className="p-3 rounded-full bg-medex-elevated border border-medex-border text-medex-muted mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-semibold text-medex-primary">{title}</h4>
      <p className="text-xs text-medex-secondary max-w-sm mt-1 mb-4">
        {description}
      </p>
      {actionSlot}
    </div>
  );
};
