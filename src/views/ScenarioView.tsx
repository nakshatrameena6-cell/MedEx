import React from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { SectionCard } from '../components/common/SectionCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { Sliders, Sparkles, Send } from 'lucide-react';

export const ScenarioView: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Emergency Surge Scenario Simulator"
        subtitle="Simulate epidemic surges or disaster demand shocks to project facility stock burn-downs."
        badge={<StatusBadge status="CYAN" label="POST /scenario/run" />}
        breadcrumbs={[
          { label: 'MEDEx' },
          { label: 'Scenario Simulator' },
        ]}
      />

      <SectionCard
        title="Natural Language Scenario Prompt"
        subtitle="Gemini extracts disease, affected blocks, uplift percentage, and duration weeks"
      >
        <div className="space-y-4">
          <div className="relative flex items-center">
            <input
              type="text"
              readOnly
              value="Dengue surge in 3 blocks (Block-A, Block-B, Block-C) with 40% uplift over 4 weeks"
              className="w-full bg-medex-surface border border-medex-border text-medex-primary text-xs rounded-lg pl-3 pr-24 py-3 font-mono cursor-not-allowed"
            />
            <button
              type="button"
              className="absolute right-2 px-3 py-1.5 rounded-md bg-medex-cyan text-medex-bg font-semibold text-2xs opacity-60 cursor-not-allowed inline-flex items-center gap-1"
            >
              <Send className="w-3 h-3" />
              <span>Simulate</span>
            </button>
          </div>

          <div className="p-3 bg-medex-surface/40 rounded border border-medex-border text-2xs font-mono text-medex-secondary flex items-center justify-between">
            <span className="flex items-center gap-1 text-medex-cyan">
              <Sparkles className="w-3.5 h-3.5" />
              PARSED PARAMS:
            </span>
            <span>disease: dengue | uplift: 40% | duration: 4w | blocks: 3</span>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Stock Burn-Down Comparison Plot"
        subtitle="Baseline stock trajectory vs Scenario demand shock trajectory"
        className="min-h-[280px]"
      >
        <div className="h-56 bg-medex-surface/40 border border-medex-border rounded-md flex flex-col items-center justify-center p-6 text-center">
          <Sliders className="w-8 h-8 text-medex-cyan mb-2 animate-pulse-subtle" />
          <h4 className="text-sm font-semibold text-medex-primary">
            Dual-Line Burn-Down Chart Container Ready
          </h4>
          <p className="text-xs text-medex-secondary max-w-sm mt-1">
            Visualizes accelerated depletion rate of Paracetamol 500mg and ORS stock over simulation horizon.
          </p>
        </div>
      </SectionCard>
    </div>
  );
};
