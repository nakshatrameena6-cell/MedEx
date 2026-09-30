import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';
import { SectionCard } from '../components/common/SectionCard';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { FilterBar } from '../components/common/FilterBar';
import { Select } from '../components/common/Select';
import { DataTable, Column } from '../components/common/DataTable';
import { useAuthRole } from '../context/AuthRoleContext';
import { RiskItem, RiskResponse, RiskStatus } from '../types/api';
import { getRisk } from '../services/riskService';
import {
  Activity,
  AlertTriangle,
  ShieldAlert,
  MapPin,
  TrendingUp,
  RefreshCw,
  Info,
} from 'lucide-react';

export const RiskView: React.FC = () => {
  const navigate = useNavigate();
  const { role, district, user, isMockMode } = useAuthRole();

  // Filters supported by GET /risk contract
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [drugFilter, setDrugFilter] = useState<string>('ALL');
  const [limitFilter, setLimitFilter] = useState<string>('50');

  // API Data State
  const [riskResponse, setRiskResponse] = useState<RiskResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const loadRiskData = async () => {
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
      const data = await getRisk(
        {
          district_id: district,
          drug_code: drugFilter !== 'ALL' ? drugFilter : undefined,
          status: statusFilter !== 'ALL' ? (statusFilter as RiskStatus) : undefined,
          limit: parseInt(limitFilter, 10),
        },
        headers
      );
      setRiskResponse(data);
    } catch (err: any) {
      setIsError(true);
      setErrorMessage(err.message || 'Failed to load risk intelligence from GET /risk');
    } fontally: {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRiskData();
  }, [role, district, user, isMockMode, statusFilter, drugFilter, limitFilter]);

  const items = riskResponse?.items || [];
  const resilience = riskResponse?.resilience;

  // Table Columns displaying exact contract fields
  const columns: Column<RiskItem>[] = [
    {
      key: 'priority',
      header: 'Priority Rank',
      render: (r) => <PriorityBadge score={r.priority} />,
      width: '120px',
    },
    {
      key: 'facility',
      header: 'Facility',
      render: (r) => (
        <div>
          <span className="font-semibold text-medex-primary block">{r.facility_name}</span>
          <span className="text-2xs font-mono text-medex-muted">
            {r.facility_id} · {r.block || 'District'}
          </span>
        </div>
      ),
    },
    {
      key: 'drug',
      header: 'Medicine',
      render: (r) => (
        <div>
          <span className="font-semibold text-medex-primary block">{r.drug_name}</span>
          <span className="text-2xs font-mono text-medex-cyan">{r.drug_code}</span>
        </div>
      ),
    },
    {
      key: 'stock',
      header: 'Usable Stock',
      render: (r) => (
        <span className="font-mono text-xs text-medex-primary">
          {r.stock_qty.toLocaleString()} <span className="text-2xs text-medex-muted">{r.unit}</span>
        </span>
      ),
      align: 'right',
    },
    {
      key: 'cover_days',
      header: 'Days Cover (P50/P90)',
      render: (r) => (
        <div className="font-mono text-xs text-center">
          <span className="font-bold text-medex-primary">{r.cover_days}d</span>
          {typeof r.cover_days_p90 === 'number' && (
            <span className="text-2xs text-medex-muted block">({r.cover_days_p90}d P90)</span>
          )}
        </div>
      ),
      align: 'center',
    },
    {
      key: 'p_stockout',
      header: 'P(Stockout)',
      render: (r) => (
        <span className="font-mono text-2xs font-bold px-2 py-0.5 rounded bg-medex-red/15 border border-medex-red/30 text-medex-red-light">
          {Math.round(r.p_stockout * 100)}%
        </span>
      ),
      align: 'center',
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status} size="sm" />,
      align: 'center',
    },
    {
      key: 'reason',
      header: 'Gemini AI Reason & Flags',
      render: (r) => (
        <div className="space-y-1 max-w-sm">
          <p className="text-2xs text-medex-secondary leading-normal">{r.reason}</p>
          {r.flags && r.flags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {r.flags.map((flag, idx) => (
                <span
                  key={idx}
                  title={flag.reason}
                  className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-medex-elevated border border-medex-border text-medex-cyan"
                >
                  {flag.code}
                </span>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              // MANDATORY MAP INTEGRATION: Navigate to District Map & highlight facility
              navigate(`/map?facility_id=${r.facility_id}`);
            }}
            title="Locate facility on District Map"
            className="p-1.5 rounded bg-medex-surface border border-medex-border text-medex-cyan hover:bg-medex-cyan/15 hover:border-medex-cyan/40 transition-colors text-2xs font-mono font-semibold inline-flex items-center gap-1"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Map</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/forecast?facility_id=${r.facility_id}&drug_code=${r.drug_code}`);
            }}
            title="View demand forecast"
            className="p-1.5 rounded bg-medex-surface border border-medex-border text-medex-secondary hover:text-medex-primary hover:border-medex-border-active transition-colors text-2xs font-mono font-semibold inline-flex items-center gap-1"
          >
            <TrendingUp className="w-3.5 h-3.5 text-medex-cyan" />
            <span className="hidden xl:inline">Forecast</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/transfers?district_id=${r.district_id}&drug_code=${r.drug_code}`);
            }}
            title="Open Transfer Optimizer"
            className="p-1.5 rounded bg-medex-surface border border-medex-border text-medex-amber-light hover:bg-medex-amber/15 hover:border-medex-amber/40 transition-colors text-2xs font-mono font-semibold inline-flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Transfer</span>
          </button>
        </div>
      ),

      align: 'center',
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Stock-Out Risk Queue"
        subtitle="Ranked priority list of facilities approaching stock-out, evaluated against lead time, vulnerability, and population exposure."
        badge={<StatusBadge status="RED" label="GET /risk" />}
        breadcrumbs={[{ label: 'MEDEx' }, { label: 'Risk Intelligence' }]}
        actionSlot={
          <button
            type="button"
            onClick={loadRiskData}
            className="px-3 py-1.5 rounded bg-medex-surface border border-medex-border text-xs font-semibold text-medex-secondary hover:text-medex-primary hover:border-medex-border-active transition-colors inline-flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        }
      />

      {/* Resilience Summary Cards (Contract Supported: score, previous_week_score, delta, drift_alert) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="District Resilience Score"
          value={resilience?.score ?? 71}
          unit="/ 100"
          delta={{
            value: resilience?.delta ?? -7,
            label: 'pts',
            isPositiveGood: true,
          }}
          status={resilience?.drift_alert ? 'AMBER' : 'GREEN'}
          subtext={
            resilience?.drift_alert
              ? 'Drift alert: Score dropped >5 pts week-over-week'
              : 'Resilience score stable'
          }
          icon={Activity}
        />
        <MetricCard
          title="At-Risk Queue Items"
          value={items.length}
          unit="facilities"
          status="RED"
          subtext={`Sorted strictly by backend priority score`}
          icon={AlertTriangle}
        />
        <MetricCard
          title="Lead Time Cover Threshold"
          value="9.0"
          unit="days avg"
          status="AMBER"
          subtext="Lead time + 3 days safety buffer"
          icon={ShieldAlert}
        />
        <MetricCard
          title="Active District"
          value={district}
          unit={role}
          status="CYAN"
          subtext={`As of: ${riskResponse?.as_of ? new Date(riskResponse.as_of).toLocaleTimeString() : 'Live'}`}
          icon={Info}
        />
      </div>

      {/* Drift Alert Warning Banner if active */}
      {resilience?.drift_alert && (
        <div className="medex-panel p-3.5 bg-medex-amber/15 border-medex-amber/40 text-xs text-medex-amber-light flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-medex-amber shrink-0" />
            <span>
              <strong>Resilience Drift Alert Active:</strong> District resilience score decreased by{' '}
              <strong className="underline">{resilience.delta} points</strong> week-over-week (Previous:{' '}
              {resilience.previous_week_score}).
            </span>
          </div>
          <span className="text-2xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-medex-amber/20 border border-medex-amber/40">
            DRIFT ALERT
          </span>
        </div>
      )}

      {/* Contract Filters */}
      <FilterBar
        title="Contract Filters (GET /risk)"
        onReset={() => {
          setStatusFilter('ALL');
          setDrugFilter('ALL');
          setLimitFilter('50');
        }}
      >
        <Select
          label="Risk Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'ALL', label: 'AMBER & RED (Default)' },
            { value: 'RED', label: 'RED Only' },
            { value: 'AMBER', label: 'AMBER Only' },
            { value: 'GREEN', label: 'GREEN Only' },
          ]}
        />
        <Select
          label="Drug Code"
          value={drugFilter}
          onChange={setDrugFilter}
          options={[
            { value: 'ALL', label: 'All Essential Drugs' },
            { value: 'ORS', label: 'ORS' },
            { value: 'PARA500', label: 'PARA500' },
            { value: 'AMOX500', label: 'AMOX500' },
          ]}
        />
        <Select
          label="Limit"
          value={limitFilter}
          onChange={setLimitFilter}
          options={[
            { value: '10', label: 'Top 10 Priority' },
            { value: '25', label: 'Top 25 Priority' },
            { value: '50', label: 'Top 50 Priority' },
            { value: '100', label: 'Top 100 Priority' },
          ]}
        />
      </FilterBar>

      {/* Risk Queue Operational Table */}
      <SectionCard
        title="Priority Risk Queue"
        subtitle="Backend Priority Score (0.0 - 1.0) dictates row order. Click Map button to highlight facility on geospatial engine."
        actionSlot={
          <span className="text-2xs font-mono text-medex-cyan font-semibold">
            {items.length} Items Loaded
          </span>
        }
      >
        <DataTable
          columns={columns}
          data={items}
          isLoading={isLoading}
          isError={isError}
          errorMessage={errorMessage}
          onRetry={loadRiskData}
          getRowId={(r) => `${r.facility_id}:${r.drug_code}`}
          onRowClick={(r) => navigate(`/map?facility_id=${r.facility_id}`)}
          emptyTitle="No Risk Items Found"
          emptyDescription="No facilities in the district match the selected risk status or drug filter."
        />
      </SectionCard>
    </div>
  );
};
