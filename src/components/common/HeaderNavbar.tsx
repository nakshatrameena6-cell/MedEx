import React from 'react';
import {
  Activity,
  Bell,
  Bot,
  User,
  Menu,
  ShieldAlert,
} from 'lucide-react';
import { useAuthRole } from '../../context/AuthRoleContext';
import { Role } from '../../types/api';
import { MockBadge, OfflineBadge } from './OfflineBadge';
import { SearchField } from './SearchField';

interface HeaderNavbarProps {
  onToggleSidebar?: () => void;
  onOpenCopilot?: () => void;
  unreadAlertsCount?: number;
}

export const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  onToggleSidebar,
  onOpenCopilot,
  unreadAlertsCount = 2,
}) => {
  const { role, district, user, setRole, setDistrict } = useAuthRole();

  const supportedRoles: Role[] = ['FACILITY', 'BLOCK', 'DISTRICT', 'STATE', 'AUDITOR'];

  return (
    <header className="h-14 bg-medex-topbar border-b border-medex-border px-4 flex items-center justify-between gap-4 sticky top-0 z-30 font-sans">
      {/* Left: Mobile Toggle & Brand */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 rounded text-medex-muted hover:text-medex-primary hover:bg-medex-hover transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-medex-cyan/15 border border-medex-cyan/40 flex items-center justify-center text-medex-cyan shadow-medex-glow-cyan">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tracking-tight font-sans text-medex-primary">
                MEDEx
              </span>
              <span className="text-2xs font-mono font-semibold text-medex-cyan px-1.5 py-0.2 rounded bg-medex-cyan/10 border border-medex-cyan/20">
                v1.1
              </span>
            </div>
            <p className="text-2xs text-medex-muted hidden sm:block">
              Health Supply Chain Resilience
            </p>
          </div>
        </div>
      </div>

      {/* Middle: Presentational Search Field Shell */}
      <div className="hidden md:block max-w-md w-full">
        <SearchField />
      </div>

      {/* Right: Controls & Context */}
      <div className="flex items-center gap-2.5">
        {/* Mock & Network Badges */}
        <div className="hidden xl:flex items-center gap-2 pr-2 border-r border-medex-border">
          <MockBadge />
          <OfflineBadge />
        </div>

        {/* Role Switcher Dropdown */}
        <div className="flex items-center gap-1.5 bg-medex-surface border border-medex-border rounded-md px-2 py-1">
          <ShieldAlert className="w-3.5 h-3.5 text-medex-cyan" />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="bg-transparent text-xs font-mono font-semibold text-medex-primary focus:outline-none cursor-pointer"
          >
            {supportedRoles.map((r) => (
              <option key={r} value={r} className="bg-medex-sidebar text-medex-primary">
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* District Selector (hidden if STATE or AUDITOR) */}
        {role !== 'STATE' && role !== 'AUDITOR' ? (
          <div className="hidden sm:flex items-center gap-1 bg-medex-surface border border-medex-border rounded-md px-2 py-1 text-2xs font-mono text-medex-secondary">
            <span>DST:</span>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="bg-transparent text-xs font-mono font-semibold text-medex-primary focus:outline-none cursor-pointer"
            >
              <option value="TN-D01" className="bg-medex-sidebar">TN-D01</option>
              <option value="TN-D02" className="bg-medex-sidebar">TN-D02</option>
              <option value="TN-D03" className="bg-medex-sidebar">TN-D03</option>
            </select>
          </div>
        ) : (
          <span className="hidden sm:inline-flex px-2 py-1 rounded bg-medex-cyan/10 border border-medex-cyan/30 text-2xs font-mono text-medex-cyan font-semibold">
            SCOPE: ALL
          </span>
        )}

        {/* Gemini Copilot Trigger Button */}
        <button
          type="button"
          onClick={onOpenCopilot}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-medex-cyan/15 border border-medex-cyan/40 text-xs font-semibold text-medex-cyan hover:bg-medex-cyan/25 transition-all shadow-medex-glow-cyan"
        >
          <Bot className="w-3.5 h-3.5 animate-pulse-subtle" />
          <span className="hidden sm:inline">COPILOT</span>
        </button>

        {/* Alerts Bell */}
        <button
          type="button"
          className="relative p-1.5 rounded-md bg-medex-surface border border-medex-border text-medex-secondary hover:text-medex-primary hover:border-medex-border-active transition-colors"
        >
          <Bell className="w-4 h-4" />
          {unreadAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-medex-red text-white text-[10px] font-bold font-mono">
              {unreadAlertsCount}
            </span>
          )}
        </button>

        {/* User Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 bg-medex-surface border border-medex-border rounded-md text-2xs font-mono text-medex-secondary">
          <User className="w-3 h-3 text-medex-muted" />
          <span className="truncate max-w-[90px]">{user}</span>
        </div>
      </div>
    </header>
  );
};
