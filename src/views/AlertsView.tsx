import React from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { SectionCard } from '../components/common/SectionCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { Tabs } from '../components/common/Tabs';
import { Volume2, Globe } from 'lucide-react';

export const AlertsView: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Multilingual Alert Briefs & Voice Notes"
        subtitle="Translated early warning alerts with escalation tracking and Text-to-Speech audio briefs."
        badge={<StatusBadge status="CYAN" label="GET /alerts" />}
        breadcrumbs={[
          { label: 'MEDEx' },
          { label: 'Alert Briefings' },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-4 bg-medex-surface/60 p-3 rounded-md border border-medex-border">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-medex-cyan" />
          <span className="text-xs font-semibold text-medex-primary">
            Target Language:
          </span>
        </div>
        <Tabs
          tabs={[
            { id: 'en-IN', label: 'English (en-IN)' },
            { id: 'ta-IN', label: 'Tamil (ta-IN)' },
            { id: 'hi-IN', label: 'Hindi (hi-IN)' },
          ]}
          activeTab="en-IN"
          onChange={() => {}}
        />
      </div>

      {/* Alert Card Shell */}
      <SectionCard
        title="Active Operational Alert Briefs"
        subtitle="Escalation levels: PHC -> BLOCK -> DISTRICT -> STATE"
      >
        <div className="medex-panel p-4 border-medex-red/40 bg-medex-red/5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <StatusBadge status="RED" label="HIGH SEVERITY" />
              <span className="text-xs font-mono text-medex-muted">AL-000044</span>
              <span className="text-2xs font-mono font-semibold text-medex-amber border border-medex-amber/40 bg-medex-amber/10 px-1.5 py-0.2 rounded">
                ESCALATION: BLOCK
              </span>
            </div>
            <span className="text-2xs font-mono text-medex-muted">2026-09-29T06:31:00Z</span>
          </div>

          <h4 className="text-xs font-semibold text-medex-primary">
            ORS at PHC Sample-014 will run out in about 5 days. A transfer proposal is waiting for approval.
          </h4>

          <div className="flex items-center justify-between gap-4 pt-2 border-t border-medex-border-subtle">
            <div className="flex items-center gap-2 text-2xs font-mono text-medex-cyan">
              <Volume2 className="w-3.5 h-3.5" />
              <span>Voice Note Available (audio/mpeg)</span>
            </div>
            <button
              type="button"
              className="px-3 py-1 rounded bg-medex-cyan/15 border border-medex-cyan/40 text-medex-cyan font-mono text-2xs font-semibold opacity-70 cursor-not-allowed inline-flex items-center gap-1"
            >
              <Volume2 className="w-3 h-3" />
              <span>GET /alerts/AL-000044/audio</span>
            </button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
};
