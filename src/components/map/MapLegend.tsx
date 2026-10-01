import React from 'react';
import { Stethoscope, Building2, Warehouse } from 'lucide-react';

interface MapLegendProps {
  redCount?: number;
  amberCount?: number;
  greenCount?: number;
}

export const MapLegend: React.FC<MapLegendProps> = ({
  redCount,
  amberCount,
  greenCount,
}) => {
  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/60 shadow-xl rounded-xl px-3.5 py-2.5 text-slate-200 font-sans flex flex-wrap items-center gap-3 sm:gap-4.5 select-none text-[11px]">
      {/* Risk Status Badges with Pulse */}
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 shadow-[0_0_8px_#ef4444]"></span>
        </span>
        <span className="text-red-400 font-semibold font-mono">RED</span>
        <span className="text-slate-400 hidden xs:inline">
          Critical {redCount !== undefined ? `(${redCount})` : ''}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2.5 w-2.5">
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400 shadow-[0_0_8px_#f59e0b]"></span>
        </span>
        <span className="text-amber-400 font-semibold font-mono">AMBER</span>
        <span className="text-slate-400 hidden xs:inline">
          Watch {amberCount !== undefined ? `(${amberCount})` : ''}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2.5 w-2.5">
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 shadow-[0_0_8px_#10b981]"></span>
        </span>
        <span className="text-emerald-400 font-semibold font-mono">GREEN</span>
        <span className="text-slate-400 hidden xs:inline">
          Stable {greenCount !== undefined ? `(${greenCount})` : ''}
        </span>
      </div>

      {/* Facility Type Legend (Separated by subtle border) */}
      <div className="hidden md:flex items-center gap-3 pl-3 border-l border-slate-700/60 text-slate-400">
        <div className="flex items-center gap-1" title="Primary Health Centre">
          <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-mono text-[10px]">PHC</span>
        </div>
        <div className="flex items-center gap-1" title="Community Health Centre">
          <Building2 className="w-3.5 h-3.5 text-purple-400" />
          <span className="font-mono text-[10px]">CHC</span>
        </div>
        <div className="flex items-center gap-1" title="Depot / Warehouse">
          <Warehouse className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-mono text-[10px]">Depot</span>
        </div>
      </div>
    </div>
  );
};
