import React from 'react';
import { useLocation } from 'react-router-dom';
import { Filter } from 'lucide-react';
import { Button } from './Button';
import { DevOnly } from './DevOnly';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actionSlot?: React.ReactNode;
  activeFilterCount?: number;
  onToggleFilters?: () => void;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  actionSlot,
  activeFilterCount = 0,
  onToggleFilters,
  breadcrumbs,
}) => {
  const { pathname } = useLocation();
  const section = ['forecast', 'transfers', 'scenario'].some((path) => pathname.includes(path))
    ? 'Planning & intelligence'
    : ['alerts', 'federation', 'audit', 'design-system'].some((path) => pathname.includes(path))
    ? 'Network operations'
    : 'Supply intelligence';
  return (
    <div className="page-heading flex flex-col xl:flex-row xl:items-center justify-between gap-4 font-sans">
      <div className="min-w-0">
        <div className="eyebrow mb-3 flex items-center gap-2"><span className="w-4 h-px bg-theme-primary" />{section}</div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12px] font-mono text-theme-muted mb-1.5">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span>/</span>}
                <span className={idx === breadcrumbs.length - 1 ? 'text-theme-primary font-medium' : ''}>
                  {crumb.label}
                </span>
              </React.Fragment>
            ))}
          </nav>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-theme-text leading-tight">
            {title}
          </h1>
          {badge && <DevOnly>{badge}</DevOnly>}
        </div>

        {subtitle && (
          <p className="text-[14px] font-normal text-theme-muted mt-1.5 max-w-3xl leading-normal">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 shrink-0">
        {onToggleFilters && (
          <Button
            variant="secondary"
            size="sm"
            icon={Filter}
            onClick={onToggleFilters}
          >
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-theme-primary text-theme-on-primary text-[11px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </Button>
        )}

        {actionSlot}
      </div>
    </div>
  );
};
