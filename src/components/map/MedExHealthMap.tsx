import React, { useState } from 'react';
import { Facility } from '../../types/api';
import { BaseMap } from './BaseMap';
import { MapControls } from './MapControls';
import { MapLegend } from './MapLegend';
import { FacilityDrawer } from './FacilityDrawer';
import { Skeleton } from '../common/Skeleton';
import { ErrorState } from '../common/ErrorState';

interface MedExHealthMapProps {
  facilities: Facility[];
  selectedFacilityId: string | null;
  onSelectFacility: (facilityId: string | null) => void;
  activePolyline?: string | null;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  className?: string;
}

export const MedExHealthMap: React.FC<MedExHealthMapProps> = ({
  facilities,
  selectedFacilityId,
  onSelectFacility,
  activePolyline,
  isLoading = false,
  isError = false,
  onRetry,
  className = '',
}) => {
  const [tileLayerType, setTileLayerType] = useState<'dark' | 'satellite'>('dark');

  if (isLoading) {
    return (
      <div className={`medex-panel p-6 flex flex-col items-center justify-center min-h-[420px] ${className}`}>
        <Skeleton className="w-full h-full min-h-[380px] rounded-lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`medex-panel p-6 flex flex-col items-center justify-center min-h-[420px] ${className}`}>
        <ErrorState
          title="Failed to Load Facility Map"
          message="Could not load facility geographic positions from GET /facilities."
          onRetry={onRetry}
        />
      </div>
    );
  }

  return (
    <div className={`medex-panel relative overflow-hidden rounded-lg min-h-[480px] border-medex-border ${className}`}>
      {/* Interactive Base Map Component */}
      <BaseMap
        facilities={facilities}
        selectedFacilityId={selectedFacilityId}
        onSelectFacility={(id) => onSelectFacility(id)}
        activePolyline={activePolyline}
        tileLayerType={tileLayerType}
      />

      {/* Floating Map Controls (Top Right) */}
      <div className="absolute top-4 right-4 z-20">
        <MapControls
          onZoomIn={() => {
            const mapEl = document.querySelector('.leaflet-container');
            if (mapEl) {
              const zoomBtn = mapEl.querySelector('.leaflet-control-zoom-in') as HTMLElement;
              if (zoomBtn) zoomBtn.click();
            }
          }}
          onZoomOut={() => {
            const mapEl = document.querySelector('.leaflet-container');
            if (mapEl) {
              const zoomBtn = mapEl.querySelector('.leaflet-control-zoom-out') as HTMLElement;
              if (zoomBtn) zoomBtn.click();
            }
          }}
          onRecenter={() => {
            onSelectFacility(null);
          }}
          tileLayer={tileLayerType}
          onToggleTileLayer={() => setTileLayerType(tileLayerType === 'dark' ? 'satellite' : 'dark')}
        />
      </div>

      {/* Floating Map Legend (Bottom Right) */}
      <div className="absolute bottom-4 right-4 z-20">
        <MapLegend />
      </div>

      {/* Facility Detail Drawer (Authoritative surface consuming GET /facilities/{facility_id}/status) */}
      <FacilityDrawer
        facilityId={selectedFacilityId}
        onClose={() => onSelectFacility(null)}
      />
    </div>
  );
};
