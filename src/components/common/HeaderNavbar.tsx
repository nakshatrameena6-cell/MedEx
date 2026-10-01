import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  ChevronDown,
  Code2,
  Bot,
  Bell,
  Sun,
} from 'lucide-react';
import { useAuthRole } from '../../context/AuthRoleContext';
import { useDevMode } from '../../context/DevModeContext';
import { Role } from '../../types/api';
import { DevOnly } from './DevOnly';
import { OfflineBadge, MockBadge } from './OfflineBadge';

interface HeaderNavbarProps {
  onToggleSidebar?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenCopilot?: () => void;
  unreadAlertsCount?: number;
}

export const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  onToggleSidebar,
  onOpenCommandPalette,
  onOpenCopilot,
  unreadAlertsCount = 2,
}) => {
  const { role, district, user, setRole, setDistrict } = useAuthRole();
  const { isDevMode, toggleDevMode } = useDevMode();
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const avatarMenuRef = useRef<HTMLDivElement>(null);

  const supportedRoles: Role[] = ['FACILITY', 'BLOCK', 'DISTRICT', 'STATE', 'AUDITOR'];

  // Close avatar dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(event.target as Node)) {
        setAvatarMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="workspace-header border-b border-theme-border px-3 md:px-8 flex items-center justify-between gap-1.5 sticky top-0 z-30 font-sans">
      {/* Left: Brand Icon + Mobile Toggle + Global Search */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* MedEx Brand Logo */}
        <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-slate-700/60 shadow-[0_0_10px_rgba(56,189,248,0.25)] bg-[#070e1c]">
          <img
            src="/medex_logo.jpg"
            alt="MedEx Logo"
            className="w-full h-full object-cover"
          />
        </div>

        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Open mobile navigation drawer"
          className="md:hidden p-2 rounded-lg border border-theme-border text-theme-muted hover:text-theme-text hover:bg-theme-border/40 transition-colors focus-visible:outline-2 focus-visible:outline-theme-primary"
        >
          <Menu className="w-5 h-5" strokeWidth={1.8} />
        </button>

        {/* Global Search Field Trigger (Cmd+K) */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          aria-label="Search pages, drugs and facilities"
          className="flex items-center justify-between w-9 sm:w-48 xl:w-64 h-9 px-3 rounded-lg border border-slate-800 bg-[#070e1c] text-[12px] text-slate-400 hover:text-white hover:border-slate-700 transition-colors focus-visible:outline-2 focus-visible:outline-theme-primary"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-4 h-4 shrink-0 text-slate-400" strokeWidth={1.8} />
            <span className="hidden sm:inline truncate">Search anything...</span>
          </div>
          <span className="hidden sm:inline-flex text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 shrink-0">
            ⌘K
          </span>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 lg:gap-3">
        {/* District / Facility Selector with Chevron */}
        <div className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-[#070e1c] text-[12px] text-slate-200 font-medium">
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="bg-transparent font-medium text-slate-200 focus:outline-none cursor-pointer pr-4 appearance-none text-[12px]"
            aria-label="Select Active District Scope"
          >
            <option value="TN-D01" className="bg-[#0b1324] text-white">Facility: TN-PHC-014 (TN-D01)</option>
            <option value="TN-D02" className="bg-[#0b1324] text-white">Facility: TN-PHC-022 (TN-D02)</option>
            <option value="TN-D03" className="bg-[#0b1324] text-white">Facility: TN-PHC-031 (TN-D03)</option>
            <option value="ALL" className="bg-[#0b1324] text-white">All facilities (State)</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5" strokeWidth={1.8} />
        </div>

        {/* Active Scope Chip */}

        {/* Dev-Only Badges */}
        <DevOnly>
          <div className="hidden xl:flex items-center gap-2">
            <MockBadge />
            <OfflineBadge />
          </div>
        </DevOnly>

        {/* Copilot Trigger Button */}
        <button
          type="button"
          onClick={onOpenCopilot}
          aria-label="Open AI Assistant"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-[#070e1c] text-[12px] font-semibold text-slate-200 hover:text-white hover:border-slate-700 transition-colors focus-visible:outline-2 focus-visible:outline-theme-primary cursor-pointer"
        >
          <Bot className="w-3.5 h-3.5 text-cyan-400" strokeWidth={1.8} />
          <span className="hidden sm:inline">AI Assistant</span>
        </button>

        {/* Alerts Button with Red Dot Badge */}
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="View Alerts"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-900/60 bg-[#071329] text-[12px] font-semibold text-blue-200 hover:bg-blue-950/80 transition-colors focus-visible:outline-2 focus-visible:outline-theme-primary cursor-pointer"
        >
          <div className="relative flex items-center justify-center">
            <Bell className="w-3.5 h-3.5 text-blue-300" strokeWidth={1.8} />
            <span className="absolute -top-1.5 -right-2 px-1 min-w-[13px] h-[13px] rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
              {unreadAlertsCount}
            </span>
          </div>
          <span className="hidden sm:inline pl-1">Alerts</span>
        </button>

        {/* User Profile & Theme with Avatar Image */}
        <div className="relative" ref={avatarMenuRef}>
          <button
            type="button"
            onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
            aria-label="Open user profile menu"
            aria-expanded={avatarMenuOpen}
            className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-slate-800 bg-[#070e1c] text-slate-200 hover:border-slate-700 transition-colors focus-visible:outline-2 focus-visible:outline-theme-primary cursor-pointer"
          >
            <Sun className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.8} />
            <span className="hidden lg:inline text-[12px] font-medium font-mono text-slate-200">
              {user}
            </span>
            <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-700 bg-slate-800 flex items-center justify-center shrink-0">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
                alt={user}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          </button>

          {/* Avatar Dropdown Menu */}
          {avatarMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-theme-surface border border-theme-border rounded-xl shadow-xl p-3 space-y-3 z-50 animate-fade-in text-[13px]">
              <div className="pb-2 border-b border-theme-border">
                <span className="font-semibold text-theme-text block">{user}</span>
                <span className="text-[12px] text-theme-muted block font-mono">
                  Role: <strong className="text-theme-primary">{role}</strong>
                </span>
              </div>

              {/* Role Switcher */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-[0.05em] text-theme-muted block">
                  Switch Active Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full bg-theme-bg border border-theme-border-control rounded-md p-1.5 text-[12px] text-theme-text font-mono focus:outline-none"
                >
                  {supportedRoles.map((r) => (
                    <option key={r} value={r} className="bg-theme-surface">
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Developer Mode Switch */}
              <div className="pt-2 border-t border-theme-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-theme-primary" strokeWidth={1.8} />
                  <span className="font-medium text-theme-text">Developer Mode</span>
                </div>
                <button
                  type="button"
                  onClick={toggleDevMode}
                  role="switch"
                  aria-checked={isDevMode}
                  className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                    isDevMode ? 'bg-theme-primary justify-end' : 'bg-theme-border-control justify-start'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
