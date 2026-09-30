import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthRole } from '../../context/AuthRoleContext';
import { ScenarioResponse } from '../../types/api';
import { runScenario } from '../../services/scenarioService';
import { PageHeader } from '../../components/common/PageHeader';
import { SectionCard } from '../../components/common/SectionCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { MetricCard } from '../../components/common/MetricCard';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Activity,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Loader2,
  TrendingDown,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export const ScenarioPage: React.FC = () => {
  const navigate = useNavigate();
  const { role, district, user, isMockMode } = useAuthRole();

  const [prompt, setPrompt] = useState<string>('Dengue surge in 3 blocks with 45% uplift');
  const [districtId, setDistrictId] = useState<string>(
    district !== 'ALL' ? district : 'TN-D01'
  );
  const [horizonWeeks, setHorizonWeeks] = useState<number>(4);

  const [scenarioResult, setScenarioResult] = useState<ScenarioResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isPermitted = role === 'DISTRICT' || role === 'STATE';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading || !isPermitted) return;

    setIsLoading(true);
    setErrorMessage(null);

    const headers: Record<string, string> = {
      'X-Role': role,
      'X-District': district,
      'X-User': user,
    };
    if (isMockMode) {
      headers['X-Mock'] = 'true';
    }

    try {
      const res = await runScenario(
        {
          prompt: prompt.trim(),
          district_id: districtId,
          horizon_weeks: horizonWeeks,
        },
        headers
      );
      setScenarioResult(res);
    } catch (err: any) {
      console.error('Scenario simulation error:', err);
      setErrorMessage(err.message || 'Failed to execute scenario simulation.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left font-sans">
      <PageHeader
        title="Emergency Surge Scenario Simulator"
        subtitle="Simulate disease outbreaks or seasonal surges to model inventory burn-down without mutating production data."
        badge={<StatusBadge status="CYAN" label="POST /scenario/run" />}
        breadcrumbs={[
          { label: 'MEDEx' },
          { label: 'Scenario Simulator' },
        ]}
      />

      {/* Simulation Safety Banner */}
      <div className="p-4 bg-medex-cyan/10 border border-medex-cyan/30 rounded-xl text-xs text-medex-cyan-light flex items-center gap-3">
        <Info className="w-5 h-5 shrink-0 text-medex-cyan" />
        <div>
          <span className="font-bold font-mono block">SIMULATION ONLY — DECISION SUPPORT</span>
          Running emergency surge simulations projects burn-down curves. No live facility inventory or transfer states are modified.
        </div>
      </div>

      {!isPermitted && (
        <div className="p-4 bg-medex-amber/15 border border-medex-amber/40 rounded-xl text-xs text-medex-amber-light flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <div>
            <span className="font-bold font-mono block">ROLE SCOPE RESTRICTION:</span>
            Scenario simulation execution (POST /scenario/run) is restricted to DISTRICT and STATE roles. Your current role ({role}) is read-only.
          </div>
        </div>
      )}

      {/* Simulation Input Form */}
      <SectionCard
        title="Scenario Simulation Parameters"
        subtitle="Gemini parses prompt into disease, affected blocks, and demand uplift percentage"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-6">
              <label className="text-2xs font-mono text-medex-muted block mb-1">
                Surge Scenario Prompt (Natural Language)
              </label>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={!isPermitted || isLoading}
                placeholder="e.g. Dengue surge in 3 blocks with 40% uplift..."
                className="w-full bg-medex-bg border border-medex-border rounded-lg px-3 py-2 text-xs text-medex-primary font-mono focus:outline-none focus:border-medex-cyan"
              />
            </div>

            <div className="md:col-span-3">
              <label className="text-2xs font-mono text-medex-muted block mb-1">
                District ID
              </label>
              <select
                value={districtId}
                onChange={(e) => setDistrictId(e.target.value)}
                disabled={!isPermitted || isLoading}
                className="w-full bg-medex-bg border border-medex-border rounded-lg px-3 py-2 text-xs text-medex-primary font-mono focus:outline-none focus:border-medex-cyan"
              >
                <option value="TN-D01">TN-D01 (Tamil Nadu D01)</option>
                <option value="BR-D02">BR-D02 (Bihar D02)</option>
                <option value="MH-D03">MH-D03 (Maharashtra D03)</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="text-2xs font-mono text-medex-muted block mb-1">
                Horizon: <strong className="text-medex-cyan">{horizonWeeks} weeks</strong>
              </label>
              <input
                type="range"
                min="2"
                max="8"
                value={horizonWeeks}
                onChange={(e) => setHorizonWeeks(parseInt(e.target.value) || 4)}
                disabled={!isPermitted || isLoading}
                className="w-full accent-medex-cyan bg-medex-bg h-1.5 rounded cursor-pointer"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={!isPermitted || isLoading || !prompt.trim()}
              className={`px-6 py-2.5 rounded-lg bg-medex-cyan text-medex-bg font-bold text-xs inline-flex items-center gap-2 shadow-md transition-all ${
                !isPermitted || isLoading || !prompt.trim()
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:brightness-110'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Running Scenario Simulation...</span>
                </>
              ) : (
                <>
                  <Flame className="w-4 h-4" />
                  <span>Run Scenario Simulation (POST /scenario/run)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </SectionCard>

      {errorMessage && (
        <div className="p-4 bg-medex-red/15 border border-medex-red/30 rounded-xl text-xs text-medex-red-light flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Results View */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="w-full h-24 rounded-xl" />
          <Skeleton className="w-full h-64 rounded-xl" />
        </div>
      ) : !scenarioResult ? (
        <EmptyState
          title="Configure Scenario to View Impact"
          description="Enter a disease surge prompt and execute the simulation to observe projected stock burn-down and affected facilities."
        />
      ) : (
        <div className="space-y-6">
          {/* Parsed & Impact Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Parsed Disease & Surge"
              value={scenarioResult.parsed.disease.toUpperCase()}
              unit={`+${scenarioResult.parsed.uplift_pct}%`}
              status="AMBER"
              subtext={`Blocks: ${scenarioResult.parsed.affected_blocks.join(', ')}`}
              icon={Sparkles}
            />

            <MetricCard
              title="Red Facilities Impact"
              value={scenarioResult.summary.facilities_red_after}
              unit={`from ${scenarioResult.summary.facilities_red_before}`}
              status="RED"
              delta={{
                value: scenarioResult.summary.facilities_red_after - scenarioResult.summary.facilities_red_before,
                label: 'new RED',
                isPositiveGood: false,
              }}
              subtext="Critical stockout risk surge"
              icon={AlertTriangle}
            />

            <MetricCard
              title="Simulated Duration"
              value={scenarioResult.parsed.duration_weeks}
              unit="weeks"
              status="CYAN"
              subtext={`Target District: ${districtId}`}
              icon={Activity}
            />

            <MetricCard
              title="At-Risk Facilities"
              value={scenarioResult.at_risk.length}
              unit="items"
              status="RED"
              subtext="Projected to breach safety buffer"
              icon={TrendingDown}
            />
          </div>

          {/* Burn-down Recharts Visualization */}
          {scenarioResult.burn_down && scenarioResult.burn_down.length > 0 && (
            <SectionCard
              title="Stock Burn-down Projection (Baseline vs Scenario)"
              subtitle="Comparison of expected stock depletion under baseline demand vs surge scenario"
            >
              <div className="h-[320px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={scenarioResult.burn_down[0].points}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" />
                    <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} fontFamily="monospace" />
                    <YAxis stroke="#94A3B8" fontSize={11} fontFamily="monospace" />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        borderColor: '#1F293D',
                        borderRadius: '0.5rem',
                        fontSize: '0.75rem',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '0.75rem', fontFamily: 'monospace' }} />

                    <Line
                      type="monotone"
                      dataKey="baseline_stock"
                      name="Baseline Stock"
                      stroke="#06B6D4"
                      strokeWidth={2}
                      dot={false}
                    />

                    <Line
                      type="monotone"
                      dataKey="scenario_stock"
                      name="Surge Scenario Stock"
                      stroke="#EF4444"
                      strokeWidth={2.5}
                      strokeDasharray="6 4"
                      dot={{ r: 4, fill: '#EF4444' }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
          )}

          {/* At Risk Facilities Table */}
          <SectionCard
            title="Facilities at Risk Under Scenario"
            subtitle="Cover days comparison before and after simulated surge"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-medex-primary">
                <thead>
                  <tr className="border-b border-medex-border text-medex-muted uppercase text-2xs">
                    <th className="p-3 text-left">Facility ID</th>
                    <th className="p-3 text-left">Drug Code</th>
                    <th className="p-3 text-center">Baseline Cover</th>
                    <th className="p-3 text-center">Scenario Cover</th>
                    <th className="p-3 text-center">Scenario Status</th>
                  </tr>
                </thead>
                <tbody>
                  {scenarioResult.at_risk.map((item, idx) => (
                    <tr key={idx} className="border-b border-medex-border/40 hover:bg-medex-surface/30">
                      <td className="p-3 font-bold text-medex-primary">{item.facility_id}</td>
                      <td className="p-3 text-medex-cyan font-bold">{item.drug_code}</td>
                      <td className="p-3 text-center text-medex-secondary">{item.cover_days_baseline} days</td>
                      <td className="p-3 text-center font-bold text-medex-red-light">
                        {item.cover_days_scenario} days
                      </td>
                      <td className="p-3 text-center">
                        <StatusBadge status={item.status_scenario} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Suggested Optimize Button */}
            {scenarioResult.suggested_optimize_request && (
              <div className="pt-4 flex justify-end border-t border-medex-border mt-4">
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/transfers?district_id=${scenarioResult.suggested_optimize_request.district_id}&drug_code=${scenarioResult.suggested_optimize_request.drug_code}`
                    )
                  }
                  className="px-5 py-2.5 rounded-lg bg-medex-cyan text-medex-bg font-bold text-xs inline-flex items-center gap-2 hover:brightness-110 shadow-md"
                >
                  <span>Optimize Scenario Redistribution in Transfer Review</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </SectionCard>
        </div>
      )}
    </div>
  );
};
