import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actionSlot?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  actionSlot,
  breadcrumbs,
}) => {
  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-medex-border pb-4">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-2xs font-mono text-medex-muted mb-1">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span>/</span>}
                <span className={idx === breadcrumbs.length - 1 ? 'text-medex-cyan font-medium' : ''}>
                  {crumb.label}
                </span>
              </React.Fragment>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight text-medex-primary font-sans">
            {title}
          </h1>
          {badge}
        </div>

        {subtitle && (
          <p className="text-xs text-medex-secondary mt-1 max-w-3xl">
            {subtitle}
          </p>
        )}
      </div>

      {actionSlot && (
        <div className="flex items-center gap-2.5 shrink-0">{actionSlot}</div>
      )}
    </div>
  );
};
