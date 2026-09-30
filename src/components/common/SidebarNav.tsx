import React from 'react';
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
} from 'lucide-react';
import { useAuthRole } from '../../context/AuthRoleContext';
import { Role } from '../../types/api';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  allowedRoles?: Role[];
}

const navItems: NavItem[] = [
  {
    path: '/capture',
    label: 'PHC Capture',
    icon: Camera,
  },
  {
    path: '/map',
    label: 'District Map',
    icon: MapPin,
  },
  {
    path: '/risk',
    label: 'Risk Queue',
    icon: AlertOctagon,
    badge: 'LIVE',
  },
  {
    path: '/forecast',
    label: 'Forecast View',
    icon: TrendingUp,
  },
  {
    path: '/transfers',
    label: 'Transfer Review',
    icon: ArrowRightLeft,
    allowedRoles: ['BLOCK', 'DISTRICT', 'STATE', 'AUDITOR'],
  },
  {
    path: '/federation',
    label: 'Federation Console',
    icon: Share2,
    allowedRoles: ['STATE', 'AUDITOR'],
  },
  {
    path: '/scenario',
    label: 'Scenario Simulator',
    icon: Sliders,
    allowedRoles: ['DISTRICT', 'STATE'],
  },
  {
    path: '/alerts',
    label: 'Alert Briefs',
    icon: BellRing,
  },
  {
    path: '/audit',
    label: 'Audit Trail',
    icon: FileText,
    allowedRoles: ['DISTRICT', 'STATE', 'AUDITOR'],
  },
];

interface SidebarNavProps {
  onCloseMobile?: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({ onCloseMobile }) => {
  const { role } = useAuthRole();

  const isRoleAllowed = (allowedRoles?: Role[]) => {
    if (!allowedRoles) return true;
    return allowedRoles.includes(role);
  };

  return (
    <aside className="w-56 bg-medex-sidebar border-r border-medex-border flex flex-col justify-between h-[calc(100vh-3.5rem)] shrink-0 font-sans">
      <div className="p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-2xs font-mono font-semibold uppercase tracking-wider text-medex-muted">
          Operational Navigation
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const allowed = isRoleAllowed(item.allowedRoles);
            const Icon = item.icon;

            if (!allowed) {
              return (
                <div
                  key={item.path}
                  className="flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium text-medex-disabled opacity-40 cursor-not-allowed select-none"
                  title={`Not accessible in ${role} role`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  <span className="text-2xs font-mono uppercase text-medex-disabled">
                    NO PERM
                  </span>
                </div>
              );
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-medex-cyan/15 text-medex-cyan border-l-2 border-medex-cyan shadow-sm font-semibold'
                      : 'text-medex-secondary hover:text-medex-primary hover:bg-medex-hover'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span className="px-1.5 py-0.2 rounded text-2xs font-mono font-bold bg-medex-red/20 text-medex-red-light border border-medex-red/30">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer Context */}
      <div className="p-3 border-t border-medex-border bg-medex-topbar/60">
        <div className="medex-panel p-2.5 bg-medex-surface/60 border-medex-border-subtle">
          <div className="flex items-center justify-between text-2xs font-mono text-medex-muted mb-1">
            <span>ACTIVE SCOPE</span>
            <span className="text-medex-cyan">{role}</span>
          </div>
          <p className="text-2xs text-medex-secondary truncate">
            {role === 'STATE' || role === 'AUDITOR' ? 'All Districts' : 'District TN-D01'}
          </p>
        </div>
      </div>
    </aside>
  );
};
