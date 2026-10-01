import React from 'react';
import { Facility } from '../../types/api';
import { FacilityMap } from './FacilityMap';
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
  initial3D?: boolean;
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
  initial3D = false,
}) => {
  if (isLoading) {
    return (
      <div className={`p-6 flex flex-col items-center justify-center min-h-[520px] rounded-xl border border-slate-800 bg-slate-950 ${className}`}>
        <Skeleton className="w-full h-full min-h-[480px] rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`p-6 flex flex-col items-center justify-center min-h-[520px] rounded-xl border border-slate-800 bg-slate-950 ${className}`}>
        <ErrorState
          title="Failed to Load Realistic Facility Map"
          message="Could not load facility geographic positions from GET /facilities."
          onRetry={onRetry}
        />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl min-h-[540px] border border-slate-800 shadow-2xl bg-slate-950 ${className}`}>
      {/* Ultra-Realistic HD Satellite & 3D Facility Map */}
      <FacilityMap
        facilities={facilities}
        selectedFacilityId={selectedFacilityId}
        onSelectFacility={onSelectFacility}
        activePolyline={activePolyline}
        showControls={true}
        showLegend={true}
        initial3D={initial3D}
      />
    </div>
  );
};
