import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, ChevronRight, RefreshCw, Camera } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { DeltaChip } from '../components/common/DeltaChip';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { TableSkeleton, Skeleton } from '../components/common/Skeleton';
import { MedExHealthMap } from '../components/map/MedExHealthMap';
import { FacilityDrawer } from '../components/map/FacilityDrawer';
import { useAuthRole } from '../context/AuthRoleContext';
import { Facility, RiskResponse, RiskStatus, FacilityType } from '../types/api';
import { listFacilities } from '../services/facilitiesService';
import { getRisk } from '../services/riskService';
import { COPY } from '../constants/copy';
import { Select } from '../components/common/Select';
import { X, RotateCcw } from 'lucide-react';
import { Card3D } from '../components/3d/Card3D';

export const MapView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { role, district, user, isMockMode } = useAuthRole();

  // Filters state reflected in URL params
  const statusFilter = searchParams.get('status') || 'ALL';
  const typeFilter = searchParams.get('type') || 'ALL';
  const drugFilter = searchParams.get('drug_code') || 'ALL';

  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // API Data State
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [riskData, setRiskData] = useState<RiskResponse | null>(null);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const loadMapData = async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage('');

    const headers: Record<string, string> = {
      'X-Role': role,
      'X-District': district,
      'X-User': user,
    };
    if (isMockMode) {
      headers['X-Mock'] = 'true';
    }

    try {
      const facilityParams = {
        district_id: district,
        status: statusFilter !== 'ALL' ? (statusFilter as RiskStatus) : undefined,
        type: typeFilter !== 'ALL' ? (typeFilter as FacilityType) : undefined,
        drug_code: drugFilter !== 'ALL' ? drugFilter : undefined,
      };

      const facList = await listFacilities(facilityParams, headers);
      setFacilities(facList.items || []);

      const riskResp = await getRisk({ district_id: district, limit: 10 }, headers);
      setRiskData(riskResp);
    } catch (err: any) {
      setIsError(true);
      setErrorMessage(err.message || 'Failed to load geospatial data from server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMapData();
  }, [role, district, user, isMockMode, statusFilter, typeFilter, drugFilter]);

  // Count by status
  const redCount = facilities.filter((f) => f.status === 'RED').length;
  const greenCount = facilities.filter((f) => f.status === 'GREEN').length;

  let activeFilterCount = 0;
  if (statusFilter !== 'ALL') activeFilterCount += 1;
  if (typeFilter !== 'ALL') activeFilterCount += 1;
  if (drugFilter !== 'ALL') activeFilterCount += 1;

  const updateFilters = (newStatus: string, newType: string, newDrug: string) => {
    const params: Record<string, string> = {};
    if (newStatus !== 'ALL') params.status = newStatus;
    if (newType !== 'ALL') params.type = newType;
    if (newDrug !== 'ALL') params.drug_code = newDrug;
    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setSearchParams({});
  };

  return (
    <div className="space-y-6 font-sans text-theme-text">
      {/* Page Header */}
      <div className="relative">
        <PageHeader
          title={COPY.headers.districtMapTitle}
          subtitle={
            facilities.length > 0
              ? `${facilities.length} healthcare facilities monitored in District ${district}`
              : 'No facilities found'
          }
          activeFilterCount={activeFilterCount}
          onToggleFilters={() => setIsFilterPopoverOpen(!isFilterPopoverOpen)}
          actionSlot={
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                icon={RefreshCw}
                onClick={loadMapData}
                isLoading={isLoading}
              >
                {COPY.actions.refresh}
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Camera}
                onClick={() => navigate('/capture')}
              >
                {COPY.nav.phcCapture}
              </Button>
            </div>
          }
        />

        {/* Filters Popover */}
        {isFilterPopoverOpen && (
          <div
            ref={popoverRef}
            className="absolute right-0 top-12 z-30 w-80 bg-theme-surface border border-theme-border rounded-xl shadow-xl p-4 space-y-4 font-sans animate-fade-in text-theme-text"
          >
            <div className="flex items-center justify-between border-b border-theme-border pb-2">
              <h3 className="text-[14px] font-semibold text-theme-text">Filter Health Centres</h3>
              <button
                type="button"
                onClick={() => setIsFilterPopoverOpen(false)}
                className="p-1 rounded text-theme-muted hover:text-theme-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <Select
                label="Stock Status"
                value={statusFilter}
                onChange={(val) => updateFilters(val, typeFilter, drugFilter)}
                options={[
                  { value: 'ALL', label: 'All Statuses (Critical / Low / Stable)' },
                  { value: 'RED', label: 'Critical (Under 7 days stock)' },
                  { value: 'AMBER', label: 'Low Stock (7–14 days stock)' },
                  { value: 'GREEN', label: 'Stable (Over 14 days stock)' },
                ]}
              />

              <Select
                label="Centre Type"
                value={typeFilter}
                onChange={(val) => updateFilters(statusFilter, val, drugFilter)}
                options={[
                  { value: 'ALL', label: 'All Types' },
                  { value: 'PHC', label: 'Primary Health Centre (PHC)' },
                  { value: 'CHC', label: 'Community Health Centre (CHC)' },
                  { value: 'WAREHOUSE', label: 'District Warehouse' },
                ]}
              />

              <Select
                label="Medicine"
                value={drugFilter}
                onChange={(val) => updateFilters(statusFilter, typeFilter, val)}
                options={[
                  { value: 'ALL', label: 'All Medicines' },
                  { value: 'ORS', label: 'ORS (Oral Rehydration Salts)' },
                  { value: 'PARA500', label: 'Paracetamol 500mg' },
                  { value: 'AMOX500', label: 'Amoxicillin 500mg' },
                ]}
              />
            </div>

            <div className="pt-2 border-t border-theme-border flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-theme-muted hover:text-theme-primary transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>

              <Button variant="primary" size="sm" onClick={() => setIsFilterPopoverOpen(false)}>
                Apply
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Max 3 KPI Cards Row */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Critical Stockouts */}
          <Card3D glowColor="rgba(239, 68, 68, 0.28)">
            <div className="p-5 font-sans flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-theme-critical font-bold tracking-wider">[01]</span>
                  <span className="text-[13px] font-medium text-theme-muted">Critical Shortages</span>
                </div>
                <StatusBadge status="RED" label="Critical" size="sm" />
              </div>
              <div className="flex items-baseline gap-2 pt-1">
                <span className="metric-value text-[40px] font-medium text-theme-critical leading-none tracking-tight font-mono">
                  {redCount}
                </span>
                <span className="text-[12px] font-mono text-theme-muted">centres</span>
              </div>
              <div className="pt-2 border-t border-theme-border flex items-center justify-between text-[11px] text-theme-muted">
                <span>Need urgent replenishment</span>
                <span className="font-mono text-[9px] text-theme-critical font-bold uppercase tracking-wider">
                  URGENT
                </span>
              </div>
            </div>
          </Card3D>

          {/* Card 2: District Supply Health */}
          <Card3D glowColor="rgba(45, 212, 191, 0.28)">
            <div className="p-5 font-sans flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-theme-primary font-bold tracking-wider">[02]</span>
                  <span className="text-[13px] font-medium text-theme-muted">Supply Health</span>
                </div>
                <span className="font-mono text-[10px] text-theme-muted bg-white/[0.05] px-2 py-0.5 rounded border border-theme-border">
                  SCORE
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-2 pt-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="metric-value text-[40px] font-medium text-theme-text leading-none tracking-tight font-mono">
                    {riskData?.resilience.score ?? 71}
                  </span>
                  <span className="text-[14px] font-mono text-theme-muted">/ 100</span>
                </div>
                {riskData?.resilience && (
                  <DeltaChip value={riskData.resilience.delta} unit="pts" />
                )}
              </div>
              <div className="pt-2 border-t border-theme-border flex items-center justify-between text-[11px] text-theme-muted">
                <span>Overall district supply health</span>
                <span className="font-mono text-[9px] text-theme-healthy-text font-bold uppercase tracking-wider">
                  HEALTHY
                </span>
              </div>
            </div>
          </Card3D>

          {/* Card 3: Well-Stocked Centres */}
          <Card3D glowColor="rgba(16, 185, 129, 0.25)">
            <div className="p-5 font-sans flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-theme-healthy-text font-bold tracking-wider">[03]</span>
                  <span className="text-[13px] font-medium text-theme-muted">Sufficient Stock</span>
                </div>
                <StatusBadge status="GREEN" label="Stable" size="sm" />
              </div>
              <div className="flex items-baseline gap-1.5 pt-1">
                <span className="metric-value text-[40px] font-medium text-theme-text leading-none tracking-tight font-mono">
                  {greenCount}
                </span>
                <span className="text-[13px] font-mono text-theme-muted">centres</span>
              </div>
              <div className="pt-2 border-t border-theme-border flex items-center justify-between text-[11px] text-theme-muted">
                <span>Safe stock for 14+ days</span>
                <span className="font-mono text-[9px] text-theme-healthy-text font-bold uppercase tracking-wider">
                  SAFE
                </span>
              </div>
            </div>
          </Card3D>
        </div>
      )}

      {/* Main Visual Centerpiece: Ultra-Realistic Geospatial Map Container */}
      <div className="rounded-xl border border-theme-border bg-theme-surface overflow-hidden min-h-[540px] shadow-lg">
        <MedExHealthMap
          facilities={facilities}
          selectedFacilityId={selectedFacilityId}
          onSelectFacility={setSelectedFacilityId}
          isLoading={isLoading}
          isError={isError}
          onRetry={loadMapData}
          initial3D={true}
        />
      </div>

      {/* Facility Directory Table */}
      {isLoading ? (
        <TableSkeleton rows={5} columns={4} />
      ) : isError ? (
        <ErrorState
          title="Couldn't load health centres"
          message={errorMessage}
          onRetry={loadMapData}
        />
      ) : facilities.length === 0 ? (
        <EmptyState
          title="No health centres found"
          description="No centres match the selected filters."
          action={
            activeFilterCount > 0 ? (
              <Button variant="secondary" size="sm" onClick={handleResetFilters}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="rounded-lg border border-theme-border bg-theme-surface overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-theme-border flex items-center justify-between">
            <h2 className="text-[17px] font-semibold text-theme-text">
              Health Centres in District
            </h2>
            <span className="text-[12px] font-mono text-theme-muted">
              {facilities.length} Centres
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="bg-theme-surface border-b border-theme-border text-theme-muted text-[13px] font-semibold sticky top-0 z-10">
                  <th className="px-5 py-3.5 w-5/12">Health Centre</th>
                  <th className="px-5 py-3.5 w-2/12">Type</th>
                  <th className="px-5 py-3.5 w-2/12">Population</th>
                  <th className="px-5 py-3.5 w-2/12">Stock Status</th>
                  <th className="px-3 py-3.5 w-10 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border">
                {facilities.map((fac) => {
                  const isSelected = fac.facility_id === selectedFacilityId;
                  const isRed = fac.status === 'RED';
                  const isAmber = fac.status === 'AMBER';

                  const rowBg = isRed
                    ? 'border-l-[4px] border-theme-critical bg-theme-row-critical'
                    : isAmber
                    ? 'border-l-[4px] border-theme-warning-text bg-theme-row-warning'
                    : 'border-l-[4px] border-transparent bg-theme-surface';

                  return (
                    <tr
                      key={fac.facility_id}
                      tabIndex={0}
                      role="button"
                      aria-expanded={isSelected}
                      aria-label={`${fac.name}, ${fac.type}, ${fac.status}`}
                      onClick={() => setSelectedFacilityId(fac.facility_id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedFacilityId(fac.facility_id);
                        }
                      }}
                      className={`group transition-all duration-150 min-h-[70px] cursor-pointer focus-visible:outline-2 focus-visible:outline-theme-primary ${rowBg} ${
                        isSelected
                          ? 'ring-2 ring-theme-primary bg-theme-primary-tint/20'
                          : 'hover:bg-theme-primary-tint/10 hover:border-theme-border-control'
                      }`}
                    >
                      {/* Facility Name & Block */}
                      <td className="px-5 py-3.5 align-middle">
                        <div>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 shrink-0 text-theme-muted" strokeWidth={1.8} />
                            <span className="text-[17px] font-semibold text-theme-text leading-tight">
                              {fac.name}
                            </span>
                          </div>
                          <span className="text-[12px] font-mono text-theme-muted block mt-0.5 ml-6">
                            ID: {fac.facility_id} · {fac.block || 'District Hub'}
                          </span>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-5 py-3.5 align-middle font-mono text-[13px] text-theme-text uppercase">
                        {fac.type}
                      </td>

                      {/* Population */}
                      <td className="px-5 py-3.5 align-middle font-mono text-[13px] text-theme-text">
                        {fac.population_served ? fac.population_served.toLocaleString() : '—'}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5 align-middle">
                        <StatusBadge status={fac.status} />
                      </td>

                      {/* Chevron */}
                      <td className="px-3 py-3.5 text-right align-middle">
                        <ChevronRight
                          className="w-5 h-5 text-theme-muted group-hover:translate-x-1 group-hover:text-theme-primary transition-transform duration-150"
                          strokeWidth={1.8}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Drawer overlay */}
      <FacilityDrawer
        facilityId={selectedFacilityId}
        onClose={() => setSelectedFacilityId(null)}
      />
    </div>
  );
};
