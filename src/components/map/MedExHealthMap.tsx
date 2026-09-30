import React from 'react';
import { Facility } from '../../types/api';
import { FacilityMap } from './FacilityMap';
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
      {/* Keyless MapLibre Facility Map */}
      <FacilityMap
        facilities={facilities}
        selectedFacilityId={selectedFacilityId}
        onSelectFacility={onSelectFacility}
        activePolyline={activePolyline}
        showControls={true}
        showLegend={true}
      />

      {/* Facility Detail Drawer */}
      <FacilityDrawer
        facilityId={selectedFacilityId}
        onClose={() => onSelectFacility(null)}
      />
    </div>
  );
};
