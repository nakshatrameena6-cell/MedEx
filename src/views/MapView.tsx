import React, { useEffect, useState } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { SectionCard } from '../components/common/SectionCard';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { FilterBar } from '../components/common/FilterBar';
import { Select } from '../components/common/Select';
import { DataTable, Column } from '../components/common/DataTable';
import { MedExHealthMap } from '../components/map/MedExHealthMap';
import { useAuthRole } from '../context/AuthRoleContext';
import { Facility, RiskResponse, RiskStatus, FacilityType } from '../types/api';
import { listFacilities } from '../services/facilitiesService';
import { getRisk } from '../services/riskService';
import { Activity, ShieldAlert, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

export const MapView: React.FC = () => {
  const { role, district, user, isMockMode } = useAuthRole();

  // Contract Filter State
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [drugFilter, setDrugFilter] = useState<string>('ALL');

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
      // 1. Fetch facilities from GET /facilities
      const facilityParams = {
        district_id: district,
        status: statusFilter !== 'ALL' ? (statusFilter as RiskStatus) : undefined,
        type: typeFilter !== 'ALL' ? (typeFilter as FacilityType) : undefined,
        drug_code: drugFilter !== 'ALL' ? drugFilter : undefined,
      };

      const facList = await listFacilities(facilityParams, headers);
      setFacilities(facList.items || []);

      // 2. Fetch risk data from GET /risk
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
  const amberCount = facilities.filter((f) => f.status === 'AMBER').length;
  const greenCount = facilities.filter((f) => f.status === 'GREEN').length;

  // Table Columns
  const columns: Column<Facility>[] = [
    {
      key: 'status',
      header: 'Status',
      render: (f) => <StatusBadge status={f.status} size="sm" />,
      width: '90px',
    },
    {
      key: 'facility_id',
      header: 'Facility ID',
      render: (f) => <span className="font-mono text-2xs font-bold text-medex-cyan">{f.facility_id}</span>,
      width: '110px',
    },
    {
      key: 'name',
      header: 'Facility Name',
      render: (f) => (
        <div>
          <span className="font-semibold text-medex-primary block">{f.name}</span>
          <span className="text-2xs font-mono text-medex-muted">{f.block || 'District Hub'}</span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (f) => <span className="font-mono text-2xs uppercase text-medex-secondary">{f.type}</span>,
      width: '90px',
    },
    {
      key: 'population_served',
      header: 'Population',
      render: (f) => (
        <span className="font-mono text-2xs text-medex-secondary">
          {f.population_served ? f.population_served.toLocaleString() : '—'}
        </span>
      ),
      align: 'right',
    },
    {
      key: 'vulnerability_weight',
      header: 'Vulnerability',
      render: (f) => (
        <span className="font-mono text-2xs font-bold text-medex-cyan">
          {f.vulnerability_weight || 1.0}x
        </span>
      ),
      align: 'center',
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <PageHeader
        title="District Healthcare Map"
        subtitle="Geospatial visibility into PHCs, CHCs, stockout statuses, and active redistribution polylines."
        badge={<StatusBadge status="CYAN" label="GET /facilities" />}
        breadcrumbs={[{ label: 'MEDEx' }, { label: 'District Map' }]}
        actionSlot={
          <button
            type="button"
            onClick={loadMapData}
            title="Refresh Map Data"
            className="px-3 py-1.5 rounded bg-medex-surface border border-medex-border text-xs font-semibold text-medex-secondary hover:text-medex-primary hover:border-medex-border-active transition-colors inline-flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        }
      />

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="District Resilience Score"
          value={riskData?.resilience.score ?? 71}
          unit="/ 100"
          delta={{
            value: riskData?.resilience.delta ?? -7,
            label: 'pts',
            isPositiveGood: true,
          }}
          status={riskData?.resilience.drift_alert ? 'AMBER' : 'GREEN'}
          subtext={riskData?.resilience.drift_alert ? 'Drift alert: Dropped >5 pts week-over-week' : 'Resilience within normal bounds'}
          icon={Activity}
        />
        <MetricCard
          title="Critical Red Stockouts"
          value={redCount}
          unit="facilities"
          status="RED"
          subtext="Stock cover below lead time + safety buffer"
          icon={AlertTriangle}
        />
        <MetricCard
          title="Amber Warning Facilities"
          value={amberCount}
          unit="facilities"
          status="AMBER"
          subtext="Stock cover below 2x lead time"
          icon={ShieldAlert}
        />
        <MetricCard
          title="Healthy Facilities"
          value={greenCount}
          unit="facilities"
          status="GREEN"
          subtext="Sufficient cover for forecast demand"
          icon={CheckCircle}
        />
      </div>

      {/* Contract-Backed Filter Bar */}
      <FilterBar
        title="Contract Filters"
        onReset={() => {
          setStatusFilter('ALL');
          setTypeFilter('ALL');
          setDrugFilter('ALL');
        }}
      >
        <Select
          label="Risk Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'ALL', label: 'All Statuses (RED / AMBER / GREEN)' },
            { value: 'RED', label: 'RED (Critical Risk)' },
            { value: 'AMBER', label: 'AMBER (Low Cover)' },
            { value: 'GREEN', label: 'GREEN (Cover OK)' },
          ]}
        />
        <Select
          label="Facility Type"
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: 'ALL', label: 'All Facility Types' },
            { value: 'PHC', label: 'PHC (Primary Health Centre)' },
            { value: 'CHC', label: 'CHC (Community Health Centre)' },
            { value: 'WAREHOUSE', label: 'WAREHOUSE (District Depot)' },
          ]}
        />
        <Select
          label="Drug Master Code"
          value={drugFilter}
          onChange={setDrugFilter}
          options={[
            { value: 'ALL', label: 'All Essential Drugs' },
            { value: 'ORS', label: 'ORS (Oral Rehydration Salts)' },
            { value: 'PARA500', label: 'PARA500 (Paracetamol 500mg)' },
            { value: 'AMOX500', label: 'AMOX500 (Amoxicillin 500mg)' },
          ]}
        />
      </FilterBar>

      {/* Visual Centerpiece: Large Geospatial Map Container */}
      <SectionCard
        title="Geospatial Healthcare Network Map"
        subtitle={`Showing ${facilities.length} contract-backed facilities in District ${district}`}
        actionSlot={
          <div className="flex items-center gap-2">
            <span className="text-2xs font-mono text-medex-cyan font-semibold">
              GET /facilities & GET /facilities/{'{id}'}/status
            </span>
          </div>
        }
        className="min-h-[500px]"
        contentClassName="p-0"
      >
        <MedExHealthMap
          facilities={facilities}
          selectedFacilityId={selectedFacilityId}
          onSelectFacility={setSelectedFacilityId}
          isLoading={isLoading}
          isError={isError}
          onRetry={loadMapData}
        />
      </SectionCard>

      {/* Supporting Facility Information & Context Table */}
      <SectionCard
        title="District Facility Directory"
        subtitle="Click any row to open the authoritative facility detail drawer (GET /facilities/{id}/status)"
      >
        <DataTable
          columns={columns}
          data={facilities}
          isLoading={isLoading}
          isError={isError}
          errorMessage={errorMessage}
          onRetry={loadMapData}
          selectedRowId={selectedFacilityId || undefined}
          getRowId={(f) => f.facility_id}
          onRowClick={(f) => setSelectedFacilityId(f.facility_id)}
          emptyTitle="No facilities found"
          emptyDescription="No facilities match the selected status or facility type filter."
        />
      </SectionCard>
    </div>
  );
};
