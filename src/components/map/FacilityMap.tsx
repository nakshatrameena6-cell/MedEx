import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { decode } from '@googlemaps/polyline-codec';
import { Facility } from '../../types/api';
import { MapControls } from './MapControls';
import { MapLegend } from './MapLegend';
import { Skeleton } from '../common/Skeleton';
import { WifiOff } from 'lucide-react';

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
}

const DARK_RASTER_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    'carto-dark': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      ],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap &copy; CARTO',
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

const SATELLITE_RASTER_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    'esri-satellite': {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
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
  ],
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
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [tileLayerType, setTileLayerType] = useState<'dark' | 'satellite'>('dark');

  // Fallback timeout trigger (~4s timeout if tiles don't initialize)
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const timeout = setTimeout(() => {
      if (isInitializing) {
        // If maplibre hasn't finished loading in 4s, trigger fallback
        setIsOffline(true);
        setIsInitializing(false);
      }
    }, 4000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(timeout);
    };
  }, [isInitializing]);

  // Initialize MapLibre GL Map
  useEffect(() => {
    if (!mapContainerRef.current || isOffline) return undefined;

    try {
      const defaultCenter: [number, number] = [78.70, 10.80]; // [lng, lat] for MapLibre

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: tileLayerType === 'satellite' ? SATELLITE_RASTER_STYLE : DARK_RASTER_STYLE,
        center: defaultCenter,
        zoom: 10.5,
        attributionControl: false,
      });

      mapRef.current = map;

      map.on('load', () => {
        setIsInitializing(false);
        map.resize();
      });

      map.on('error', (e: any) => {
        console.warn('MapLibre GL tile error detected, switching to offline SVG schematic:', e);
        setIsOffline(true);
        setIsInitializing(false);
      });

      return () => {
        map.remove();
        mapRef.current = null;
      };
    } catch (err) {
      console.warn('MapLibre initialization exception, using fallback SVG:', err);
      setIsOffline(true);
      setIsInitializing(false);
      return undefined;
    }
  }, [isOffline, tileLayerType]);

  // Render / Update Facility Markers & Popups
  useEffect(() => {
    if (!mapRef.current || isOffline) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const map = mapRef.current;

    facilities.forEach((facility) => {
      const isSelected = facility.facility_id === selectedFacilityId;

      const el = document.createElement('div');
      const statusColorClass =
        facility.status === 'RED'
          ? 'medex-marker-red'
          : facility.status === 'AMBER'
          ? 'medex-marker-amber'
          : 'medex-marker-green';
      const selectedClass = isSelected ? 'medex-marker-selected' : '';

      el.className = `${statusColorClass} ${selectedClass}`;
      el.style.width = isSelected ? '18px' : '14px';
      el.style.height = isSelected ? '18px' : '14px';
      el.style.cursor = 'pointer';

      // Popup Content
      const popupHTML = `
        <div style="font-family: sans-serif; padding: 4px; text-align: left;">
          <strong style="color: #F1F5F9; font-size: 12px; display: block;">${facility.name}</strong>
          <span style="color: #67E8F9; font-family: monospace; font-size: 10px; display: block; margin-top: 2px;">
            ID: ${facility.facility_id} · ${facility.block || 'District'}
          </span>
          <div style="margin-top: 4px; font-size: 10px; color: #94A3B8;">
            Top Risk: <strong style="color: ${
              facility.status === 'RED' ? '#FCA5A5' : facility.status === 'AMBER' ? '#FDE68A' : '#6EE7B7'
            }">${facility.status === 'RED' ? 'ORS (5.1d cover)' : facility.status === 'AMBER' ? 'PARA500 (6.8d)' : 'Normal Stock'}</strong>
          </div>
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: 15, closeButton: false }).setHTML(popupHTML);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([facility.lng, facility.lat])
        .setPopup(popup)
        .addTo(map);

      el.addEventListener('click', () => {
        if (onSelectFacility) onSelectFacility(facility.facility_id);
      });

      markersRef.current.push(marker);
    });
  }, [facilities, selectedFacilityId, onSelectFacility, isOffline]);

  // Render Transfer Polyline Route on Map
  useEffect(() => {
    if (!mapRef.current || isOffline) return;
    const map = mapRef.current;

    const polylineStr = activePolyline || transferRoute?.polyline;
    if (!polylineStr) return;

    try {
      const decodedPoints = decode(polylineStr); // Returns [lat, lng][]
      const lngLats: [number, number][] = decodedPoints.map((p) => [p[1], p[0]]);

      const geojson: GeoJSON.Feature = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: lngLats,
        },
      };

      const addRouteLayer = () => {
        if (map.getSource('transfer-route-source')) {
          (map.getSource('transfer-route-source') as maplibregl.GeoJSONSource).setData(geojson);
        } else {
          map.addSource('transfer-route-source', {
            type: 'geojson',
            data: geojson,
          });

          map.addLayer({
            id: 'transfer-route-line',
            type: 'line',
            source: 'transfer-route-source',
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#06B6D4',
              'line-width': 4,
              'line-dasharray': [2, 2],
            },
          });
        }

        // Fit bounds to route
        const bounds = lngLats.reduce(
          (b, coord) => b.extend(coord as [number, number]),
          new maplibregl.LngLatBounds(lngLats[0], lngLats[0])
        );
        map.fitBounds(bounds, { padding: 60 });
      };

      if (map.isStyleLoaded()) {
        addRouteLayer();
      } else {
        map.once('load', addRouteLayer);
      }
    } catch (err) {
      console.warn('MapLibre route decoding error:', err);
    }
  }, [activePolyline, transferRoute, isOffline]);

  // Calculation for Static Dark SVG Schematic Fallback
  const getSvgCoordinates = () => {
    if (facilities.length === 0) return [];

    let minLat = Math.min(...facilities.map((f) => f.lat));
    let maxLat = Math.max(...facilities.map((f) => f.lat));
    let minLng = Math.min(...facilities.map((f) => f.lng));
    let maxLng = Math.max(...facilities.map((f) => f.lng));

    // Prevent division by zero
    if (minLat === maxLat) {
      minLat -= 0.05;
      maxLat += 0.05;
    }
    if (minLng === maxLng) {
      minLng -= 0.05;
      maxLng += 0.05;
    }

    return facilities.map((f) => {
      // Map lat/lng to percentage bounds (15% to 85%)
      const x = 15 + ((f.lng - minLng) / (maxLng - minLng)) * 70;
      const y = 85 - ((f.lat - minLat) / (maxLat - minLat)) * 70;
      return { ...f, svgX: x, svgY: y };
    });
  };

  const svgFacilities = getSvgCoordinates();

  return (
    <div className={`relative w-full h-full min-h-[420px] rounded-lg overflow-hidden bg-medex-bg border border-medex-border ${className}`}>
      {/* Skeleton Loading State */}
      {isInitializing && !isOffline && (
        <div className="absolute inset-0 z-30 p-4 bg-medex-bg flex flex-col items-center justify-center">
          <Skeleton className="w-full h-full rounded-lg" />
          <span className="absolute text-2xs font-mono text-medex-cyan font-bold bg-medex-sidebar px-3 py-1 rounded border border-medex-border shadow-md">
            Initializing Keyless MapLibre Engine...
          </span>
        </div>
      )}

      {/* Main MapLibre Container (Online) */}
      {!isOffline ? (
        <div ref={mapContainerRef} className="w-full h-full z-10" />
      ) : (
        /* Static Dark SVG Schematic Offline Fallback */
        <div className="relative w-full h-full min-h-[420px] bg-medex-bg p-4 flex flex-col justify-between select-none">
          {/* Top Offline Chip */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
            <span className="px-3 py-1 rounded-md bg-medex-amber/20 border border-medex-amber/40 text-medex-amber-light font-mono text-2xs font-bold flex items-center gap-1.5 shadow-md backdrop-blur-md">
              <WifiOff className="w-3.5 h-3.5 text-medex-amber" />
              <span>Offline map view</span>
            </span>
          </div>

          {/* SVG Map Canvas */}
          <svg className="w-full h-full absolute inset-0 z-10 pointer-events-auto" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Grid Pattern */}
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Render Transfer Route Line if present */}
            {transferRoute && (
              <line
                x1={15 + ((transferRoute.from.lng - 78.6) / 0.3) * 70}
                y1={85 - ((transferRoute.from.lat - 10.7) / 0.3) * 70}
                x2={15 + ((transferRoute.to.lng - 78.6) / 0.3) * 70}
                y2={85 - ((transferRoute.to.lat - 10.7) / 0.3) * 70}
                stroke="#06B6D4"
                strokeWidth="1"
                strokeDasharray="2,2"
                className="animate-pulse"
              />
            )}

            {/* Facilities Colored Dots */}
            {svgFacilities.map((f) => {
              const isSelected = f.facility_id === selectedFacilityId;
              const color = f.status === 'RED' ? '#EF4444' : f.status === 'AMBER' ? '#F59E0B' : '#10B981';

              return (
                <g key={f.facility_id} className="cursor-pointer" onClick={() => onSelectFacility && onSelectFacility(f.facility_id)}>
                  {isSelected && (
                    <circle cx={`${f.svgX}%`} cy={`${f.svgY}%`} r="3.5" fill="none" stroke="#06B6D4" strokeWidth="0.8" className="animate-ping" />
                  )}
                  <circle
                    cx={`${f.svgX}%`}
                    cy={`${f.svgY}%`}
                    r={isSelected ? '2.5' : '1.8'}
                    fill={color}
                    stroke="#FFFFFF"
                    strokeWidth="0.5"
                    className="transition-all hover:scale-125"
                  />
                  <text
                    x={`${f.svgX}%`}
                    y={`${f.svgY + 4}%`}
                    fill="#F1F5F9"
                    fontSize="2.5"
                    fontFamily="monospace"
                    textAnchor="middle"
                    className="pointer-events-none"
                  >
                    {f.name.split(' ')[0]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {/* Map Controls (Top Right) */}
      {showControls && (
        <div className="absolute top-4 right-4 z-20">
          <MapControls
            onZoomIn={() => {
              if (mapRef.current) mapRef.current.zoomIn();
            }}
            onZoomOut={() => {
              if (mapRef.current) mapRef.current.zoomOut();
            }}
            onRecenter={() => {
              if (onSelectFacility) onSelectFacility(null);
              if (mapRef.current) mapRef.current.flyTo({ center: [78.70, 10.80], zoom: 10.5 });
            }}
            tileLayer={tileLayerType}
            onToggleTileLayer={() => setTileLayerType(tileLayerType === 'dark' ? 'satellite' : 'dark')}
          />
        </div>
      )}

      {/* Map Legend (Bottom Right) */}
      {showLegend && (
        <div className="absolute bottom-4 right-4 z-20">
          <MapLegend />
        </div>
      )}
    </div>
  );
};
