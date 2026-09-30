import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { Select } from '../components/common/Select';
import { Tabs } from '../components/common/Tabs';
import { Button } from '../components/common/Button';
import { Skeleton } from '../components/common/Skeleton';
import { ErrorState } from '../components/common/ErrorState';
import { useAuthRole } from '../context/AuthRoleContext';
import { ForecastResponse } from '../types/api';
import { getForecast } from '../services/forecastService';
import { COPY } from '../constants/copy';
import {
  RefreshCw,
  Sliders,
  ArrowUpRight,
  ArrowDownRight,
  X,
  RotateCcw,
} from 'lucide-react';
import { Card3D } from '../components/3d/Card3D';

const ForecastChart = React.lazy(() => import('../components/charts/ForecastChart'));

export const ForecastView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { role, district, user, isMockMode } = useAuthRole();

  // Facility & Drug Selection
  const initialFacility = searchParams.get('facility_id') || 'TN-PHC-014';
  const initialDrug = searchParams.get('drug_code') || 'ORS';
  const initialHorizon = parseInt(searchParams.get('horizon_weeks') || '4', 10);

  const [facilityId, setFacilityId] = useState<string>(initialFacility);
  const [drugCode, setDrugCode] = useState<string>(initialDrug);
  const [horizonWeeks, setHorizonWeeks] = useState<number>(initialHorizon);
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // API State
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const loadForecast = async () => {
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
      const data = await getForecast(
        {
          facility_id: facilityId,
          drug_code: drugCode,
          horizon_weeks: horizonWeeks,
        },
        headers
      );
      setForecastData(data);
    } catch (err: any) {
      setIsError(true);
      setErrorMessage(err.message || 'Failed to fetch demand forecast.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadForecast();
  }, [facilityId, drugCode, horizonWeeks, role, district, user, isMockMode]);

  const updateSelection = (newFac: string, newDrug: string, newHorizon: number) => {
    setFacilityId(newFac);
    setDrugCode(newDrug);
    setHorizonWeeks(newHorizon);
    setSearchParams({
      facility_id: newFac,
      drug_code: newDrug,
      horizon_weeks: String(newHorizon),
    });
  };

  // Format chart dataset
  const chartData = React.useMemo(() => {
    if (!forecastData) return [];

    const historyItems = (forecastData.history || []).map((h) => ({
      date: h.date,
      type: 'Historical Actuals',
      actual: h.qty,
      p10: undefined,
      p50: undefined,
      p90: undefined,
      band: undefined,
    }));

    const forecastItems = (forecastData.points || []).map((p) => ({
      date: p.date,
      type: 'Model Projection',
      actual: undefined,
      p10: p.p10,
      p50: p.p50,
      p90: p.p90,
      band: [p.p10, p.p90],
    }));

    if (historyItems.length > 0 && forecastItems.length > 0) {
      const lastHistory = historyItems[historyItems.length - 1];
      const firstForecast = forecastItems[0];
      (firstForecast as any).actual = lastHistory.actual;
    }

    return [...historyItems, ...forecastItems];
  }, [forecastData]);

  const p50Latest = forecastData?.points && forecastData.points.length > 0
    ? forecastData.points[forecastData.points.length - 1].p50
    : 120;

  let activeFilterCount = 0;
  if (facilityId !== 'TN-PHC-014') activeFilterCount += 1;
  if (drugCode !== 'ORS') activeFilterCount += 1;
  if (horizonWeeks !== 4) activeFilterCount += 1;

  return (
    <div className="space-y-6 font-sans text-theme-text">
      {/* Page Header */}
      <div className="relative">
        <PageHeader
          title={COPY.headers.forecastTitle}
          subtitle={`Projected demand for ${drugCode} at ${facilityId} across ${horizonWeeks} weeks`}
          activeFilterCount={activeFilterCount}
          onToggleFilters={() => setIsFilterPopoverOpen(!isFilterPopoverOpen)}
          actionSlot={
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                icon={RefreshCw}
                onClick={loadForecast}
                isLoading={isLoading}
              >
                {COPY.actions.refresh}
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Sliders}
                onClick={() => navigate(`/scenario?district_id=${district}`)}
              >
                {COPY.nav.scenarioSimulator}
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
              <h3 className="text-[14px] font-semibold text-theme-text">Forecast Target & Horizon</h3>
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
                label="Target Facility"
                value={facilityId}
                onChange={(val) => updateSelection(val, drugCode, horizonWeeks)}
                options={[
                  { value: 'TN-PHC-014', label: 'PHC Sample-014 (Block-A)' },
                  { value: 'TN-PHC-021', label: 'PHC Sample-021 (Block-B)' },
                  { value: 'TN-CHC-003', label: 'CHC Sample-003 (Block-A)' },
                  { value: 'TN-PHC-042', label: 'PHC Sample-042 (Block-B)' },
                ]}
              />
              <Select
                label="Medicine Code"
                value={drugCode}
                onChange={(val) => updateSelection(facilityId, val, horizonWeeks)}
                options={[
                  { value: 'ORS', label: 'ORS (Oral Rehydration Salts)' },
                  { value: 'PARA500', label: 'PARA500 (Paracetamol 500mg)' },
                  { value: 'AMOX500', label: 'AMOX500 (Amoxicillin 500mg)' },
                ]}
              />

              <div className="space-y-1">
                <label className="text-[12px] font-semibold text-theme-muted uppercase tracking-[0.05em] block">
                  Forecast Horizon
                </label>
                <Tabs
                  tabs={[
                    { id: '2', label: '2 Weeks' },
                    { id: '4', label: '4 Weeks' },
                    { id: '6', label: '6 Weeks' },
                    { id: '8', label: '8 Weeks' },
                  ]}
                  activeTab={String(horizonWeeks)}
                  onChange={(val) => updateSelection(facilityId, drugCode, parseInt(val, 10))}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-theme-border flex items-center justify-between">
              <button
                type="button"
                onClick={() => updateSelection('TN-PHC-014', 'ORS', 4)}
                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-theme-muted hover:text-theme-primary transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              <Button variant="primary" size="sm" onClick={() => setIsFilterPopoverOpen(false)}>
                Apply
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Max 3 KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Hero P50 Projection */}
          <Card3D glowColor="rgba(45, 212, 191, 0.28)">
            <div className="p-5 font-sans flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-theme-primary font-bold tracking-wider">[01]</span>
                  <span className="text-[13px] font-medium text-theme-muted">P50 Median Projection</span>
                </div>
                <StatusBadge status="CYAN" label="Active" size="sm" />
              </div>
              <div className="flex items-baseline gap-2 pt-1">
                <span className="metric-value text-[40px] font-medium text-theme-primary leading-none tracking-tight font-mono">
                  {p50Latest}
                </span>
                <span className="text-[13px] font-mono text-theme-muted">
                  {forecastData?.unit || 'sachets'}
                </span>
              </div>
              <div className="pt-2 border-t border-theme-border flex items-center justify-between text-[11px] text-theme-muted">
                <span>Model median trajectory</span>
                <span className="font-mono text-[9px] text-theme-primary font-bold uppercase tracking-wider">
                  CONFIDENCE: 92%
                </span>
              </div>
            </div>
          </Card3D>

          {/* Card 2: Model Version */}
          <Card3D glowColor="rgba(16, 185, 129, 0.25)">
            <div className="p-5 font-sans flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-theme-healthy-text font-bold tracking-wider">[02]</span>
                  <span className="text-[13px] font-medium text-theme-muted">Active Model Version</span>
                </div>
                <StatusBadge status="GREEN" label="Validated" size="sm" />
              </div>
              <div className="pt-1">
                <span className="metric-value text-[40px] font-medium text-theme-text leading-none tracking-tight font-mono">
                  {forecastData?.model_version || 'fed-v7'}
                </span>
              </div>
              <div className="pt-2 border-t border-theme-border flex items-center justify-between text-[11px] text-theme-muted">
                <span>Scope: {forecastData?.model_scope || 'federated'}</span>
                <span className="font-mono text-[9px] text-theme-healthy-text font-bold uppercase tracking-wider">
                  VERIFIED
                </span>
              </div>
            </div>
          </Card3D>

          {/* Card 3: Horizon */}
          <Card3D glowColor="rgba(56, 189, 248, 0.25)">
            <div className="p-5 font-sans flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-theme-primary font-bold tracking-wider">[03]</span>
                  <span className="text-[13px] font-medium text-theme-muted">Forecast Horizon</span>
                </div>
                <span className="font-mono text-[10px] text-theme-muted bg-white/[0.05] px-2 py-0.5 rounded border border-theme-border">
                  LOOKAHEAD
                </span>
              </div>
              <div className="pt-1">
                <span className="metric-value text-[40px] font-medium text-theme-text leading-none tracking-tight font-mono">
                  {horizonWeeks} wks
                </span>
              </div>
              <div className="pt-2 border-t border-theme-border flex items-center justify-between text-[11px] text-theme-muted">
                <span>Multi-horizon uncertainty corridor</span>
                <span className="font-mono text-[9px] text-theme-primary font-bold uppercase tracking-wider">
                  P10-P90
                </span>
              </div>
            </div>
          </Card3D>
        </div>
      )}

      {/* Main Visual: P10/P50/P90 Composed Chart */}
      <div className="rounded-lg border border-theme-border bg-theme-surface p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-theme-border pb-3">
          <h2 className="text-[17px] font-semibold text-theme-text">
            Demand Forecast & Uncertainty Band
          </h2>
          <div className="flex items-center gap-4 text-[12px] font-mono">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              <span>Historical Actuals</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-theme-primary" />
              <span>P50 Projection</span>
            </span>
          </div>
        </div>

        {isLoading ? (
          <Skeleton className="h-[340px] w-full rounded-lg" />
        ) : isError ? (
          <ErrorState
            title="Couldn't load forecast data"
            message={errorMessage}
            onRetry={loadForecast}
          />
        ) : (
          <Suspense fallback={<Skeleton className="h-[340px] w-full rounded-lg" />}>
            <ForecastChart data={chartData} unit={forecastData?.unit || 'sachets'} />
          </Suspense>
        )}
      </div>

      {/* Factor Drivers Section */}
      {forecastData?.drivers && forecastData.drivers.length > 0 && (
        <div className="rounded-lg border border-theme-border bg-theme-surface p-5 space-y-3">
          <h3 className="text-[14px] font-semibold text-theme-text border-b border-theme-border pb-2">
            Forecast Feature Drivers
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-[13px]">
            {forecastData.drivers.map((driver, idx) => {
              const isUp = driver.direction === 'up';
              const Icon = isUp ? ArrowUpRight : ArrowDownRight;

              return (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-theme-border bg-theme-bg flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded bg-theme-primary-tint text-theme-primary">
                      <Icon className="w-4 h-4" strokeWidth={1.8} />
                    </div>
                    <div>
                      <span className="font-semibold text-theme-text block">{driver.name}</span>
                      <span className="text-[11px] text-theme-muted font-mono">{driver.direction}</span>
                    </div>
                  </div>
                  <span className="text-[14px] font-semibold text-theme-primary font-mono">
                    +{driver.contribution_pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
