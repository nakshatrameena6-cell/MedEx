import React from 'react';
import { CaptureConfirmResponse } from '../../types/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
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
    <div className="p-6 bg-theme-healthy-bg/20 border border-theme-healthy/40 rounded-xl space-y-6 text-left font-sans">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-full bg-theme-healthy-bg text-theme-healthy border border-theme-healthy/40 shrink-0">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-base font-bold text-theme-text font-mono">
            Stock Snapshot Successfully Saved
          </h3>
          <p className="text-xs text-theme-muted font-mono mt-0.5">
            Snapshot ID: {confirmResponse.snapshot_id} | Facility: {confirmResponse.facility_id} | Saved {confirmResponse.rows_saved} row(s)
          </p>
          <span className="text-2xs text-theme-muted font-mono block mt-1">
            Recorded at: {new Date(confirmResponse.recorded_at).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Recomputed Status Cards */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-theme-text font-mono uppercase tracking-wider">
          Recomputed Operational Status (Command Map Updated)
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {confirmResponse.updated_status.map((item) => (
            <div
              key={item.drug_code}
              className="p-3 bg-theme-surface border border-theme-border rounded-lg flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-bold font-mono text-theme-text block">
                  {item.drug_code}
                </span>
                <span className="text-2xs font-mono text-theme-muted block mt-0.5">
                  {item.cover_days} days cover
                </span>
              </div>
              <StatusBadge status={item.status} label={item.status} />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation & Action Buttons */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-theme-border">
        <Button
          variant="secondary"
          onClick={onReset}
          className="w-full sm:w-auto min-h-[44px]"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          <span>Record Another Update</span>
        </Button>

        {onGoToMap && (
          <Button
            variant="primary"
            onClick={onGoToMap}
            className="w-full sm:w-auto min-h-[44px]"
          >
            <span>View Updated District Map</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};

