import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';
import { SectionCard } from '../components/common/SectionCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { Select } from '../components/common/Select';
import { Tabs } from '../components/common/Tabs';
import { MetricCard } from '../components/common/MetricCard';
import { Skeleton } from '../components/common/Skeleton';
import { ErrorState } from '../components/common/ErrorState';
import { useAuthRole } from '../context/AuthRoleContext';
import { ForecastResponse } from '../types/api';
import { getForecast } from '../services/forecastService';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  Cpu,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Layers,
  Database,
} from 'lucide-react';

export const ForecastView: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { role, district, user, isMockMode } = useAuthRole();

  // Facility & Drug Selection
  const initialFacility = searchParams.get('facility_id') || 'TN-PHC-014';
  const initialDrug = searchParams.get('drug_code') || 'ORS';
  const initialHorizon = parseInt(searchParams.get('horizon_weeks') || '4', 10);

  const [facilityId, setFacilityId] = useState<string>(initialFacility);
  const [drugCode, setDrugCode] = useState<string>(initialDrug);
  const [horizonWeeks, setHorizonWeeks] = useState<number>(initialHorizon);

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
      setErrorMessage(err.message || 'Failed to fetch demand forecast from GET /forecast');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadForecast();
  }, [facilityId, drugCode, horizonWeeks, role, district, user, isMockMode]);

  // Update query params in URL
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

  // Format chart dataset: combines 28-day history actuals + P10/P50/P90 points
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

    // Connect the last historical point to the first forecast point for seamless line rendering
    if (historyItems.length > 0 && forecastItems.length > 0) {
      const lastHistory = historyItems[historyItems.length - 1];
      const firstForecast = forecastItems[0];
      (firstForecast as any).actual = lastHistory.actual;
    }

    return [...historyItems, ...forecastItems];
  }, [forecastData]);

  // Custom Chart Tooltip
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const isForecast = payload.some((p: any) => p.dataKey === 'p50' || p.dataKey === 'p10');
      return (
        <div className="medex-panel p-3 bg-medex-sidebar/95 border-medex-cyan/40 shadow-2xl text-2xs font-mono space-y-1.5 min-w-[180px]">
          <div className="flex items-center justify-between font-bold border-b border-medex-border pb-1">
            <span className="text-medex-cyan">{label}</span>
            <span className="text-medex-muted">{isForecast ? 'PROJECTION' : 'ACTUAL'}</span>
          </div>

          {payload.map((entry: any, index: number) => {
            if (entry.value === undefined || entry.value === null) return null;

            let color = entry.color;
            let name = entry.name;
            let val = entry.value;

            if (entry.dataKey === 'actual') {
              name = 'Actual Issue Qty';
              color = '#3B82F6';
            } else if (entry.dataKey === 'p50') {
              name = 'P50 (Median Forecast)';
              color = '#06B6D4';
            } else if (entry.dataKey === 'p90') {
              name = 'P90 (Upper Bound)';
              color = '#EF4444';
            } else if (entry.dataKey === 'p10') {
              name = 'P10 (Lower Bound)';
              color = '#10B981';
            } else if (entry.dataKey === 'band') {
              return null; // Don't show raw array in tooltip list
            }

            return (
              <div key={index} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5" style={{ color }}>
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                  {name}:
                </span>
                <span className="font-bold text-medex-primary">{val} {forecastData?.unit}</span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Demand Forecasting"
        subtitle="Daily medicine demand projections from the federated intelligence model with P10, P50, and P90 uncertainty bands."
        badge={<StatusBadge status="CYAN" label="GET /forecast" />}
        breadcrumbs={[{ label: 'MEDEx' }, { label: 'Forecast View' }]}
        actionSlot={
          <button
            type="button"
            onClick={loadForecast}
            className="px-3 py-1.5 rounded bg-medex-surface border border-medex-border text-xs font-semibold text-medex-secondary hover:text-medex-primary hover:border-medex-border-active transition-colors inline-flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        }
      />

      {/* Selector Controls Bar */}
      <div className="medex-panel p-4 bg-medex-surface/60 border-medex-border flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
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
        </div>

        {/* Horizon Control (2, 4, 6, 8 weeks - default 4) */}
        <div className="flex flex-col gap-1">
          <label className="text-2xs font-medium uppercase tracking-wider text-medex-muted">
            Forecast Horizon (Weeks)
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

      {/* Metadata KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Facility & Medicine"
          value={forecastData?.drug_code || drugCode}
          unit={forecastData?.unit || 'sachets'}
          status="CYAN"
          subtext={`Target: ${forecastData?.facility_id || facilityId}`}
          icon={Database}
        />
        <MetricCard
          title="Model Version"
          value={forecastData?.model_version || 'fed-v7'}
          status="GREEN"
          subtext="Validated in Vertex AI Registry"
          icon={Cpu}
        />
        <MetricCard
          title="Model Scope"
          value={forecastData?.model_scope || 'federated'}
          status="CYAN"
          subtext="Personalized per state node"
          icon={Layers}
        />
        <MetricCard
          title="Generated Timestamp"
          value={
            forecastData?.generated_at
              ? new Date(forecastData.generated_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '06:00 UTC'
          }
          status="NEUTRAL"
          subtext={`Horizon: ${horizonWeeks} weeks projection`}
          icon={Clock}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main P0 Forecast Chart */}
        <SectionCard
          title="Historical Issues vs Demand Forecast Projections"
          subtitle="Past 28 days actual issue quantity + P10, P50 (median), P90 forecast corridor"
          actionSlot={
            <div className="flex items-center gap-2 text-2xs font-mono">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-medex-secondary">Actuals</span>
              <span className="h-2 w-2 rounded-full bg-cyan-400 ml-2" />
              <span className="text-medex-secondary">P50 Median</span>
            </div>
          }
          className="lg:col-span-2 min-h-[420px]"
        >
          {isLoading ? (
            <div className="p-4 space-y-4">
              <Skeleton className="h-[320px] w-full" />
            </div>
          ) : isError ? (
            <ErrorState
              title="Forecast Load Error"
              message={errorMessage}
              onRetry={loadForecast}
            />
          ) : (
            <div className="w-full h-[340px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="date"
                    stroke="#64748B"
                    tick={{ fontSize: 10, fill: '#94A3B8' }}
                    tickFormatter={(val) => val.split('-').slice(1).join('/')}
                  />
                  <YAxis
                    stroke="#64748B"
                    tick={{ fontSize: 10, fill: '#94A3B8' }}
                    unit={` ${forecastData?.unit || ''}`}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '10px' }}
                  />

                  {/* P10-P90 Uncertainty Corridor Shaded Band */}
                  <Area
                    type="monotone"
                    dataKey="band"
                    name="P10-P90 Uncertainty Band"
                    stroke="none"
                    fill="rgba(6, 182, 212, 0.15)"
                    isAnimationActive={false}
                  />

                  {/* Historical Actuals Solid Blue Line */}
                  <Line
                    type="monotone"
                    dataKey="actual"
                    name="Historical Actuals (Past 28 Days)"
                    stroke="#3B82F6"
                    strokeWidth={2.5}
                    dot={{ r: 2, fill: '#3B82F6' }}
                    connectNulls
                  />

                  {/* P50 Median Forecast Line */}
                  <Line
                    type="monotone"
                    dataKey="p50"
                    name="P50 Forecast Projection"
                    stroke="#06B6D4"
                    strokeWidth={2.5}
                    strokeDasharray="4 4"
                    dot={{ r: 3, fill: '#06B6D4' }}
                    connectNulls
                  />

                  {/* P90 Upper Bound Line */}
                  <Line
                    type="monotone"
                    dataKey="p90"
                    name="P90 Upper Bound"
                    stroke="#EF4444"
                    strokeWidth={1.5}
                    strokeDasharray="2 2"
                    dot={false}
                    connectNulls
                  />

                  {/* P10 Lower Bound Line */}
                  <Line
                    type="monotone"
                    dataKey="p10"
                    name="P10 Lower Bound"
                    stroke="#10B981"
                    strokeWidth={1.5}
                    strokeDasharray="2 2"
                    dot={false}
                    connectNulls
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>

        {/* Forecast Drivers Breakdown */}
        <SectionCard
          title="Forecast Factor Drivers"
          subtitle="Backend driver feature contribution percentages"
          actionSlot={
            <span className="text-2xs font-mono text-medex-cyan font-semibold">
              drivers[]
            </span>
          }
        >
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : (
            <div className="space-y-3">
              {(forecastData?.drivers || []).map((driver, idx) => {
                const isUp = driver.direction === 'up';
                const Icon = isUp ? ArrowUpRight : ArrowDownRight;

                return (
                  <div
                    key={idx}
                    className="medex-panel p-3 bg-medex-surface/60 border-medex-border flex items-center justify-between gap-3 font-mono text-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1.5 rounded ${
                          isUp
                            ? 'bg-medex-cyan/15 text-medex-cyan'
                            : 'bg-medex-amber/15 text-medex-amber'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-semibold text-medex-primary block">
                          {driver.name}
                        </span>
                        <span className="text-medex-muted">Direction: {driver.direction}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-medex-cyan block">
                        +{driver.contribution_pct}%
                      </span>
                      <span className="text-medex-muted">Contribution</span>
                    </div>
                  </div>
                );
              })}

              <div className="p-3 bg-medex-elevated rounded border border-medex-border text-2xs text-medex-secondary leading-normal">
                <span className="font-semibold text-medex-cyan font-mono block mb-1">
                  MODEL INSIGHT:
                </span>
                Demand forecast considers rainfall 7-day totals, dengue signal vectors, and historical seasonality. Gemini explains supplied facts without inventing stock numbers.
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
};
