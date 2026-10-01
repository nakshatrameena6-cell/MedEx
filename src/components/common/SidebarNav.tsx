import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
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
  X,
  ShieldCheck,
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
    overline: 'WORKSPACE',
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
      className={`workspace-sidebar flex flex-col justify-between h-full font-sans transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-60'
      }`}
      aria-label="Main Navigation Sidebar"
    >
      {/* Top Header: Logo & Brand */}
      <div className="px-5 h-[92px] shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-slate-700/60 shadow-[0_0_10px_rgba(56,189,248,0.25)] bg-[#070e1c]">
            <img src="/medex_logo.jpg" alt="MedEx" className="w-full h-full object-cover" />
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="text-[23px] font-display font-semibold tracking-[-0.06em] text-theme-text leading-none">
                  medex<span className="text-theme-primary">.</span>
                </span>
              </div>
              <span className="text-[9px] tracking-[.12em] uppercase text-theme-muted truncate block mt-1">
                Connected care
              </span>
            </div>
          )}
        </div>

        {onCloseMobile && <button type="button" onClick={onCloseMobile} aria-label="Close navigation" className="md:hidden p-1 text-theme-muted"><X size={18} /></button>}
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
      <div className="flex-1 px-3 py-3 space-y-7 overflow-y-auto">
        {NAV_GROUPS.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {group.overline && !isCollapsed && (
              <div className="px-3 mb-3 text-[9px] font-mono tracking-[0.16em] text-theme-muted">
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
                      `nav-link flex items-center gap-3 px-3 py-2 rounded-xl text-[12px] font-medium transition-all ${
                        isActive
                          ? 'bg-theme-primary-tint text-theme-primary'
                          : 'text-theme-muted hover:text-theme-text hover:bg-theme-surface'
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
      {!isCollapsed && <div className="sidebar-footer m-4 p-4 rounded-xl">
        <ShieldCheck className="text-theme-primary mb-3" size={19} />
        <p className="font-display text-[13px] font-medium">Care without interruption.</p>
        <p className="text-theme-muted text-[11px] leading-relaxed mt-1.5">A connected view of every facility, every essential supply.</p>
        <div className="eyebrow mt-4 !text-[8px]">MEDEX / OPERATIONS</div>
      </div>}
    </aside>
  );
};
