import React from 'react';
import { Facility } from '../../types/api';
import { FacilityMap } from './FacilityMap';

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
}) => {
  return (
    <FacilityMap
      facilities={facilities}
      selectedFacilityId={selectedFacilityId}
      onSelectFacility={(id) => onSelectFacility(id || '')}
      activePolyline={activePolyline}
      showControls={false}
      showLegend={false}
    />
  );
};
