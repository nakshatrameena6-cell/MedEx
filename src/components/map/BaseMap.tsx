import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { decode } from '@googlemaps/polyline-codec';
import { Facility } from '../../types/api';

interface BaseMapProps {
  facilities: Facility[];
  selectedFacilityId: string | null;
  onSelectFacility: (facilityId: string) => void;
  activePolyline?: string | null;
  tileLayerType?: 'dark' | 'satellite';
}

export const BaseMap: React.FC<BaseMapProps> = ({
  facilities,
  selectedFacilityId,
  onSelectFacility,
  activePolyline,
  tileLayerType = 'dark',
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const polylineLayerRef = useRef<L.Polyline | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [currentZoom, setCurrentZoom] = useState<number>(11);

  // Default Center: Tamil Nadu District (TN-D01)
  const defaultCenter: [number, number] = [10.80, 78.70];

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 11,
      zoomControl: false, // Custom MapControls handle zoom
      attributionControl: false,
    });

    // Dark CartoDB Tile Layer
    const darkTileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    const tileLayer = L.tileLayer(darkTileUrl, {
      maxZoom: 18,
      subdomains: 'abcd',
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    mapRef.current = map;

    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    // Handle responsive resize
    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Tile Layer Type (Dark vs Satellite)
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;

    const darkUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    const satelliteUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

    tileLayerRef.current.setUrl(tileLayerType === 'satellite' ? satelliteUrl : darkUrl);
  }, [tileLayerType]);

  // Render / Update Facility Markers
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const currentMarkers = markersRef.current;

    // Clear removed markers
    const facilityIds = new Set(facilities.map((f) => f.facility_id));
    Object.keys(currentMarkers).forEach((id) => {
      if (!facilityIds.has(id)) {
        currentMarkers[id].remove();
        delete currentMarkers[id];
      }
    });

    // Add or update markers
    facilities.forEach((facility) => {
      const isSelected = facility.facility_id === selectedFacilityId;
      const statusClass =
        facility.status === 'RED'
          ? 'medex-marker-red'
          : facility.status === 'AMBER'
          ? 'medex-marker-amber'
          : 'medex-marker-green';

      const selectedClass = isSelected ? 'medex-marker-selected' : '';

      // Size scales slightly with zoom
      const size = isSelected ? 18 : 14;

      const customIcon = L.divIcon({
        className: `custom-div-icon`,
        html: `<div class="${statusClass} ${selectedClass}" style="width: ${size}px; height: ${size}px; transition: all 150ms ease;"></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      if (currentMarkers[facility.facility_id]) {
        // Update existing marker
        const marker = currentMarkers[facility.facility_id];
        marker.setLatLng([facility.lat, facility.lng]);
        marker.setIcon(customIcon);
      } else {
        // Create new marker
        const marker = L.marker([facility.lat, facility.lng], {
          icon: customIcon,
          title: facility.name,
        }).addTo(map);

        // Tooltip hover
        marker.bindTooltip(
          `<div class="font-sans">
            <strong class="text-medex-primary font-bold block">${facility.name}</strong>
            <span class="text-2xs font-mono text-medex-secondary">${facility.type} · ${facility.block || 'District'}</span>
            <div class="mt-1 flex items-center gap-1 font-mono text-2xs">
              <span>Status:</span>
              <span class="font-bold ${
                facility.status === 'RED'
                  ? 'text-medex-red-light'
                  : facility.status === 'AMBER'
                  ? 'text-medex-amber-light'
                  : 'text-medex-green-light'
              }">${facility.status}</span>
            </div>
          </div>`,
          { direction: 'top', offset: [0, -8], opacity: 0.95 }
        );

        // Click handler
        marker.on('click', () => {
          onSelectFacility(facility.facility_id);
        });

        currentMarkers[facility.facility_id] = marker;
      }
    });
  }, [facilities, selectedFacilityId, onSelectFacility]);

  // Decode & Render Polyline Route (for Transfer Compatibility)
  useEffect(() => {
    if (!mapRef.current) return;

    if (polylineLayerRef.current) {
      polylineLayerRef.current.remove();
      polylineLayerRef.current = null;
    }

    if (activePolyline) {
      try {
        const decodedPoints = decode(activePolyline); // returns LatLngTuples [lat, lng][]
        const latLngs: [number, number][] = decodedPoints.map((p) => [p[0], p[1]]);

        const polyline = L.polyline(latLngs, {
          color: '#06B6D4',
          weight: 4,
          opacity: 0.85,
          dashArray: '8, 6',
        }).addTo(mapRef.current);

        polylineLayerRef.current = polyline;

        // Auto-fit bounds if polyline present
        mapRef.current.fitBounds(polyline.getBounds(), { padding: [40, 40] });
      } catch (err) {
        console.warn('Polyline decoding error:', err);
      }
    }
  }, [activePolyline]);

  return (
    <div className="w-full h-full relative font-sans">
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Zoom Level Indicator Pill */}
      <div className="absolute bottom-3 left-3 z-20 pointer-events-none">
        <span className="px-2.5 py-1 rounded bg-medex-sidebar/90 border border-medex-border text-2xs font-mono text-medex-muted backdrop-blur-md">
          ZOOM: {currentZoom} | GIS: CARTODB DARK
        </span>
      </div>
    </div>
  );
};
