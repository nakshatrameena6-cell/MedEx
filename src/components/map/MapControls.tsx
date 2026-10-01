import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Minus,
  RotateCcw,
  Layers,
  Compass,
  Maximize2,
  Minimize2,
  Box,
  Check,
} from 'lucide-react';

export type MapTileLayer = 'satellite' | 'topo' | 'dark';

export interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRecenter: () => void;
  tileLayer: MapTileLayer | 'satellite' | 'dark';
  onChangeTileLayer?: (layer: MapTileLayer) => void;
  onToggleTileLayer?: () => void; // Backward compatibility
  is3D?: boolean;
  onToggle3D?: () => void;
  bearing?: number;
  onResetBearing?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onRecenter,
  tileLayer,
  onChangeTileLayer,
  onToggleTileLayer,
  is3D = false,
  onToggle3D,
  bearing = 0,
  onResetBearing,
  isFullscreen = false,
  onToggleFullscreen,
}) => {
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
  const layerMenuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (layerMenuRef.current && !layerMenuRef.current.contains(e.target as Node)) {
        setIsLayerMenuOpen(false);
      }
    };
    if (isLayerMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isLayerMenuOpen]);

  const handleSelectLayer = (selected: MapTileLayer) => {
    if (onChangeTileLayer) {
      onChangeTileLayer(selected);
    } else if (onToggleTileLayer) {
      onToggleTileLayer();
    }
    setIsLayerMenuOpen(false);
  };

  const layersList: { id: MapTileLayer; name: string; desc: string; icon: string }[] = [
    {
      id: 'satellite',
      name: 'Satellite Hybrid',
      desc: 'High-res imagery + roads & labels',
      icon: '🛰️',
    },
    {
      id: 'topo',
      name: 'Topographic Relief',
      desc: 'Hillshade terrain & contours',
      icon: '🏔️',
    },
    {
      id: 'dark',
      name: 'Tactical Dark GIS',
      desc: 'Dark arterial navigation',
      icon: '🌃',
    },
  ];

  return (
    <div className="flex flex-col gap-2 font-sans select-none z-30">
      {/* Zoom Controls */}
      <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/60 shadow-xl rounded-lg overflow-hidden flex flex-col divide-y divide-slate-700/50">
        <button
          type="button"
          onClick={onZoomIn}
          title="Zoom In"
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all flex items-center justify-center"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onZoomOut}
          title="Zoom Out"
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all flex items-center justify-center"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* 3D Perspective Toggle Button */}
      {onToggle3D && (
        <button
          type="button"
          onClick={onToggle3D}
          title={is3D ? 'Switch to Top-Down 2D' : 'Switch to 3D Oblique Perspective'}
          className={`p-2 rounded-lg border shadow-xl backdrop-blur-md transition-all flex items-center justify-center group ${
            is3D
              ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-cyan-500/20'
              : 'bg-slate-900/85 border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <Box className={`w-4 h-4 transition-transform ${is3D ? 'rotate-12 scale-110' : ''}`} />
          <span className="sr-only">Toggle 3D View</span>
        </button>
      )}

      {/* Compass / Bearing Reset */}
      {onResetBearing && (
        <button
          type="button"
          onClick={onResetBearing}
          title={`Reset Compass Bearing (Current: ${Math.round(bearing)}°)`}
          className="p-2 rounded-lg border border-slate-700/60 bg-slate-900/85 backdrop-blur-md shadow-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all flex items-center justify-center"
        >
          <Compass
            className="w-4 h-4 text-cyan-400 transition-transform duration-300"
            style={{ transform: `rotate(${-bearing}deg)` }}
          />
        </button>
      )}

      {/* Recenter Button */}
      <button
        type="button"
        onClick={onRecenter}
        title="Recenter Camera to District Overview"
        className="p-2 rounded-lg border border-slate-700/60 bg-slate-900/85 backdrop-blur-md shadow-xl text-slate-300 hover:text-cyan-300 hover:bg-slate-800/80 transition-all flex items-center justify-center"
      >
        <RotateCcw className="w-4 h-4" />
      </button>

      {/* Layer Switcher with Popover */}
      <div className="relative" ref={layerMenuRef}>
        <button
          type="button"
          onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
          title="Change Map Imagery & Basemap Layer"
          className={`p-2 rounded-lg border shadow-xl backdrop-blur-md transition-all flex items-center justify-center ${
            isLayerMenuOpen
              ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-cyan-500/20'
              : 'bg-slate-900/85 border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <Layers className="w-4 h-4" />
        </button>

        {isLayerMenuOpen && (
          <div className="absolute right-10 top-0 w-64 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-xl shadow-2xl p-2 space-y-1 z-40 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-2.5 py-1.5 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Basemap Layers
            </div>
            {layersList.map((item) => {
              const isActive = tileLayer === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectLayer(item.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all ${
                    isActive
                      ? 'bg-cyan-950/60 border border-cyan-500/40 text-cyan-300'
                      : 'hover:bg-slate-800/70 border border-transparent text-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-base leading-none pt-0.5">{item.icon}</span>
                    <div>
                      <div className="text-[12px] font-medium leading-snug">{item.name}</div>
                      <div className="text-[10px] text-slate-400 leading-tight">{item.desc}</div>
                    </div>
                  </div>
                  {isActive && <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Fullscreen Toggle */}
      {onToggleFullscreen && (
        <button
          type="button"
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Map Theater'}
          className="p-2 rounded-lg border border-slate-700/60 bg-slate-900/85 backdrop-blur-md shadow-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all flex items-center justify-center"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
};
