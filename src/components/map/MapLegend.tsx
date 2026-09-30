import React from 'react';

export const MapLegend: React.FC = () => {
  return (
    <div className="medex-panel p-2.5 bg-medex-sidebar/90 backdrop-blur-md border-medex-border shadow-lg rounded-md text-2xs font-mono font-medium flex items-center gap-4">
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-medex-red shadow-medex-glow-red" />
        <span className="text-medex-red-light font-semibold">RED</span>
        <span className="text-medex-muted hidden sm:inline">(Critical Risk)</span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-medex-amber" />
        <span className="text-medex-amber-light font-semibold">AMBER</span>
        <span className="text-medex-muted hidden sm:inline">(Low Cover)</span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-medex-green" />
        <span className="text-medex-green-light font-semibold">GREEN</span>
        <span className="text-medex-muted hidden sm:inline">(Cover OK)</span>
      </div>

      <div className="hidden md:flex items-center gap-1.5 pl-3 border-l border-medex-border">
        <span className="h-2.5 w-2.5 rounded-full border-2 border-medex-cyan bg-transparent" />
        <span className="text-medex-cyan font-semibold">Selected Facility</span>
      </div>
    </div>
  );
};
