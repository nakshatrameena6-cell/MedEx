import React from 'react';

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  actionSlot?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  headerBorder?: boolean;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  subtitle,
  actionSlot,
  children,
  className = '',
  contentClassName = '',
  headerBorder = true,
}) => {
  return (
    <section className={`medex-panel overflow-hidden ${className}`}>
      {(title || actionSlot) && (
        <div
          className={`px-4 py-3.5 flex items-center justify-between gap-4 ${
            headerBorder ? 'border-b border-medex-border' : ''
          }`}
        >
          <div>
            {title && (
              <h3 className="text-sm font-semibold text-medex-primary tracking-wide">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-2xs text-medex-secondary mt-0.5">{subtitle}</p>
            )}
          </div>
          {actionSlot && <div className="flex items-center gap-2">{actionSlot}</div>}
        </div>
      )}
      <div className={`p-4 ${contentClassName}`}>{children}</div>
    </section>
  );
};
