import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Globe, ShieldAlert, TrendingUp, ArrowLeftRight, PlayCircle, Bell, Mic } from 'lucide-react';
import { HeaderNavbar } from '../common/HeaderNavbar';
import { SidebarNav } from '../common/SidebarNav';
import { CommandPalette } from '../common/CommandPalette';
import { CopilotDrawerShell } from '../copilot/CopilotDrawerShell';
import { AmbientGrid3D } from '../3d/AmbientGrid3D';
import { Dock } from '../reactbits';

export const AppLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);

  // Global Cmd+K / Ctrl+K keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navigate = useNavigate();

  const dockItems = [
    {
      icon: <Globe className="w-5 h-5 text-[#C5D86D]" />,
      label: 'Globe & Map',
      onClick: () => navigate('/map'),
    },
    {
      icon: <ShieldAlert className="w-5 h-5 text-[#F05D23]" />,
      label: 'Risk Center',
      onClick: () => navigate('/risk'),
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-[#C5D86D]" />,
      label: 'Forecast',
      onClick: () => navigate('/forecast'),
    },
    {
      icon: <ArrowLeftRight className="w-5 h-5 text-[#E4E6C3]" />,
      label: 'Transfers',
      onClick: () => navigate('/transfers'),
    },
    {
      icon: <PlayCircle className="w-5 h-5 text-[#F05D23]" />,
      label: 'Scenarios',
      onClick: () => navigate('/scenario'),
    },
    {
      icon: <Bell className="w-5 h-5 text-[#F05D23]" />,
      label: 'Live Alerts',
      onClick: () => navigate('/alerts'),
    },
    {
      icon: <Mic className="w-5 h-5 text-[#C5D86D]" />,
      label: 'Incident Voice',
      onClick: () => navigate('/capture'),
    },
  ];

  return (
    <div className="h-screen bg-theme-bg text-theme-text flex flex-col font-sans overflow-hidden relative">
      {/* 3D Cybernetic Ambient Grid */}
      <AmbientGrid3D intensity={0.35} />
      {/* Accessibility Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-theme-surface focus:text-theme-primary focus:border-2 focus:border-theme-primary focus:rounded-lg focus:shadow-xl focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Header Landmark */}
      <HeaderNavbar
        onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onOpenCopilot={() => setCopilotOpen(true)}
      />

      <div className="flex flex-1 h-[calc(100vh-3.5rem)] overflow-hidden relative">
        {/* Navigation Landmark: Desktop Sidebar */}
        <div className="hidden md:block h-full">
          <SidebarNav />
        </div>

        {/* Navigation Landmark: Mobile Slide-over Drawer (below 768px) */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden flex" role="dialog" aria-modal="true">
            <div
              className="fixed inset-0 bg-theme-text/40 backdrop-blur-xs"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative z-50 h-full w-60">
              <SidebarNav onCloseMobile={() => setMobileSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Operational Landmark Content */}
        <main id="main-content" className="flex-1 overflow-y-auto h-full p-6 pb-24 bg-theme-bg">
          <div className="max-w-7xl mx-auto space-y-6 animate-page-enter">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Floating Animated Dock */}
      <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-30 pointer-events-auto hidden md:block">
        <Dock items={dockItems} panelHeight={52} magnification={64} distance={130} baseItemSize={40} />
      </div>

      {/* Global Command Palette Dialog */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      {/* Global Copilot Drawer */}
      <CopilotDrawerShell
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
      />
    </div>
  );
};
