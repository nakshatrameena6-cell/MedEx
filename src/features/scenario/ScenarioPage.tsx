import React, { useState, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthRole } from '../../context/AuthRoleContext';
import { ScenarioResponse } from '../../types/api';
import { runScenario } from '../../services/scenarioService';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { Card3D } from '../../components/3d/Card3D';
import { Flame, ArrowRight, ShieldAlert, Building2, Sliders, Activity, Sparkles, Cpu } from 'lucide-react';
import { JellyRadio, ThoughtLine } from '../../components/reactbits';
import { COPY } from '../../constants/copy';

const ScenarioBurnDownChart = React.lazy(() => import('../../components/charts/ScenarioBurnDownChart'));

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
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 font-sans text-theme-text"
    >
      <PageHeader
        title={COPY.headers.scenarioTitle}
        subtitle="Simulate disease outbreaks or seasonal surges to model inventory burn-down without modifying live data"
      />

      {!isPermitted && (
        <div className="p-4 bg-theme-warning-bg/40 border border-theme-warning-text/40 rounded-xl text-[13px] text-theme-warning-text flex items-center gap-3 font-sans backdrop-blur-md">
          <ShieldAlert className="w-5 h-5 shrink-0" strokeWidth={1.8} />
          <div>
            <span className="font-semibold block">Role Restriction</span>
            Scenario simulation execution is restricted to DISTRICT and STATE roles. Your current role ({role}) is read-only.
          </div>
        </div>
      )}

      {/* Simulation Form Card with 3D Specular Sheen */}
      <Card3D 
        maxTilt={3} 
        specularColor="rgba(56, 189, 248, 0.12)"
        className="p-6 rounded-2xl border border-theme-border bg-theme-surface/85 backdrop-blur-xl shadow-2xl relative overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-theme-border pb-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-theme-primary/10 border border-theme-primary/30 flex items-center justify-center text-theme-primary">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[16px] font-semibold tracking-tight text-theme-text">
                Simulation Parameters
              </h2>
              <p className="text-[11px] text-theme-muted font-mono">
                TELEMETRY // NON-DESTRUCTIVE EPIDEMIOLOGY TWIN
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded bg-white/5 border border-theme-border text-theme-muted">
            SYS_ENV: READY
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
            <div className="md:col-span-6 space-y-1.5">
              <label className="text-[11px] font-semibold text-theme-muted uppercase tracking-[0.08em] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-theme-primary" />
                Surge Scenario Prompt
              </label>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={!isPermitted || isLoading}
                placeholder="e.g. Dengue surge in 3 blocks with 45% uplift..."
                className="w-full bg-theme-bg/80 border border-theme-border-control rounded-xl px-4 py-2.5 text-[14px] text-theme-text focus:outline-none focus:border-theme-primary focus:ring-1 focus:ring-theme-primary/30 transition-all font-mono"
              />
            </div>

            <div className="md:col-span-3 space-y-1.5">
              <label className="text-[11px] font-semibold text-theme-muted uppercase tracking-[0.08em] block">
                Target District
              </label>
              <select
                value={districtId}
                onChange={(e) => setDistrictId(e.target.value)}
                disabled={!isPermitted || isLoading}
                className="w-full bg-theme-bg/80 border border-theme-border-control rounded-xl px-3.5 py-2.5 text-[14px] text-theme-text focus:outline-none focus:border-theme-primary font-mono transition-all"
              >
                <option value="TN-D01" className="bg-theme-surface">TN-D01 (Tamil Nadu D01)</option>
                <option value="BR-D02" className="bg-theme-surface">BR-D02 (Bihar D02)</option>
                <option value="MH-D03" className="bg-theme-surface">MH-D03 (Maharashtra D03)</option>
              </select>
            </div>

            <div className="md:col-span-3 space-y-1.5">
              <label className="text-[11px] font-semibold text-theme-muted uppercase tracking-[0.08em] block">
                Simulation Horizon
              </label>
              <JellyRadio
                items={[
                  { value: '2', label: '2 Weeks' },
                  { value: '4', label: '4 Weeks' },
                  { value: '6', label: '6 Weeks' },
                  { value: '8', label: '8 Weeks' },
                ]}
                value={String(horizonWeeks)}
                onChange={(val: string) => setHorizonWeeks(parseInt(val, 10) || 4)}
                chipColor="var(--color-surface)"
                activeColor="var(--palette-lime)"
                textColor="var(--color-text)"
                activeTextColor="var(--palette-coffee)"
                size="sm"
                radius={12}
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <div className="text-[12px] text-theme-muted flex items-center gap-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Isolated sandbox execution
            </div>
            <Button
              type="submit"
              variant="primary"
              icon={Flame}
              isLoading={isLoading}
              disabled={!isPermitted || !prompt.trim()}
              className="px-6 py-2.5 shadow-lg shadow-theme-primary/20"
            >
              {COPY.actions.runPlanner}
            </Button>
          </div>
        </form>
      </Card3D>

      {errorMessage && (
        <ErrorState
          title="Simulation Error"
          message={errorMessage}
          onRetry={handleSubmit as any}
        />
      )}

      {/* Results View */}
      {isLoading ? (
        <div className="p-8 rounded-2xl border border-theme-border bg-theme-surface/70 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="flex items-center gap-3 border-b border-theme-border pb-4">
            <div className="p-2 rounded-lg bg-sky-500/10 text-theme-primary border border-sky-500/20">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-theme-text font-mono">
                SIMULATION IN PROGRESS
              </h3>
              <p className="text-[11px] text-theme-muted">
                Executing Monte Carlo resilience projection across regional node clusters
              </p>
            </div>
          </div>
          <ThoughtLine
            label="Analyzing scenario dynamics…"
            glyph="sparkle"
            collapsible={false}
            glyphColor="#8CBFFF"
            color="var(--color-text)"
            fontSize={15}
            steps={[
              { text: 'Ingesting federated consumption vectors and block parameters…', status: 'done' },
              { text: `Projecting ${horizonWeeks}-week depletion rates for ${districtId}…`, status: 'running' },
              { text: 'Evaluating buffer stock resilience & alternative dispatch routes…', status: 'pending' },
              { text: 'Compiling localized burn-down curves & vulnerability report…', status: 'pending' },
            ]}
          />
        </div>
      ) : !scenarioResult ? (
        <EmptyState
          title="Configure Scenario to View Impact"
          description="Enter a disease surge prompt and execute the simulation to observe projected stock burn-down."
        />
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          {/* Max 3 KPI Cards with 3D Tilt Physics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Red Facilities Impact (Hero Card) */}
            <Card3D 
              specularColor="rgba(239, 68, 68, 0.28)" 
              className="p-6 rounded-2xl border border-theme-critical/40 bg-theme-surface/90 backdrop-blur-xl relative overflow-hidden shadow-xl"
            >
              <div className="flex items-center justify-between text-[13px] text-theme-muted">
                <span className="font-mono text-[10px] tracking-wider text-theme-critical uppercase font-bold">[01] CRITICAL SHIFT</span>
                <StatusBadge status="RED" label="Critical Surge" size="sm" />
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-[42px] font-bold text-theme-critical leading-none tracking-tight font-mono">
                  {scenarioResult.summary.facilities_red_after}
                </span>
                <span className="text-[12px] text-theme-muted font-medium">
                  facilities (baseline: {scenarioResult.summary.facilities_red_before})
                </span>
              </div>
              <div className="mt-3 text-[11px] text-theme-muted font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-theme-critical animate-ping" />
                Projected stockouts within {scenarioResult.parsed.duration_weeks}w
              </div>
            </Card3D>

            {/* Card 2: Surge Uplift */}
            <Card3D 
              specularColor="rgba(16, 185, 129, 0.22)" 
              className="p-6 rounded-2xl border border-theme-border bg-theme-surface/90 backdrop-blur-xl relative overflow-hidden shadow-xl"
            >
              <div className="flex items-center justify-between text-[13px] text-theme-muted">
                <span className="font-mono text-[10px] tracking-wider text-theme-healthy-text uppercase font-bold">[02] DEMAND SPIKE</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-theme-healthy-text border border-emerald-500/20 font-semibold uppercase">
                  {scenarioResult.parsed.disease}
                </span>
              </div>
              <div className="mt-4">
                <span className="text-[42px] font-bold text-theme-text leading-none tracking-tight font-mono">
                  +{scenarioResult.parsed.uplift_pct}%
                </span>
              </div>
              <p className="mt-3 text-[11px] text-theme-muted font-mono">
                Consumption multiplier over historical baseline
              </p>
            </Card3D>

            {/* Card 3: Duration */}
            <Card3D 
              specularColor="rgba(56, 189, 248, 0.22)" 
              className="p-6 rounded-2xl border border-theme-border bg-theme-surface/90 backdrop-blur-xl relative overflow-hidden shadow-xl"
            >
              <div className="flex items-center justify-between text-[13px] text-theme-muted">
                <span className="font-mono text-[10px] tracking-wider text-theme-primary uppercase font-bold">[03] TEMPORAL HORIZON</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-theme-primary border border-sky-500/20 font-semibold">
                  ACTIVE
                </span>
              </div>
              <div className="mt-4">
                <span className="text-[42px] font-bold text-theme-text leading-none tracking-tight font-mono">
                  {scenarioResult.parsed.duration_weeks} <span className="text-[20px] font-normal text-theme-muted">weeks</span>
                </span>
              </div>
              <p className="mt-3 text-[11px] text-theme-muted font-mono">
                Monte Carlo propagation span
              </p>
            </Card3D>
          </div>

          {/* Burn-down Visualization with 3D Border Sheen */}
          {scenarioResult.burn_down && scenarioResult.burn_down.length > 0 && (
            <Card3D 
              maxTilt={2}
              specularColor="rgba(56, 189, 248, 0.12)"
              className="p-6 rounded-2xl border border-theme-border bg-theme-surface/85 backdrop-blur-xl shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-theme-border pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-theme-primary" />
                  <h3 className="text-[16px] font-semibold text-theme-text">
                    Stock Burn-down Projection (Baseline vs Surge Scenario)
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-theme-muted">
                  CONFIDENCE: 95% // MONTE CARLO
                </span>
              </div>
              <Suspense fallback={<Skeleton className="h-[320px] w-full rounded-xl" />}>
                <ScenarioBurnDownChart data={scenarioResult.burn_down[0].points} />
              </Suspense>
            </Card3D>
          )}

          {/* At-Risk Facilities Table with Framer Motion transitions */}
          <div className="rounded-2xl border border-theme-border bg-theme-surface/85 backdrop-blur-xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-theme-border flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-theme-primary" />
                <h3 className="text-[16px] font-semibold text-theme-text">
                  Facilities at Risk Under Scenario
                </h3>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-theme-primary/10 border border-theme-primary/20 text-theme-primary font-semibold">
                {scenarioResult.at_risk.length} IDENTIFIED
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans">
                <thead>
                  <tr className="bg-white/[0.03] border-b border-theme-border text-theme-muted text-[12px] font-semibold uppercase tracking-wider font-mono">
                    <th scope="col" className="px-6 py-3.5">Facility ID</th>
                    <th scope="col" className="px-6 py-3.5">Drug Code</th>
                    <th scope="col" className="px-6 py-3.5 text-center">Baseline Cover</th>
                    <th scope="col" className="px-6 py-3.5 text-center">Scenario Cover</th>
                    <th scope="col" className="px-6 py-3.5 text-center">Scenario Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AnimatePresence>
                    {scenarioResult.at_risk.map((item, idx) => (
                      <motion.tr 
                        key={idx} 
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03, duration: 0.2 }}
                        className="h-[64px] hover:bg-white/[0.04] transition-colors"
                      >
                        <td className="px-6 py-3.5 font-semibold text-theme-text font-mono text-[13px]">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-md bg-white/5 border border-theme-border flex items-center justify-center">
                              <Building2 className="w-3.5 h-3.5 text-theme-muted" strokeWidth={1.8} />
                            </div>
                            <span>{item.facility_id}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-theme-primary font-semibold font-mono text-[13px]">
                          {item.drug_code}
                        </td>
                        <td className="px-6 py-3.5 text-center text-theme-muted font-mono text-[13px]">
                          {item.cover_days_baseline}d
                        </td>
                        <td className="px-6 py-3.5 text-center font-bold text-theme-critical font-mono text-[13px]">
                          {item.cover_days_scenario}d
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <StatusBadge status={item.status_scenario} size="sm" />
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {scenarioResult.suggested_optimize_request && (
              <div className="p-4 border-t border-theme-border bg-white/[0.02] flex justify-end">
                <Button
                  variant="secondary"
                  icon={ArrowRight}
                  iconPosition="right"
                  onClick={() =>
                    navigate(
                      `/transfers?district_id=${scenarioResult.suggested_optimize_request.district_id}&drug_code=${scenarioResult.suggested_optimize_request.drug_code}`
                    )
                  }
                  className="shadow-md"
                >
                  Optimize Scenario Redistribution
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

