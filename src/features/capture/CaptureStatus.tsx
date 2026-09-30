import React from 'react';
import { CaptureConfirmResponse } from '../../types/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CheckCircle2, ArrowRight, RefreshCw } from 'lucide-react';

interface CaptureStatusProps {
  confirmResponse: CaptureConfirmResponse;
  onReset: () => void;
  onGoToMap?: () => void;
}

export const CaptureStatus: React.FC<CaptureStatusProps> = ({
  confirmResponse,
  onReset,
  onGoToMap,
}) => {
  return (
    <div className="p-6 bg-medex-surface/60 border border-medex-green/30 rounded-xl space-y-6 text-left">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-full bg-medex-green/20 text-medex-green-light border border-medex-green/40">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-base font-bold text-medex-primary font-mono">
            Stock Snapshot Successfully Saved
          </h3>
          <p className="text-xs text-medex-secondary font-mono mt-0.5">
            Snapshot ID: {confirmResponse.snapshot_id} | Facility: {confirmResponse.facility_id} | Saved {confirmResponse.rows_saved} row(s)
          </p>
          <span className="text-2xs text-medex-muted font-mono block mt-1">
            Recorded at: {new Date(confirmResponse.recorded_at).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Recomputed Status Cards */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-medex-primary font-mono uppercase tracking-wider">
          Recomputed Operational Status (Map Refreshed)
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {confirmResponse.updated_status.map((item) => (
            <div
              key={item.drug_code}
              className="p-3 bg-medex-bg border border-medex-border rounded-lg flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-bold font-mono text-medex-primary block">
                  {item.drug_code}
                </span>
                <span className="text-2xs font-mono text-medex-secondary block mt-0.5">
                  {item.cover_days} days of cover
                </span>
              </div>
              <StatusBadge status={item.status} label={item.status} />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation & Action Buttons */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-medex-border/60">
        <button
          type="button"
          onClick={onReset}
          className="px-4 py-2 rounded-lg bg-medex-surface border border-medex-border text-medex-secondary font-semibold text-xs inline-flex items-center gap-2 hover:text-medex-primary"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Record Another Stock Update</span>
        </button>

        {onGoToMap && (
          <button
            type="button"
            onClick={onGoToMap}
            className="px-5 py-2 rounded-lg bg-medex-cyan text-medex-bg font-bold text-xs inline-flex items-center gap-2 hover:brightness-110 shadow-md"
          >
            <span>View Updated District Map</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
