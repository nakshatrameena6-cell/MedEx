import React from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import { KpiCard } from '../components/common/KpiCard';
import { DeltaChip } from '../components/common/DeltaChip';
import { EmptyState } from '../components/common/EmptyState';
import { TableSkeleton } from '../components/common/Skeleton';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { DevOnly } from '../components/common/DevOnly';
import { Card3D } from '../components/3d/Card3D';
import { useDevMode } from '../context/DevModeContext';
import { useTheme } from '../context/ThemeContext';
import { Activity, Plus, RefreshCw, Sparkles, Filter, Layers, Box, Compass } from 'lucide-react';

export const StyleGuideView: React.FC = () => {
  const { theme } = useTheme();
  const { isDevMode, toggleDevMode } = useDevMode();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-8 font-sans p-6 max-w-7xl mx-auto text-theme-text min-h-screen"
    >
      <PageHeader
        title="Design System & V4 3D Component Deck"
        subtitle="Tactical healthtech telemetry architecture: Three.js accelerated lattices, 60fps Framer Motion spring physics, and specular depth lighting."
        actionSlot={
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              type="button"
              onClick={toggleDevMode}
              className={`px-3 py-1.5 rounded-xl border text-[12px] font-mono font-medium transition-all ${
                isDevMode
                  ? 'bg-theme-primary text-theme-on-primary border-theme-primary shadow-lg shadow-theme-primary/20'
                  : 'border-white/10 bg-white/5 text-theme-text hover:bg-white/10'
              }`}
            >
              Dev Mode: {isDevMode ? 'ON' : 'OFF'}
            </button>
          </div>
        }
      />

      {/* Theme Active Indicator Banner */}
      <Card3D 
        maxTilt={2}
        specularColor="rgba(56, 189, 248, 0.12)"
        className="p-5 rounded-2xl border border-white/10 bg-theme-surface/85 backdrop-blur-xl flex items-center justify-between gap-4 shadow-xl"
      >
        <div className="flex items-center gap-3 text-[14px]">
          <div className="w-9 h-9 rounded-xl bg-theme-primary/10 border border-theme-primary/25 flex items-center justify-center text-theme-primary">
            <Sparkles className="w-5 h-5" strokeWidth={1.8} />
          </div>
          <div>
            <span className="text-[11px] font-mono text-theme-muted uppercase tracking-wider block">ENVIRONMENT PROFILE</span>
            <span className="font-semibold capitalize text-theme-text">Active Theme: <strong className="text-theme-primary">{theme} Mode</strong></span>
          </div>
        </div>
        <DevOnly fallback={<span className="text-[12px] font-mono text-theme-muted">PRODUCTION LOCK ACTIVE</span>}>
          <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-theme-primary/10 border border-theme-primary/25 text-theme-primary font-semibold">
            DEV MODE ACTIVE (TELEMETRY BADGES VISIBLE)
          </span>
        </DevOnly>
      </Card3D>

      {/* Section 0: V4 3D Interactive Primitives */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <Box className="w-5 h-5 text-theme-primary" />
          <h2 className="text-[18px] font-bold text-theme-text tracking-tight">
            V4 3D Perspective & Specular Primitives
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card3D 
            specularColor="rgba(56, 189, 248, 0.25)" 
            className="p-6 rounded-2xl border border-white/10 bg-theme-surface/90 backdrop-blur-xl shadow-xl flex flex-col justify-between"
          >
            <div>
              <span className="font-mono text-[10px] tracking-wider text-sky-400 uppercase font-bold">[3D-01] CYAN SPECULAR</span>
              <h3 className="text-lg font-bold text-theme-text mt-2">Pointer Tracking Tilt</h3>
              <p className="text-xs text-theme-muted mt-2 leading-relaxed font-mono">
                Calculates relative cursor coordinates in real time. Dynamic radial sheen spotlight tracks cursor position across the surface.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-theme-primary">
              <span>HOVER TO ENGAGE</span>
              <Compass className="w-4 h-4 animate-spin" />
            </div>
          </Card3D>

          <Card3D 
            specularColor="rgba(16, 185, 129, 0.25)" 
            className="p-6 rounded-2xl border border-emerald-500/20 bg-theme-surface/90 backdrop-blur-xl shadow-xl flex flex-col justify-between"
          >
            <div>
              <span className="font-mono text-[10px] tracking-wider text-emerald-400 uppercase font-bold">[3D-02] EMERALD SPECULAR</span>
              <h3 className="text-lg font-bold text-theme-text mt-2">Floating Z-Layer</h3>
              <p className="text-xs text-theme-muted mt-2 leading-relaxed font-mono">
                Nested elements elevated using preserve-3d translateZ(18px) to eliminate AI-slop flatness and establish true spatial depth.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-emerald-400">
              <span>DEPTH TRANSFORM</span>
              <Layers className="w-4 h-4" />
            </div>
          </Card3D>

          <Card3D 
            specularColor="rgba(239, 68, 68, 0.28)" 
            className="p-6 rounded-2xl border border-red-500/20 bg-theme-surface/90 backdrop-blur-xl shadow-xl flex flex-col justify-between"
          >
            <div>
              <span className="font-mono text-[10px] tracking-wider text-rose-400 uppercase font-bold">[3D-03] CRITICAL SPECULAR</span>
              <h3 className="text-lg font-bold text-theme-text mt-2">Spring Physics Inertia</h3>
              <p className="text-xs text-theme-muted mt-2 leading-relaxed font-mono">
                Gentle cubic damping smooths mouse enter/exit physics. Automatic dampening respects OS prefers-reduced-motion preferences.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-rose-400">
              <span>CRITICAL ESCALATION</span>
              <Activity className="w-4 h-4" />
            </div>
          </Card3D>
        </div>
      </section>

      {/* Section 1: Color Tokens Palette */}
      <section className="p-6 rounded-2xl border border-white/10 bg-theme-surface/85 backdrop-blur-xl shadow-xl space-y-4">
        <h2 className="text-[16px] font-semibold text-theme-text border-b border-white/10 pb-2">
          1. Semantic Color Tokens
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 text-[12px] font-mono">
          <div className="p-3.5 rounded-xl border border-white/10 bg-theme-bg">
            <span className="block font-semibold">bg</span>
            <span className="text-theme-muted text-[11px]">Page Background</span>
          </div>
          <div className="p-3.5 rounded-xl border border-white/10 bg-theme-surface">
            <span className="block font-semibold">surface</span>
            <span className="text-theme-muted text-[11px]">Card Surface</span>
          </div>
          <div className="p-3.5 rounded-xl border border-white/20 bg-theme-surface text-theme-primary font-semibold">
            <span>border-control</span>
          </div>
          <div className="p-3.5 rounded-xl bg-theme-primary text-theme-on-primary font-semibold shadow-lg shadow-theme-primary/20">
            <span>primary</span>
          </div>
          <div className="p-3.5 rounded-xl bg-theme-primary/10 border border-theme-primary/30 text-theme-primary font-semibold">
            <span>primary-tint</span>
          </div>
          <div className="p-3.5 rounded-xl bg-theme-critical-bg text-theme-critical-text font-semibold border border-red-500/20">
            <span>critical-bg</span>
          </div>
          <div className="p-3.5 rounded-xl bg-theme-warning-bg text-theme-warning-text font-semibold border border-amber-500/20">
            <span>warning-bg</span>
          </div>
          <div className="p-3.5 rounded-xl bg-theme-healthy-bg text-theme-healthy-text font-semibold border border-emerald-500/20">
            <span>healthy-bg</span>
          </div>
        </div>
      </section>

      {/* Section 2: Buttons & Actions */}
      <section className="p-6 rounded-2xl border border-white/10 bg-theme-surface/85 backdrop-blur-xl shadow-xl space-y-4">
        <h2 className="text-[16px] font-semibold text-theme-text border-b border-white/10 pb-2">
          2. Buttons & Actions
        </h2>
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="primary" icon={Plus} className="shadow-lg shadow-theme-primary/20">
            Primary Action
          </Button>
          <Button variant="secondary" icon={Filter}>
            Secondary Action
          </Button>
          <Button variant="ghost" icon={RefreshCw}>
            Ghost Button
          </Button>
          <Button variant="primary" isLoading>
            Loading...
          </Button>
          <Button variant="secondary" disabled>
            Disabled
          </Button>
        </div>
      </section>

      {/* Section 3: Status Badges & Delta Chips */}
      <section className="p-6 rounded-2xl border border-white/10 bg-theme-surface/85 backdrop-blur-xl shadow-xl space-y-4">
        <h2 className="text-[16px] font-semibold text-theme-text border-b border-white/10 pb-2">
          3. Status Badges & Delta Chips (Tactical Telemetry)
        </h2>
        <div className="flex flex-wrap items-center gap-4">
          <StatusBadge status="RED" />
          <StatusBadge status="AMBER" />
          <StatusBadge status="GREEN" />
          <StatusBadge status="CYAN" />
          <StatusBadge status="NEUTRAL" />
          <DeltaChip value={-7} unit="pts" />
          <DeltaChip value={12} unit="%" />
          <DeltaChip value={0} unit="pts" />
        </div>
      </section>

      {/* Section 4: KPI Cards */}
      <section className="p-6 rounded-2xl border border-white/10 bg-theme-surface/85 backdrop-blur-xl shadow-xl space-y-4">
        <h2 className="text-[16px] font-semibold text-theme-text border-b border-white/10 pb-2">
          4. KPI Telemetry Cards with 3D Specular Sheen
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <KpiCard
            title="Chance of running out"
            value="42"
            unit="%"
            status="RED"
            subtext="3 facilities critical stockout risk"
            delta={{ value: -7, unit: 'pts' }}
          />
          <KpiCard
            title="Days left"
            value="14.2"
            unit="days"
            status="AMBER"
            subtext="Lead time + 3 days safety buffer"
            delta={{ value: 3, unit: 'days' }}
          />
          <KpiCard
            title="Model accuracy"
            value="94.8"
            unit="%"
            status="GREEN"
            icon={Activity}
            subtext="Federated global model v7"
          />
        </div>
      </section>

      {/* Section 5: Empty States & Skeletons */}
      <section className="p-6 rounded-2xl border border-white/10 bg-theme-surface/85 backdrop-blur-xl shadow-xl space-y-4">
        <h2 className="text-[16px] font-semibold text-theme-text border-b border-white/10 pb-2">
          5. Empty States & Skeletons
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <EmptyState
            title="No pending transfers"
            description="All district supply reallocation routes are currently resolved."
            action={<Button variant="secondary" size="sm">Refresh List</Button>}
          />
          <TableSkeleton rows={3} columns={3} />
        </div>
      </section>
    </motion.div>
  );
};

