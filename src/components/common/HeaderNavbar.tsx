import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  ChevronDown,
  Code2,
  Bot,
} from 'lucide-react';
import { useAuthRole } from '../../context/AuthRoleContext';
import { useDevMode } from '../../context/DevModeContext';
import { Role } from '../../types/api';
import { ThemeToggle } from './ThemeToggle';
import { DevOnly } from './DevOnly';
import { OfflineBadge, MockBadge } from './OfflineBadge';
import { BellToggle } from '../reactbits';

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
    <header className="h-14 bg-theme-surface border-b border-theme-border px-4 flex items-center justify-between gap-4 sticky top-0 z-30 font-sans">
      {/* Left: Mobile Sidebar Hamburger */}
      <div className="flex items-center gap-3">
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
          className="flex items-center justify-between w-48 sm:w-64 md:w-80 px-3 py-1.5 rounded-lg border border-theme-border-control bg-theme-bg text-[13px] text-theme-muted hover:border-theme-primary transition-colors focus-visible:outline-2 focus-visible:outline-theme-primary"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-4 h-4 shrink-0 text-theme-muted" strokeWidth={1.8} />
            <span className="truncate">Search pages, drugs, facilities...</span>
          </div>
          <span className="hidden sm:inline-flex text-[11px] font-mono px-1.5 py-0.5 rounded bg-theme-surface border border-theme-border text-theme-muted shrink-0">
            ⌘K
          </span>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* District Selector with Chevron */}
        <div className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-theme-border-control bg-theme-bg text-[13px] text-theme-text font-medium">
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="bg-transparent font-medium text-theme-text focus:outline-none cursor-pointer pr-4 appearance-none"
            aria-label="Select Active District Scope"
          >
            <option value="TN-D01" className="bg-theme-surface">District TN-D01</option>
            <option value="TN-D02" className="bg-theme-surface">District TN-D02</option>
            <option value="TN-D03" className="bg-theme-surface">District TN-D03</option>
            <option value="ALL" className="bg-theme-surface">All Districts</option>
          </select>
          <ChevronDown className="w-4 h-4 text-theme-muted pointer-events-none absolute right-2" strokeWidth={1.8} />
        </div>

        {/* Active Scope Chip */}
        <span className="hidden sm:inline-flex items-center h-7 px-2.5 rounded-md bg-theme-primary-tint text-theme-primary text-[12px] font-mono font-semibold">
          SCOPE: {district}
        </span>

        {/* Dev-Only Badges */}
        <DevOnly>
          <div className="hidden xl:flex items-center gap-2">
            <MockBadge />
            <OfflineBadge />
          </div>
        </DevOnly>

        {/* Gemini Copilot Trigger Button */}
        <button
          type="button"
          onClick={onOpenCopilot}
          aria-label="Open AI Copilot"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-theme-primary bg-theme-primary-tint/30 text-[13px] font-semibold text-theme-primary hover:bg-theme-primary-tint/50 transition-colors focus-visible:outline-2 focus-visible:outline-theme-primary"
        >
          <Bot className="w-4 h-4 shrink-0" strokeWidth={1.8} />
          <span className="hidden sm:inline">Copilot</span>
        </button>

        {/* ReactBits Physics BellToggle */}
        <div className="flex items-center">
          <BellToggle
            size="sm"
            count={unreadAlertsCount}
            badge={true}
            defaultPressed={true}
            offLabel="Muted"
            onLabel="Alerts"
            color="var(--theme-text)"
            background="var(--theme-bg)"
            onColor="#C5D86D"
            onBackground="rgba(197, 216, 109, 0.18)"
          />
        </div>

        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* Avatar Menu with Developer Mode Switch */}
        <div className="relative" ref={avatarMenuRef}>
          <button
            type="button"
            onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
            aria-label="Open user profile menu"
            aria-expanded={avatarMenuOpen}
            className="flex items-center gap-2 p-1.5 rounded-lg border border-theme-border-control text-theme-text hover:bg-theme-primary-tint/20 transition-colors focus-visible:outline-2 focus-visible:outline-theme-primary"
          >
            <div className="w-6 h-6 rounded-full bg-theme-primary text-theme-on-primary flex items-center justify-center font-bold text-[12px]">
              {user.charAt(0).toUpperCase()}
            </div>
            <span className="hidden lg:inline text-[13px] font-medium max-w-[90px] truncate">
              {user}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-theme-muted" strokeWidth={1.8} />
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
