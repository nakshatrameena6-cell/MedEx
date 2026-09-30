import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Activity,
  Camera,
  MapPin,
  AlertOctagon,
  TrendingUp,
  ArrowRightLeft,
  Share2,
  Sliders,
  BellRing,
  FileText,
  Palette,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuthRole } from '../../context/AuthRoleContext';
import { Role } from '../../types/api';
import { COPY } from '../../constants/copy';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  allowedRoles?: Role[];
}

interface NavGroup {
  overline?: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { path: '/capture', label: COPY.nav.phcCapture, icon: Camera },
      { path: '/map', label: COPY.nav.districtMap, icon: MapPin },
      { path: '/risk', label: COPY.nav.riskQueue, icon: AlertOctagon },
    ],
  },
  {
    overline: 'PLAN',
    items: [
      { path: '/forecast', label: COPY.nav.forecast, icon: TrendingUp },
      { path: '/transfers', label: COPY.nav.transfers, icon: ArrowRightLeft, allowedRoles: ['BLOCK', 'DISTRICT', 'STATE', 'AUDITOR'] },
      { path: '/scenario', label: COPY.nav.scenarioSimulator, icon: Sliders, allowedRoles: ['DISTRICT', 'STATE'] },
    ],
  },
  {
    overline: 'SYSTEM',
    items: [
      { path: '/alerts', label: COPY.nav.alerts, icon: BellRing },
      { path: '/federation', label: COPY.nav.federationConsole, icon: Share2, allowedRoles: ['STATE', 'AUDITOR'] },
      { path: '/audit', label: COPY.nav.auditTrail, icon: FileText, allowedRoles: ['DISTRICT', 'STATE', 'AUDITOR'] },
      { path: '/design-system', label: 'Design System', icon: Palette },
    ],
  },
];

const COLLAPSE_STORAGE_KEY = 'medex_sidebar_collapsed';

interface SidebarNavProps {
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  onCloseMobile,
  isCollapsed: externalIsCollapsed,
  onToggleCollapse: externalOnToggleCollapse,
}) => {
  const { role } = useAuthRole();
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSE_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const isCollapsed = externalIsCollapsed !== undefined ? externalIsCollapsed : internalCollapsed;

  const toggleCollapse = () => {
    if (externalOnToggleCollapse) {
      externalOnToggleCollapse();
    } else {
      setInternalCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem(COLLAPSE_STORAGE_KEY, String(next));
        } catch {}
        return next;
      });
    }
  };

  const isRoleAllowed = (allowedRoles?: Role[]) => {
    if (!allowedRoles) return true;
    return allowedRoles.includes(role);
  };

  return (
    <aside
      className={`bg-theme-surface border-r border-theme-border flex flex-col justify-between h-full font-sans transition-all duration-200 ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
      aria-label="Main Navigation Sidebar"
    >
      {/* Top Header: Logo & Brand */}
      <div className="p-4 border-b border-theme-border flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-theme-primary-tint text-theme-primary flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" strokeWidth={1.8} />
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="text-[14px] font-semibold text-theme-text leading-none">
                  MEDEx
                </span>
                <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-theme-primary-tint text-theme-primary font-bold">
                  v1.1
                </span>
              </div>
              <span className="text-[11px] text-theme-muted truncate block mt-0.5">
                Health Supply Chain
              </span>
            </div>
          )}
        </div>

        {/* Collapse Toggle Button */}
        <button
          type="button"
          onClick={toggleCollapse}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden md:flex p-1.5 rounded-lg border border-theme-border text-theme-muted hover:text-theme-text hover:bg-theme-border/40 transition-colors focus-visible:outline-2 focus-visible:outline-theme-primary"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" strokeWidth={1.8} />
          ) : (
            <ChevronLeft className="w-4 h-4" strokeWidth={1.8} />
          )}
        </button>
      </div>

      {/* Navigation Links List */}
      <div className="flex-1 p-2 space-y-4 overflow-y-auto">
        {NAV_GROUPS.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {group.overline && !isCollapsed && (
              <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-theme-muted">
                {group.overline}
              </div>
            )}
            {group.overline && isCollapsed && (
              <div className="h-px bg-theme-border my-2" />
            )}

            <nav className="space-y-1">
              {group.items.map((item) => {
                const allowed = isRoleAllowed(item.allowedRoles);
                const Icon = item.icon;

                if (!allowed) return null;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onCloseMobile}
                    title={isCollapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                        isActive
                          ? 'bg-theme-primary-tint text-theme-primary font-semibold border-l-[3px] border-theme-primary shadow-none'
                          : 'text-theme-muted hover:text-theme-text hover:bg-theme-border/40 border-l-[3px] border-transparent'
                      }`
                    }
                  >
                    <Icon className="w-5 h-5 shrink-0" strokeWidth={1.8} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
};
