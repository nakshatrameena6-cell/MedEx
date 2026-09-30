import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Building2, MapPin, ArrowRightLeft, Sparkles, AlertTriangle } from 'lucide-react';
import { RiskItem } from '../../types/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { COPY } from '../../constants/copy';

export interface RiskDrawerProps {
  item: RiskItem | null;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement> | null;
}

export const RiskDrawer: React.FC<RiskDrawerProps> = ({ item, onClose, triggerRef }) => {
  const navigate = useNavigate();
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus management & Escape key listener
  useEffect(() => {
    if (!item) return;

    // Focus close button on open
    setTimeout(() => closeButtonRef.current?.focus(), 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // Return focus to triggering row on close
      triggerRef?.current?.focus();
    };
  }, [item]);

  const handleClose = () => {
    onClose();
    triggerRef?.current?.focus();
  };

  if (!item) return null;

  // Helper to humanize flag codes
  const humanizeFlagCode = (code: string): string => {
    switch (code.toUpperCase()) {
      case 'LOW_COVER':
        return 'Low Cover';
      case 'LEAD_TIME_BREACH':
        return 'Lead Time Breach';
      case 'P90_RISK':
        return 'P90 Risk';
      case 'VULNERABLE_POP':
        return 'Vulnerable Population';
      case 'SPARSE_DATA':
        return 'Sparse Data';
      default:
        return code.replace(/_/g, ' ');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-theme-text/40 backdrop-blur-xs font-sans"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="risk-drawer-title"
      id="risk-drawer-panel"
    >
      {/* Drawer Panel Container (Desktop right-slide / Mobile bottom-sheet) */}
      <div
        ref={drawerRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full md:w-[440px] max-w-full bg-theme-surface border-l border-theme-border shadow-2xl h-full flex flex-col justify-between overflow-hidden animate-slide-in-right"
      >
        {/* Header */}
        <div className="p-5 border-b border-theme-border flex items-start justify-between gap-4 bg-theme-surface">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-[0.05em] text-theme-muted">
                Why this is flagged
              </span>
              <StatusBadge status={item.status} size="sm" />
            </div>
            <h2 id="risk-drawer-title" className="text-[17px] font-semibold text-theme-text leading-tight">
              {item.drug_name}
            </h2>
            <div className="flex items-center gap-1.5 text-[14px] text-theme-muted mt-1">
              <Building2 className="w-4 h-4 shrink-0 text-theme-muted" strokeWidth={1.8} />
              <span>
                {item.facility_name} ({item.facility_id})
              </span>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={handleClose}
            aria-label="Close details panel"
            className="p-2 rounded-lg border border-theme-border-control text-theme-muted hover:text-theme-text hover:bg-theme-border/40 transition-colors focus-visible:outline-2 focus-visible:outline-theme-primary"
          >
            <X className="w-5 h-5" strokeWidth={1.8} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Stock Left Hero Box */}
          <div className="p-4 rounded-lg border border-theme-border bg-theme-bg flex items-center justify-between">
            <div>
              <span className="text-[12px] text-theme-muted font-normal block">Stock Left</span>
              <span className="text-[28px] font-semibold text-theme-text leading-none tracking-tight">
                {item.cover_days} days
              </span>
              <span className="text-[12px] text-theme-muted font-mono block mt-1">
                {item.stock_qty.toLocaleString()} {item.unit}
              </span>
            </div>
            <div className="text-right font-mono">
              <span className="text-[12px] text-theme-muted block">{COPY.metrics.chanceOfRunningOut}</span>
              <span className="text-[20px] font-semibold text-theme-critical">
                {Math.round(item.p_stockout * 100)}%
              </span>
            </div>
          </div>

          {/* Compact Metrics Grid (Mapped strictly from API fields, hiding undefined fields) */}
          <div className="space-y-2 border-t border-b border-theme-border py-4 text-[13px]">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.05em] text-theme-muted mb-2">
              Calculated Risk Factors
            </h3>

            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="p-2.5 rounded bg-theme-bg border border-theme-border">
                <span className="text-[11px] text-theme-muted block">Stock Cover P50</span>
                <span className="font-semibold text-theme-text">{item.cover_days} days</span>
              </div>

              {typeof item.cover_days_p90 === 'number' && (
                <div className="p-2.5 rounded bg-theme-bg border border-theme-border">
                  <span className="text-[11px] text-theme-muted block">P90 Cover</span>
                  <span className="font-semibold text-theme-text">{item.cover_days_p90} days</span>
                </div>
              )}

              <div className="p-2.5 rounded bg-theme-bg border border-theme-border">
                <span className="text-[11px] text-theme-muted block">Lead Time</span>
                <span className="font-semibold text-theme-text">{item.lead_time_days} days</span>
              </div>

              {typeof item.safety_buffer_days === 'number' && (
                <div className="p-2.5 rounded bg-theme-bg border border-theme-border">
                  <span className="text-[11px] text-theme-muted block">Safety Buffer</span>
                  <span className="font-semibold text-theme-text">{item.safety_buffer_days} days</span>
                </div>
              )}

              {typeof item.drug_criticality === 'number' && (
                <div className="p-2.5 rounded bg-theme-bg border border-theme-border">
                  <span className="text-[11px] text-theme-muted block">Criticality Score</span>
                  <span className="font-semibold text-theme-text">
                    {(item.drug_criticality * 100).toFixed(0)}%
                  </span>
                </div>
              )}

              {typeof item.vulnerability_weight === 'number' && (
                <div className="p-2.5 rounded bg-theme-bg border border-theme-border">
                  <span className="text-[11px] text-theme-muted block">Vulnerability Weight</span>
                  <span className="font-semibold text-theme-text">
                    {item.vulnerability_weight}x
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* AI Reason Text */}
          {item.reason && (
            <div className="p-4 rounded-lg bg-theme-primary-tint/15 border border-theme-primary-tint/40 text-[13px] text-theme-text space-y-1.5">
              <span className="font-semibold text-theme-primary flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 shrink-0" strokeWidth={1.8} />
                Risk Intelligence Explanation
              </span>
              <p className="leading-relaxed">{item.reason}</p>
            </div>
          )}

          {/* Flag Chips */}
          {item.flags && item.flags.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-theme-muted block">
                Triggered Risk Flags
              </span>
              <div className="flex flex-wrap gap-2">
                {item.flags.map((flag, idx) => (
                  <span
                    key={idx}
                    title={flag.reason}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-theme-critical-bg text-theme-critical-text text-[12px] font-mono font-semibold"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" strokeWidth={1.8} />
                    <span>{humanizeFlagCode(flag.code)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-theme-border bg-theme-surface flex items-center gap-3">
          <Button
            variant="secondary"
            icon={MapPin}
            onClick={() => {
              navigate(`/map?facility_id=${item.facility_id}`);
              handleClose();
            }}
            className="flex-1"
          >
            View Facility
          </Button>

          <Button
            variant="primary"
            icon={ArrowRightLeft}
            onClick={() => {
              navigate(`/transfers?district_id=${item.district_id}&drug_code=${item.drug_code}`);
              handleClose();
            }}
            className="flex-1"
          >
            {COPY.nav.transfers}
          </Button>
        </div>
      </div>
    </div>
  );
};
