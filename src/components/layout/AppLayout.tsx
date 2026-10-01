import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { HeaderNavbar } from '../common/HeaderNavbar';
import { SidebarNav } from '../common/SidebarNav';
import { CommandPalette } from '../common/CommandPalette';
import { CopilotDrawerShell } from '../copilot/CopilotDrawerShell';

export const AppLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

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

  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const previous = document.activeElement as HTMLElement;
    const drawer = drawerRef.current;
    const focusable = () => Array.from(drawer?.querySelectorAll<HTMLElement>('button, a[href]') || [])
      .filter((element) => element.getClientRects().length > 0);
    focusable()[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileSidebarOpen(false);
      if (event.key !== 'Tab') return;
      const elements = focusable();
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); previous?.focus(); };
  }, [mobileSidebarOpen]);

  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
      <div className="app-shell text-theme-text flex overflow-hidden font-sans">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:p-3 focus:bg-theme-surface focus:rounded-xl">Skip to main content</a>
        <div className="hidden md:block shrink-0 h-full"><SidebarNav /></div>
        <div className="flex flex-col flex-1 min-w-0">
          <HeaderNavbar
            onToggleSidebar={() => setMobileSidebarOpen(true)}
            onOpenCommandPalette={() => setCommandPaletteOpen(true)}
            onOpenCopilot={() => setCopilotOpen(true)}
          />
          <main ref={mainRef} id="main-content" tabIndex={-1} className="workspace-main flex-1 min-h-0 overflow-y-auto p-4 md:p-7 lg:p-8 pb-12">
            <div key={pathname} className="workspace-content animate-page-enter">
              <Suspense fallback={<div className="p-8 text-theme-muted text-sm" role="status">Opening workspace...</div>}><Outlet /></Suspense>
            </div>
          </main>
        </div>
        <AnimatePresence>
          {mobileSidebarOpen && (
            <div ref={drawerRef} className="fixed inset-0 z-40 md:hidden flex" role="dialog" aria-modal="true" aria-label="Navigation">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
              <motion.div initial={{ x: -250 }} animate={{ x: 0 }} exit={{ x: -250 }} className="relative h-full">
                <SidebarNav isCollapsed={false} onCloseMobile={() => setMobileSidebarOpen(false)} />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
        <CopilotDrawerShell isOpen={copilotOpen} onClose={() => setCopilotOpen(false)} />
      </div>
    </MotionConfig>
  );
};
