import React, { useEffect, useState } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { SectionCard } from '../components/common/SectionCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { MetricCard } from '../components/common/MetricCard';
import { DataTable, Column } from '../components/common/DataTable';
import { Skeleton } from '../components/common/Skeleton';
import { ErrorState } from '../components/common/ErrorState';
import { Dialog } from '../components/common/Dialog';
import { useAuthRole } from '../context/AuthRoleContext';
import { FederationRound, FederationRoundList } from '../types/api';
import { listFederationRounds, runFederationRound } from '../services/federationService';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  Share2,
  Play,
  Cpu,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export const FederationView: React.FC = () => {
  const { role, district, user, isMockMode } = useAuthRole();

  // API State
  const [federationData, setFederationData] = useState<FederationRoundList | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

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
      await loadFederationData();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to trigger federated training round.');
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

  // Model Registry Table Columns
  const modelColumns: Column<any>[] = [
    {
      key: 'version',
      header: 'Model Version',
      render: (m) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-medex-cyan">{m.version}</span>
          {m.active && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-medex-green/20 text-medex-green-light border border-medex-green/40 font-bold">
              ACTIVE
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Created Timestamp',
      render: (m) => <span className="font-mono text-2xs text-medex-secondary">{m.created_at}</span>,
    },
    {
      key: 'validated',
      header: 'Validated',
      render: (m) => (
        <span className={`font-mono text-2xs font-semibold ${m.validated ? 'text-medex-green' : 'text-medex-muted'}`}>
          {m.validated ? 'VALIDATED (PASS)' : 'UNVALIDATED'}
        </span>
      ),
      align: 'center',
    },
    {
      key: 'active',
      header: 'Serving State',
      render: (m) => (
        <StatusBadge status={m.active ? 'GREEN' : 'NEUTRAL'} label={m.active ? 'SERVING' : 'INACTIVE'} size="sm" />
      ),
      align: 'center',
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Federation Console"
        subtitle="Shared predictive modeling across state health nodes without pooling raw state datasets. Only weights leave a state."
        badge={<StatusBadge status="CYAN" label="GET /federation/rounds" />}
        breadcrumbs={[{ label: 'MEDEx' }, { label: 'Federated Learning' }]}
        actionSlot={
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            disabled={isAuditor}
            title={isAuditor ? 'AUDITOR role is read-only (403 Forbidden)' : 'Run new federated training round'}
            className={`px-3.5 py-1.5 rounded bg-medex-cyan text-medex-bg font-semibold text-xs inline-flex items-center gap-1.5 shadow-medex-glow-cyan transition-all ${
              isAuditor ? 'opacity-40 cursor-not-allowed' : 'hover:bg-medex-cyan-light'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Run Federation Round</span>
          </button>
        }
      />

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Global MAPE Accuracy"
          value={latestRound?.global_mape ?? 14.9}
          unit="%"
          status="GREEN"
          subtext={`Round #${latestRound?.round_number ?? 7} (${latestRound?.model_version ?? 'fed-v7'})`}
          icon={Cpu}
        />
        <MetricCard
          title="Participating State Nodes"
          value={perStateResults.length || 3}
          unit="states"
          status="CYAN"
          subtext="Tamil Nadu (TN), Bihar (BR), Maharashtra (MH)"
          icon={Share2}
        />
        <MetricCard
          title="Sparse Data State Gain"
          value={
            sparseState
              ? `-${(sparseState.local_only_mape - sparseState.federated_mape).toFixed(1)}%`
              : '-7.1%'
          }
          unit="MAPE drop"
          status="GREEN"
          subtext={`Bihar (BR) local: ${sparseState?.local_only_mape}% → fed: ${sparseState?.federated_mape}%`}
          icon={Sparkles}
        />
        <MetricCard
          title="Model Registry Status"
          value={federationData?.models.length || 2}
          unit="versions"
          status="NEUTRAL"
          subtext="Stored in Vertex AI Registry"
          icon={ShieldCheck}
        />
      </div>

      {/* Sparse Data State Highlight Callout */}
      {sparseState && (
        <div className="medex-panel p-4 bg-medex-cyan/10 border-medex-cyan/40 text-xs text-medex-cyan-light flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-medex-cyan/20 text-medex-cyan shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse-subtle" />
            </div>
            <div>
              <span className="font-semibold text-medex-primary block font-mono">
                DATA-SPARSE STATE DEMO HIGHLIGHT: {sparseState.state_code}
              </span>
              <p className="text-2xs text-medex-secondary mt-0.5 max-w-2xl">
                State node <strong className="text-medex-cyan font-mono">{sparseState.state_code}</strong> has sparse historical data ({sparseState.n_samples.toLocaleString()} samples). Federated aggregation reduces error from{' '}
                <strong className="text-medex-amber-light font-mono">{sparseState.local_only_mape}% MAPE</strong> to{' '}
                <strong className="text-medex-green-light font-mono">{sparseState.federated_mape}% MAPE</strong> without raw data sharing.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-medex-cyan/20 border border-medex-cyan/50 text-2xs font-mono font-bold uppercase shrink-0">
            SPARSE NODE HIGHLIGHT
          </span>
        </div>
      )}

      {/* Main MAPE Comparison Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SectionCard
          title="Local-Only MAPE vs Federated MAPE per State Node"
          subtitle="Comparing single-state local model accuracy against global federated model accuracy"
          className="lg:col-span-2 min-h-[380px]"
        >
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : isError ? (
            <ErrorState title="Federation Error" message={errorMessage} onRetry={loadFederationData} />
          ) : (
            <div className="w-full h-[300px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="state" stroke="#64748B" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <YAxis stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} unit="%" label={{ value: 'MAPE Error (%)', angle: -90, position: 'insideLeft', style: { fill: '#94A3B8', fontSize: 10 } }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#141E30', borderColor: 'rgba(6, 182, 212, 0.4)', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '10px' }} />
                  <Bar dataKey="local_only_mape" name="Local-Only Model MAPE (%)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="federated_mape" name="Federated Global Model MAPE (%)" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>

        {/* Model Registry Section */}
        <SectionCard title="Model Registry" subtitle="Vertex AI registered versions">
          <DataTable
            columns={modelColumns}
            data={federationData?.models || []}
            isLoading={isLoading}
            isError={isError}
            errorMessage={errorMessage}
            onRetry={loadFederationData}
            getRowId={(m) => m.version}
            emptyTitle="No models registered"
          />
        </SectionCard>
      </div>

      {/* Run Federation Round Modal Dialog (POST /federation/round) */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Run Federated Training Round"
        subtitle="POST /federation/round (Restricted to STATE role)"
      >
        <div className="space-y-4 font-sans text-xs">
          {submitError && (
            <div className="p-3 bg-medex-red/15 border border-medex-red/40 rounded text-medex-red-light font-mono">
              {submitError}
            </div>
          )}

          <div>
            <label className="text-2xs font-mono font-semibold uppercase tracking-wider text-medex-muted block mb-1">
              Participating State Codes
            </label>
            <div className="flex items-center gap-3">
              {['TN', 'BR', 'MH'].map((code) => (
                <label key={code} className="inline-flex items-center gap-1.5 text-xs text-medex-primary font-mono cursor-pointer">
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
                    className="rounded border-medex-border bg-medex-surface text-medex-cyan focus:ring-0"
                  />
                  <span>{code}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-2xs font-mono font-semibold uppercase tracking-wider text-medex-muted block mb-1">
              Local Training Epochs (1 - 10)
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={epochs}
              onChange={(e) => setEpochs(parseInt(e.target.value, 10) || 3)}
              className="w-full bg-medex-surface border border-medex-border rounded text-xs p-2 text-medex-primary font-mono"
            />
          </div>

          <div>
            <label className="inline-flex items-center gap-2 text-xs text-medex-primary font-mono cursor-pointer">
              <input
                type="checkbox"
                checked={dpNoise}
                onChange={(e) => setDpNoise(e.target.checked)}
                className="rounded border-medex-border bg-medex-surface text-medex-cyan focus:ring-0"
              />
              <span>Enable Differential Privacy (DP Noise) Clipping</span>
            </label>
          </div>

          <div className="p-3 bg-medex-elevated rounded border border-medex-border text-2xs text-medex-muted">
            Round runs data-weighted federated averaging. No raw patient or stock records leave state nodes.
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-medex-border">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-1.5 rounded bg-medex-surface border border-medex-border text-xs text-medex-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleTriggerRound}
              disabled={isSubmittingRound || selectedStates.length === 0}
              className="px-4 py-1.5 rounded bg-medex-cyan text-medex-bg font-semibold text-xs inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmittingRound ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Running federated round...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Start Round</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
