import React from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { SectionCard } from '../components/common/SectionCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { Mic, Camera, ShieldAlert } from 'lucide-react';

export const CaptureView: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="PHC Stock Capture"
        subtitle="Capture medicine inventory via Tamil/Hindi/English voice recordings or stock register photos."
        badge={<StatusBadge status="CYAN" label="PHASE 1 SHELL" />}
        breadcrumbs={[
          { label: 'MEDEx' },
          { label: 'Capture Workflows' },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Voice Capture Shell Card */}
        <SectionCard
          title="Voice Stock Entry"
          subtitle="Speech-to-Text conversion & Gemini drug extraction"
          actionSlot={
            <span className="text-2xs font-mono text-medex-cyan font-semibold">
              POST /capture/voice
            </span>
          }
        >
          <div className="flex flex-col items-center justify-center p-8 border border-dashed border-medex-border rounded-lg bg-medex-surface/30 text-center">
            <div className="p-4 rounded-full bg-medex-cyan/15 text-medex-cyan mb-3 border border-medex-cyan/30">
              <Mic className="w-6 h-6 animate-pulse-subtle" />
            </div>
            <h4 className="text-sm font-semibold text-medex-primary">
              Voice Capture Interface Ready
            </h4>
            <p className="text-xs text-medex-secondary max-w-xs mt-1 mb-4">
              Upload WebM/WAV audio or record directly. Low-confidence rows (&lt;0.85) will require user confirmation.
            </p>
            <button
              type="button"
              className="px-4 py-2 rounded-md bg-medex-cyan text-medex-bg font-semibold text-xs opacity-60 cursor-not-allowed"
            >
              Start Recording (Feature Phase 2)
            </button>
          </div>
        </SectionCard>

        {/* Photo Capture Shell Card */}
        <SectionCard
          title="Photo Register Entry"
          subtitle="Multimodal Gemini OCR & stock sheet parsing"
          actionSlot={
            <span className="text-2xs font-mono text-medex-cyan font-semibold">
              POST /capture/photo
            </span>
          }
        >
          <div className="flex flex-col items-center justify-center p-8 border border-dashed border-medex-border rounded-lg bg-medex-surface/30 text-center">
            <div className="p-4 rounded-full bg-medex-cyan/15 text-medex-cyan mb-3 border border-medex-cyan/30">
              <Camera className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-medex-primary">
              Photo Capture Interface Ready
            </h4>
            <p className="text-xs text-medex-secondary max-w-xs mt-1 mb-4">
              Upload shelf or register image (JPEG/PNG, max 8MB). Automatically parses drug names and quantities.
            </p>
            <button
              type="button"
              className="px-4 py-2 rounded-md bg-medex-surface border border-medex-border text-medex-secondary font-semibold text-xs opacity-60 cursor-not-allowed"
            >
              Upload Photo (Feature Phase 2)
            </button>
          </div>
        </SectionCard>
      </div>

      {/* Confirmation Step Shell */}
      <SectionCard
        title="Stock Snapshot Confirmation Shell"
        subtitle="User review for low-confidence extracted rows before committing to BigQuery"
        actionSlot={
          <div className="flex items-center gap-2">
            <StatusBadge status="AMBER" label="Confirm Step Required" />
          </div>
        }
      >
        <div className="p-4 bg-medex-surface/40 border border-medex-border rounded-md text-xs text-medex-secondary flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-medex-amber shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-medex-primary block">
              Contract Lock Requirement:
            </span>
            `POST /capture/confirm` saves user-verified stock snapshot rows and returns `updated_status` so the District Map recomputed status updates without an extra poll.
          </div>
        </div>
      </SectionCard>
    </div>
  );
};
