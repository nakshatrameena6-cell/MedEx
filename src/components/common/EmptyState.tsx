import React from 'react';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'No data is currently available matching the selected parameters.',
  icon: Icon = Inbox,
  action,
  className = '',
}) => {
  return (
    <div
      className={`p-8 rounded-lg border border-theme-border bg-theme-surface flex flex-col items-center justify-center text-center font-sans space-y-3 ${className}`}
    >
      <div className="p-3 rounded-full bg-theme-primary-tint/20 text-theme-primary">
        <Icon className="w-6 h-6" strokeWidth={1.8} />
      </div>

      <div className="space-y-1 max-w-sm">
        <h3 className="text-[14px] font-semibold text-theme-text">
          {title}
        </h3>
        <p className="text-[12px] font-normal text-theme-muted leading-relaxed">
          {description}
        </p>
      </div>

      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};
