import React, { useEffect, useState, Suspense } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { KpiCard } from '../components/common/KpiCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { Skeleton } from '../components/common/Skeleton';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { Dialog } from '../components/common/Dialog';
import { useAuthRole } from '../context/AuthRoleContext';
import { FederationRound, FederationRoundList } from '../types/api';
import { listFederationRounds, runFederationRound } from '../services/federationService';
import { COPY } from '../constants/copy';
import {
  Share2,
  Play,
  Cpu,
  Sparkles,
  RefreshCw,
  X,
  Layers,
  Database,
} from 'lucide-react';

import { useToast } from '../context/ToastContext';
import { EarthPinGlobe3D } from '../components/3d/EarthPinGlobe3D';
import { motion } from 'framer-motion';

const FederationMapeChart = React.lazy(() => import('../components/charts/FederationMapeChart'));

export const FederationView: React.FC = () => {
  const { role, district, user, isMockMode } = useAuthRole();
  const toast = useToast();

  // API State
  const [federationData, setFederationData] = useState<FederationRoundList | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Version Drawer State
  const [isVersionDrawerOpen, setIsVersionDrawerOpen] = useState<boolean>(false);

  // Run Round Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [epochs, setEpochs] = useState<number>(3);
  const [dpNoise, setDpNoise] = useState<boolean>(false);
  const [selectedStates, setSelectedStates] = useState<string[]>(['TN', 'BR', 'MH']);
  const [isSubmittingRound, setIsSubmittingRound] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isAuditor = role === 'AUDITOR';

  const loadFederationData = async () => {
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
      const data = await listFederationRounds(headers);
      setFederationData(data);
    } catch (err: any) {
      setIsError(true);
      setErrorMessage(err.message || 'Failed to load federation rounds from GET /federation/rounds');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFederationData();
  }, [role, district, user, isMockMode]);

  // Handle POST /federation/round trigger
  const handleTriggerRound = async () => {
    if (isAuditor) return;

    setIsSubmittingRound(true);
    setSubmitError(null);

    const headers: Record<string, string> = {
      'X-Role': role,
      'X-District': district,
      'X-User': user,
    };
    if (isMockMode) {
      headers['X-Mock'] = 'true';
    }

    try {
      await runFederationRound(
        {
          state_codes: selectedStates,
          local_epochs: epochs,
          dp_noise: dpNoise,
        },
        headers
      );

      setIsModalOpen(false);
      toast.success('Federated training round completed successfully');
      await loadFederationData();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to trigger federated training round.');
      toast.error(err.message || 'Failed to run federated training round');
    } finally {
      setIsSubmittingRound(false);
    }
  };

  // Extract latest round for state comparison chart
  const latestRound: FederationRound | undefined = federationData?.rounds[0];
  const perStateResults = latestRound?.per_state || [];

  // Find data-sparse state node (e.g. Bihar BR)
  const sparseState = perStateResults.find((s) => s.is_data_sparse);

  // Grouped Bar Chart Dataset
  const chartData = perStateResults.map((s) => ({
    state: `${s.state_code}${s.is_data_sparse ? ' (Sparse Data)' : ''}`,
    state_code: s.state_code,
    local_only_mape: s.local_only_mape,
    federated_mape: s.federated_mape,
    n_samples: s.n_samples,
    is_data_sparse: s.is_data_sparse,
  }));

  const globalMape = latestRound?.global_mape ?? 14.9;
  const globalAccuracy = (100 - globalMape).toFixed(1);
  const sparseGain = sparseState
    ? (sparseState.local_only_mape - sparseState.federated_mape).toFixed(1)
    : '7.1';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} 
      className="space-y-6 font-sans"
    >
      <PageHeader
        title={COPY.headers.federationTitle}
        subtitle={COPY.headers.federationSubtitle}
        badge={<StatusBadge status="CYAN" label="GET /federation/rounds" />}
        breadcrumbs={[{ label: 'MEDEx' }, { label: 'Federated Learning' }]}
        actionSlot={
          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            disabled={isAuditor}
            title={isAuditor ? 'AUDITOR role is read-only (403 Forbidden)' : 'Run new federated training round'}
          >
            <Play className="w-4 h-4 mr-2" />
            <span>{COPY.actions.startRound}</span>
          </Button>
        }
      />

      {/* 3D Federated Neural Model Aggregation Deck */}
      <EarthPinGlobe3D
        height="380px"
        interactive={true}
        showHUD={true}
        activeNodeName={`FEDERATION ROUND #${latestRound?.round_number ?? 7}`}
      />

      {/* KPI Row - Max 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          title={COPY.metrics.modelAccuracy}
          value={globalAccuracy}
          unit="% accuracy"
          className="border-theme-healthy/40 border-2"
          status="GREEN"
          icon={Cpu}
          subtext={`Round #${latestRound?.round_number ?? 7}`}
        />

        <KpiCard
          title={COPY.metrics.participatingNodes}
          value={perStateResults.length || 3}
          unit="states"
          status="CYAN"
          icon={Share2}
        />

        <KpiCard
          title={COPY.metrics.sparseDataGain}
          value={`+${sparseGain}`}
          unit="% boost"
          status="GREEN"
          icon={Sparkles}
        />
      </div>

      {/* Sparse Data State Callout */}
      {sparseState && (
        <div className="p-4 rounded-xl bg-theme-primary-tint/30 border border-theme-primary/30 text-xs text-theme-text flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-theme-primary-tint text-theme-primary shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="font-semibold text-theme-text block font-mono text-xs">
                DATA-SPARSE NODE BOOST: {sparseState.state_code}
              </span>
              <p className="text-2xs text-theme-muted mt-0.5 max-w-2xl">
                Node <strong className="text-theme-text font-mono">{sparseState.state_code}</strong> ({sparseState.n_samples.toLocaleString()} samples) accuracy improved from{' '}
                <strong className="text-theme-warning font-mono">{(100 - sparseState.local_only_mape).toFixed(1)}%</strong> to{' '}
                <strong className="text-theme-healthy font-mono">{(100 - sparseState.federated_mape).toFixed(1)}%</strong> via federated aggregation.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={() => setIsVersionDrawerOpen(true)}
            aria-label="View versions registry"
          >
            <Layers className="w-4 h-4 mr-1.5" />
            <span>View versions ({federationData?.models.length || 0})</span>
          </Button>
        </div>
      )}

      {/* Main Visual: Local vs Federated MAPE Bar Chart */}
      <div className="bg-theme-surface border border-theme-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-theme-border pb-4">
          <div>
            <h2 className="text-base font-semibold text-theme-text">Model Accuracy Comparison</h2>
            <p className="text-xs text-theme-muted">Local-only MAPE error vs Global federated model MAPE error by state node</p>
          </div>
          <Button
            variant="secondary"
            onClick={() => setIsVersionDrawerOpen(true)}
          >
            <Layers className="w-4 h-4 mr-1.5" />
            <span>View versions</span>
          </Button>
        </div>

        {isLoading ? (
          <Skeleton className="h-[320px] w-full rounded-lg" />
        ) : isError ? (
          <ErrorState title="Federation Data Unavailable" message={errorMessage} onRetry={loadFederationData} />
        ) : chartData.length === 0 ? (
          <EmptyState title="No Federation Data" description="No training rounds recorded." />
        ) : (
          <Suspense fallback={<Skeleton className="h-[320px] w-full rounded-lg" />}>
            <FederationMapeChart data={chartData} />
          </Suspense>
        )}
      </div>

      {/* View Versions Slide-Over Drawer with Scrollable Table and Edge Fade */}
      {isVersionDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="version-drawer-title">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsVersionDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-lg bg-theme-surface border-l border-theme-border shadow-2xl p-6 flex flex-col justify-between">
              <div className="space-y-6 flex-1 overflow-y-auto pr-1">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-theme-border pb-4">
                  <div>
                    <h2 id="version-drawer-title" className="text-lg font-bold text-theme-text flex items-center gap-2">
                      <Database className="w-5 h-5 text-theme-primary" />
                      Model Version Registry
                    </h2>
                    <p className="text-xs text-theme-muted mt-0.5">Vertex AI model registry snapshots</p>
                  </div>
                  <button
                    onClick={() => setIsVersionDrawerOpen(false)}
                    className="p-1 rounded-md text-theme-muted hover:text-theme-text hover:bg-theme-bg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Table with Edge Fade Gradient */}
                <div className="relative">
                  {/* Left & Right Edge Fade Gradients */}
                  <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-theme-surface to-transparent z-10" />
                  <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-theme-surface to-transparent z-10" />

                  <div className="overflow-x-auto scrollbar-thin rounded-lg border border-theme-border">
                    <table className="w-full text-left border-collapse min-w-[420px]">
                      <thead>
                        <tr className="border-b border-theme-border bg-theme-bg text-theme-muted text-2xs font-mono uppercase">
                          <th className="py-2.5 px-3">Version</th>
                          <th className="py-2.5 px-3">Created</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                          <th className="py-2.5 px-3 text-right">Serving</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-theme-border text-xs">
                        {(federationData?.models || []).map((m) => (
                          <tr key={m.version} className="hover:bg-theme-bg/50 transition-colors">
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-theme-primary">{m.version}</span>
                                {m.active && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-theme-healthy-bg text-theme-healthy font-bold border border-theme-healthy/30">
                                    ACTIVE
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3 font-mono text-2xs text-theme-muted">{m.created_at}</td>
                            <td className="py-3 px-3 text-center">
                              <span className={`font-mono text-2xs font-semibold ${m.validated ? 'text-theme-healthy' : 'text-theme-muted'}`}>
                                {m.validated ? 'VALIDATED' : 'UNVALIDATED'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <StatusBadge status={m.active ? 'GREEN' : 'NEUTRAL'} label={m.active ? 'SERVING' : 'INACTIVE'} size="sm" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-theme-border mt-4">
                <Button variant="secondary" onClick={() => setIsVersionDrawerOpen(false)} className="w-full">
                  Close Registry
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Run Federation Round Modal Dialog (POST /federation/round) */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Run Federated Training Round"
        subtitle="POST /federation/round (Restricted to STATE role)"
      >
        <div className="space-y-4 font-sans text-xs">
          {submitError && (
            <div className="p-3 bg-theme-critical-bg border border-theme-critical/40 rounded-lg text-theme-critical-text font-mono">
              {submitError}
            </div>
          )}

          <div>
            <label className="text-2xs font-mono font-semibold uppercase tracking-wider text-theme-muted block mb-1">
              Participating State Codes
            </label>
            <div className="flex items-center gap-3">
              {['TN', 'BR', 'MH'].map((code) => (
                <label key={code} className="inline-flex items-center gap-1.5 text-xs text-theme-text font-mono cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStates.includes(code)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStates([...selectedStates, code]);
                      } else {
                        setSelectedStates(selectedStates.filter((s) => s !== code));
                      }
                    }}
                    className="rounded border-theme-border-control bg-theme-surface text-theme-primary focus:ring-0"
                  />
                  <span>{code}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-2xs font-mono font-semibold uppercase tracking-wider text-theme-muted block mb-1">
              Local Training Epochs (1 - 10)
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={epochs}
              onChange={(e) => setEpochs(parseInt(e.target.value, 10) || 3)}
              className="w-full bg-theme-surface border border-theme-border-control rounded-lg text-xs p-2 text-theme-text font-mono focus:outline-none focus:border-theme-primary"
            />
          </div>

          <div>
            <label className="inline-flex items-center gap-2 text-xs text-theme-text font-mono cursor-pointer">
              <input
                type="checkbox"
                checked={dpNoise}
                onChange={(e) => setDpNoise(e.target.checked)}
                className="rounded border-theme-border-control bg-theme-surface text-theme-primary focus:ring-0"
              />
              <span>Enable Differential Privacy (DP Noise) Clipping</span>
            </label>
          </div>

          <div className="p-3 bg-theme-bg rounded-lg border border-theme-border text-2xs text-theme-muted">
            Round runs data-weighted federated averaging. No raw patient or stock records leave state nodes.
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-theme-border">
            <Button
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleTriggerRound}
              disabled={isSubmittingRound || selectedStates.length === 0}
            >
              {isSubmittingRound ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-1.5" />
                  <span>{COPY.actions.startRound}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Dialog>
    </motion.div>
  );
};
