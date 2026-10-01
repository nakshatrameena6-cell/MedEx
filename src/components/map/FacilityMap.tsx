import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { decode } from '@googlemaps/polyline-codec';
import { Facility } from '../../types/api';
import { MapControls, MapTileLayer } from './MapControls';
import { MapLegend } from './MapLegend';
import { WifiOff, Loader2 } from 'lucide-react';

export interface FacilityMapProps {
  facilities: Facility[];
  selectedFacilityId?: string | null;
  onSelectFacility?: (facilityId: string | null) => void;
  activePolyline?: string | null;
  transferRoute?: {
    from: { lat: number; lng: number; name: string; facility_id?: string };
    to: { lat: number; lng: number; name: string; facility_id?: string };
    polyline?: string | null;
  } | null;
  className?: string;
  showControls?: boolean;
  showLegend?: boolean;
  initial3D?: boolean;
}

// 1. Ultra-Realistic High-Res Satellite + Hybrid Road Network & Place Labels
const SATELLITE_HYBRID_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    'esri-satellite': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: 'Tiles &copy; Esri &mdash; High-Resolution Earth Imagery',
    },
    'esri-roads': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 19,
    },
    'esri-places': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'esri-satellite-layer',
      type: 'raster',
      source: 'esri-satellite',
      minzoom: 0,
      maxzoom: 19,
    },
    {
      id: 'esri-roads-layer',
      type: 'raster',
      source: 'esri-roads',
      minzoom: 0,
      maxzoom: 19,
      paint: {
        'raster-opacity': 0.85,
      },
    },
    {
      id: 'esri-places-layer',
      type: 'raster',
      source: 'esri-places',
      minzoom: 0,
      maxzoom: 19,
      paint: {
        'raster-opacity': 0.95,
      },
    },
  ],
};

// 2. Topographical Shaded Relief Basemap
const TOPO_RELIEF_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    'esri-topo': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: 'Tiles &copy; Esri &mdash; Topographic Relief',
    },
    'esri-hillshade': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 18,
    },
  },
  layers: [
    {
      id: 'esri-topo-layer',
      type: 'raster',
      source: 'esri-topo',
      minzoom: 0,
      maxzoom: 19,
    },
    {
      id: 'esri-hillshade-layer',
      type: 'raster',
      source: 'esri-hillshade',
      minzoom: 0,
      maxzoom: 18,
      paint: {
        'raster-opacity': 0.45,
      },
    },
  ],
};

// 3. Tactical Dark Navigation
const DARK_TACTICAL_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    'carto-dark': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'carto-dark-layer',
      type: 'raster',
      source: 'carto-dark',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

// Facility Icons as SVGs for Beacon Heads
const getFacilityIconSvg = (type: string) => {
  switch (type) {
    case 'WAREHOUSE':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z"/><path d="M6 18h12"/><path d="M6 14h12"/><rect width="12" height="12" x="6" y="10"/></svg>`;
    case 'CHC':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c084fc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>`;
    case 'PHC':
    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 2v6"/><path d="M8 5h6"/><path d="M2 13a6 6 0 0 0 12 0V9a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v4Z"/><path d="M18 10a4 4 0 0 1 4 4v2a2 2 0 0 1-2 2h-2"/></svg>`;
  }
};

export const FacilityMap: React.FC<FacilityMapProps> = ({
  facilities,
  selectedFacilityId = null,
  onSelectFacility,
  activePolyline = null,
  transferRoute = null,
  className = '',
  showControls = true,
  showLegend = true,
  initial3D = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const outerWrapperRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [tileLayerType, setTileLayerType] = useState<MapTileLayer>('satellite');
  const [is3D, setIs3D] = useState<boolean>(initial3D);
  const [bearing, setBearing] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [currentCoordinates, setCurrentCoordinates] = useState<[number, number]>([78.70, 10.80]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (mapRef.current) {
        setTimeout(() => mapRef.current?.resize(), 200);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Compute District Bounding Box or Center
  const getMapCenter = useCallback((): [number, number] => {
    if (facilities.length === 0) return [78.70, 10.80];
    const avgLng = facilities.reduce((sum, f) => sum + f.lng, 0) / facilities.length;
    const avgLat = facilities.reduce((sum, f) => sum + f.lat, 0) / facilities.length;
    return [avgLng, avgLat];
  }, [facilities]);

  // Initialize MapLibre GL instance
  useEffect(() => {
    if (!mapContainerRef.current) return undefined;

    let styleSpec: maplibregl.StyleSpecification = SATELLITE_HYBRID_STYLE;
    if (tileLayerType === 'topo') styleSpec = TOPO_RELIEF_STYLE;
    if (tileLayerType === 'dark') styleSpec = DARK_TACTICAL_STYLE;

    let initTimer: any = null;

    try {
      const center = getMapCenter();

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: styleSpec,
        center: center,
        zoom: 10.6,
        pitch: is3D ? 52 : 0,
        bearing: is3D ? -16 : 0,
        maxPitch: 82,
        dragRotate: true,
        touchPitch: true,
        attributionControl: false,
      });

      mapRef.current = map;

      // Fail-safe: Always hide loading spinner after 600ms
      initTimer = setTimeout(() => {
        setIsInitializing(false);
        map.resize();
      }, 600);

      map.on('load', () => {
        setIsInitializing(false);
        map.resize();
      });

      map.on('render', () => {
        setIsInitializing(false);
      });

      map.on('rotate', () => {
        setBearing(map.getBearing());
      });

      map.on('pitch', () => {
        setIs3D(map.getPitch() > 18);
      });

      map.on('mousemove', (e) => {
        setCurrentCoordinates([
          parseFloat(e.lngLat.lng.toFixed(4)),
          parseFloat(e.lngLat.lat.toFixed(4)),
        ]);
      });

      map.on('error', (e: any) => {
        console.warn('MapLibre event notification (non-fatal):', e);
        setIsInitializing(false);
      });

      // Periodic resize check to guarantee correct canvas layout
      const resizeTimer1 = setTimeout(() => map.resize(), 150);
      const resizeTimer2 = setTimeout(() => map.resize(), 500);

      // ResizeObserver on the container to auto-resize on layout changes
      let ro: ResizeObserver | null = null;
      if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
        ro = new ResizeObserver(() => {
          map.resize();
        });
        ro.observe(mapContainerRef.current);
      }

      return () => {
        clearTimeout(initTimer);
        clearTimeout(resizeTimer1);
        clearTimeout(resizeTimer2);
        ro?.disconnect();
        map.remove();
        mapRef.current = null;
      };
    } catch (err) {
      console.warn('MapLibre initialization exception, falling back:', err);
      setIsOffline(true);
      setIsInitializing(false);
      return undefined;
    }
  }, [tileLayerType]);

  // Handle Layer style updates
  const handleLayerChange = (layer: MapTileLayer) => {
    setTileLayerType(layer);
  };

  // Toggle 3D Camera Tilt
  const handleToggle3D = () => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const targetPitch = is3D ? 0 : 54;
    const targetBearing = is3D ? 0 : -18;

    map.easeTo({
      pitch: targetPitch,
      bearing: targetBearing,
      duration: 1200,
    });
    setIs3D(!is3D);
  };

  // Reset Compass Bearing to North
  const handleResetBearing = () => {
    if (!mapRef.current) return;
    mapRef.current.easeTo({
      bearing: 0,
      duration: 800,
    });
    setBearing(0);
  };

  // Recenter Map to District Overview
  const handleRecenter = () => {
    if (!mapRef.current) return;
    const center = getMapCenter();
    mapRef.current.flyTo({
      center: center,
      zoom: 10.6,
      pitch: is3D ? 45 : 0,
      bearing: 0,
      essential: true,
      duration: 1400,
    });
    if (onSelectFacility) {
      onSelectFacility(null);
    }
  };

  // Fullscreen Toggle
  const handleToggleFullscreen = () => {
    if (!outerWrapperRef.current) return;
    if (!document.fullscreenElement) {
      outerWrapperRef.current.requestFullscreen?.().catch((err) => {
        console.warn('Fullscreen request denied:', err);
      });
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  // Smooth Fly-To when a facility is selected externally (e.g. from directory table)
  useEffect(() => {
    if (!mapRef.current || !selectedFacilityId) return;
    const target = facilities.find((f) => f.facility_id === selectedFacilityId);
    if (target) {
      mapRef.current.flyTo({
        center: [target.lng, target.lat],
        zoom: 14.2,
        pitch: 52,
        bearing: -15,
        essential: true,
        duration: 1500,
      });
    }
  }, [selectedFacilityId, facilities]);

  // Render Realistic 3D Glass Beacons with Micro-Pulse
  useEffect(() => {
    if (!mapRef.current || isOffline) return;

    // Clear previous markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const map = mapRef.current;

    facilities.forEach((facility) => {
      const isSelected = facility.facility_id === selectedFacilityId;
      const status = facility.status;

      let statusClass = 'is-healthy';
      let statusColor = '#10B981';
      let statusText = 'STABLE COVER';
      if (status === 'RED') {
        statusClass = 'is-critical';
        statusColor = '#EF4444';
        statusText = 'CRITICAL RISK';
      } else if (status === 'AMBER') {
        statusClass = 'is-warning';
        statusColor = '#F59E0B';
        statusText = 'LOW COVER WATCH';
      }

      const selectedClass = isSelected ? 'is-selected' : '';
      const iconSvg = getFacilityIconSvg(facility.type);

      // Create beacon DOM element
      const el = document.createElement('div');
      el.className = `medex-beacon-container ${statusClass} ${selectedClass}`;
      el.innerHTML = `
        <div class="medex-beacon-ground-shadow"></div>
        <div class="medex-beacon-ground-dot"></div>
        <div class="medex-beacon-stalk"></div>
        ${
          status === 'RED'
            ? '<div class="medex-beacon-pulse"></div><div class="medex-beacon-pulse medex-beacon-pulse-delayed"></div>'
            : status === 'AMBER'
            ? '<div class="medex-beacon-pulse"></div>'
            : ''
        }
        <div class="medex-beacon-head">
          ${iconSvg}
          <span class="medex-beacon-status-dot"></span>
        </div>
        <div class="medex-beacon-label-tag">
          ${facility.name.split(' ')[0]}
        </div>
      `;

      // Rich Contextual Glassmorphic Popup
      const popupHtml = `
        <div class="bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-xl p-3.5 text-slate-100 font-sans shadow-2xl min-w-[240px] max-w-[280px]">
          <div class="flex items-start justify-between gap-2 pb-2 border-b border-slate-800">
            <div>
              <div class="text-[13px] font-bold text-white leading-tight">${facility.name}</div>
              <div class="text-[10px] font-mono text-cyan-400 mt-0.5">${facility.facility_id} · ${facility.block || 'District'}</div>
            </div>
            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
              status === 'RED'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : status === 'AMBER'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }">
              ${facility.type}
            </span>
          </div>

          <div class="pt-2.5 pb-2 space-y-1.5 text-[11px]">
            <div class="flex items-center justify-between text-slate-300">
              <span>Risk Status:</span>
              <span class="font-bold font-mono" style="color: ${statusColor};">${statusText}</span>
            </div>
            <div class="flex items-center justify-between text-slate-300">
              <span>Population:</span>
              <span class="font-mono font-medium text-slate-200">${(facility.population_served || 45000).toLocaleString()} residents</span>
            </div>
            <div class="flex items-center justify-between text-slate-300">
              <span>Top Stock Metric:</span>
              <span class="font-mono font-medium ${status === 'RED' ? 'text-red-400 font-bold' : 'text-slate-200'}">
                ${status === 'RED' ? 'ORS (5.1d cover)' : status === 'AMBER' ? 'PARA500 (6.8d)' : 'Optimal (>15d)'}
              </span>
            </div>
          </div>

          <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
            <button
              id="btn-inspect-${facility.facility_id}"
              class="w-full py-1.5 px-2 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-300 font-medium text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Inspect Facility</span>
            </button>
          </div>
        </div>
      `;

      const popup = new maplibregl.Popup({
        offset: [0, -42],
        closeButton: false,
        className: 'medex-glass-popup',
      }).setHTML(popupHtml);

      // Add popup open event listener to bind the inspect button
      popup.on('open', () => {
        const btn = document.getElementById(`btn-inspect-${facility.facility_id}`);
        if (btn) {
          btn.onclick = () => {
            if (onSelectFacility) onSelectFacility(facility.facility_id);
          };
        }
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([facility.lng, facility.lat])
        .setPopup(popup)
        .addTo(map);

      el.addEventListener('click', () => {
        if (onSelectFacility) onSelectFacility(facility.facility_id);
        map.flyTo({
          center: [facility.lng, facility.lat],
          zoom: 14.2,
          pitch: 52,
          bearing: -15,
          essential: true,
          duration: 1500,
        });
      });

      markersRef.current.push(marker);
    });
  }, [facilities, selectedFacilityId, onSelectFacility, isOffline]);

  // Render Transfer Route Polyline (High-precision dashed neon arc)
  useEffect(() => {
    if (!mapRef.current || isOffline) return;
    const map = mapRef.current;

    const polylineStr = activePolyline || transferRoute?.polyline;
    if (!polylineStr) {
      if (map.getLayer('transfer-route-line')) map.removeLayer('transfer-route-line');
      if (map.getLayer('transfer-route-glow')) map.removeLayer('transfer-route-glow');
      if (map.getSource('transfer-route-source')) map.removeSource('transfer-route-source');
      return;
    }

    try {
      const decodedPoints = decode(polylineStr);
      const lngLats: [number, number][] = decodedPoints.map((p) => [p[1], p[0]]);

      const geojson: GeoJSON.Feature = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: lngLats,
        },
      };

      if (map.getSource('transfer-route-source')) {
        (map.getSource('transfer-route-source') as maplibregl.GeoJSONSource).setData(geojson);
      } else {
        map.addSource('transfer-route-source', {
          type: 'geojson',
          data: geojson,
        });

        // Outer neon glow
        map.addLayer({
          id: 'transfer-route-glow',
          type: 'line',
          source: 'transfer-route-source',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#06B6D4',
            'line-width': 8,
            'line-opacity': 0.45,
            'line-blur': 4,
          },
        });

        // Sharp core artery line
        map.addLayer({
          id: 'transfer-route-line',
          type: 'line',
          source: 'transfer-route-source',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#38BDF8',
            'line-width': 3.5,
            'line-dasharray': [2, 2],
          },
        });
      }
    } catch (err) {
      console.warn('Failed to parse and render route polyline:', err);
    }
  }, [activePolyline, transferRoute, isOffline]);

  // Counts for legend
  const redCount = facilities.filter((f) => f.status === 'RED').length;
  const amberCount = facilities.filter((f) => f.status === 'AMBER').length;
  const greenCount = facilities.filter((f) => f.status === 'GREEN').length;

  return (
    <div
      ref={outerWrapperRef}
      className={`relative w-full h-full min-h-[520px] rounded-xl overflow-hidden bg-slate-950 border border-slate-800 ${className}`}
    >
      {/* Top HUD Telemetry Banner */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none flex flex-wrap items-center gap-2 select-none">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/60 shadow-xl rounded-lg px-3 py-1.5 flex items-center gap-2 pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"></span>
          <span className="text-[11px] font-mono font-semibold text-slate-200">
            {tileLayerType === 'satellite'
              ? 'ESRI HD Satellite Hybrid'
              : tileLayerType === 'topo'
              ? 'Topographic Shaded Relief'
              : 'Tactical GIS Dark'}
          </span>
          <span className="text-slate-500 font-mono text-[10px]">|</span>
          <span className="text-[10px] font-mono text-cyan-400">
            {currentCoordinates[1]}° N, {currentCoordinates[0]}° E
          </span>
        </div>

        {is3D && (
          <div className="bg-cyan-500/20 backdrop-blur-md border border-cyan-500/40 text-cyan-300 shadow-lg rounded-lg px-2.5 py-1.5 text-[10px] font-mono font-bold flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            <span>3D PERSPECTIVE (52° PITCH)</span>
          </div>
        )}
      </div>

      {/* MapLibre WebGL Canvas Container */}
      {!isOffline ? (
        <div ref={mapContainerRef} className="w-full h-full min-h-[520px] z-10" />
      ) : (
        /* Fallback Offline View if completely disconnected or WebGL unavail */
        <div className="relative w-full h-full min-h-[520px] bg-slate-950 p-6 flex flex-col justify-between select-none">
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[11px] font-bold flex items-center gap-2 shadow-xl backdrop-blur-md">
              <WifiOff className="w-4 h-4 text-amber-400" />
              <span>Offline Schematic Mode</span>
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center text-slate-400 font-sans text-sm">
            Map tiles unavailable while offline. Facilities remain tracked locally.
          </div>
        </div>
      )}

      {/* Floating Interactive Controls (Top Right) */}
      {showControls && (
        <div className="absolute top-4 right-4 z-20">
          <MapControls
            onZoomIn={() => mapRef.current?.zoomIn()}
            onZoomOut={() => mapRef.current?.zoomOut()}
            onRecenter={handleRecenter}
            tileLayer={tileLayerType}
            onChangeTileLayer={handleLayerChange}
            is3D={is3D}
            onToggle3D={handleToggle3D}
            bearing={bearing}
            onResetBearing={handleResetBearing}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
          />
        </div>
      )}

      {/* Floating Legend (Bottom Left) */}
      {showLegend && (
        <div className="absolute bottom-4 left-4 z-20">
          <MapLegend
            redCount={redCount}
            amberCount={amberCount}
            greenCount={greenCount}
          />
        </div>
      )}

      {/* Loading Overlay */}
      {isInitializing && !isOffline && (
        <div className="absolute inset-0 z-30 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <span className="text-[12px] font-mono text-cyan-300 font-semibold tracking-wider uppercase">
            Loading High-Res Geospatial Tiles...
          </span>
        </div>
      )}
    </div>
  );
};
