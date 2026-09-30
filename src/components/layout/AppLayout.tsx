import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { HeaderNavbar } from '../common/HeaderNavbar';
import { SidebarNav } from '../common/SidebarNav';
import { CopilotDrawerShell } from '../copilot/CopilotDrawerShell';

export const AppLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);

  return (
    <div className="min-h-screen bg-medex-bg text-medex-primary flex flex-col font-sans overflow-hidden">
      {/* Topbar Navbar */}
      <HeaderNavbar
        onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        onOpenCopilot={() => setCopilotOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <SidebarNav />
        </div>

        {/* Mobile Sidebar Overlay */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            <div
              className="fixed inset-0 bg-medex-bg/80 backdrop-blur-xs"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative z-50">
              <SidebarNav onCloseMobile={() => setMobileSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Operational Workspace Content Container */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-medex-bg">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Gemini Copilot Drawer Overlay */}
      <CopilotDrawerShell
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
      />
    </div>
  );
};
