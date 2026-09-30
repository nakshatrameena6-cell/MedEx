import React from 'react';
import { Plus, Minus, RotateCcw, Layers } from 'lucide-react';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRecenter: () => void;
  tileLayer: 'dark' | 'satellite';
  onToggleTileLayer: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onRecenter,
  tileLayer,
  onToggleTileLayer,
}) => {
  return (
    <div className="flex flex-col gap-1.5 font-sans">
      {/* Zoom In & Out Group */}
      <div className="medex-panel bg-medex-sidebar/90 backdrop-blur-md border-medex-border shadow-lg rounded-md overflow-hidden flex flex-col divide-y divide-medex-border">
        <button
          type="button"
          onClick={onZoomIn}
          title="Zoom In"
          className="p-2 text-medex-secondary hover:text-medex-primary hover:bg-medex-hover transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onZoomOut}
          title="Zoom Out"
          className="p-2 text-medex-secondary hover:text-medex-primary hover:bg-medex-hover transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* Recenter Button */}
      <button
        type="button"
        onClick={onRecenter}
        title="Recenter Map to District"
        className="medex-panel p-2 bg-medex-sidebar/90 backdrop-blur-md border-medex-border shadow-lg rounded-md text-medex-secondary hover:text-medex-cyan hover:bg-medex-hover transition-colors"
      >
        <RotateCcw className="w-4 h-4" />
      </button>

      {/* Tile Layer Toggle */}
      <button
        type="button"
        onClick={onToggleTileLayer}
        title={`Switch to ${tileLayer === 'dark' ? 'Satellite' : 'Dark GIS'} Layer`}
        className={`medex-panel p-2 bg-medex-sidebar/90 backdrop-blur-md border-medex-border shadow-lg rounded-md transition-colors ${
          tileLayer === 'satellite' ? 'text-medex-cyan border-medex-cyan/40' : 'text-medex-secondary hover:text-medex-primary'
        }`}
      >
        <Layers className="w-4 h-4" />
      </button>
    </div>
  );
};
