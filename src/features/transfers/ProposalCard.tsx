import React from 'react';
import { Transfer } from '../../types/api';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Clock, Truck, DollarSign, Calendar, Sparkles, AlertTriangle } from 'lucide-react';

interface ProposalCardProps {
  transfer: Transfer;
  isSelected: boolean;
  onSelect: (transfer: Transfer) => void;
}

export const ProposalCard: React.FC<ProposalCardProps> = ({
  transfer,
  isSelected,
  onSelect,
}) => {
  const getStatusBadge = (state: string) => {
    switch (state) {
      case 'OPEN':
        return <StatusBadge status="CYAN" label="OPEN" />;
      case 'APPROVED':
        return <StatusBadge status="GREEN" label="APPROVED" />;
      case 'REJECTED':
        return <StatusBadge status="RED" label="REJECTED" />;
      case 'ESCALATED':
        return <StatusBadge status="AMBER" label="ESCALATED" />;
      case 'CLOSED':
        return <StatusBadge status="GREEN" label="CLOSED" />;
      default:
        return <StatusBadge status="AMBER" label={state} />;
    }
  };

  return (
    <div
      onClick={() => onSelect(transfer)}
      className={`medex-panel p-4 rounded-xl border transition-all cursor-pointer text-left space-y-3 ${
        isSelected
          ? 'bg-medex-surface border-medex-cyan shadow-md shadow-medex-cyan/10'
          : 'bg-medex-surface/40 border-medex-border hover:border-medex-border-hover hover:bg-medex-surface/60'
      }`}
    >
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-medex-border/60">
        <div className="flex items-center gap-2">
          <PriorityBadge score={1 - (transfer.rank - 1) * 0.1} label={`Rank #${transfer.rank}`} />
          <span className="text-xs font-bold font-mono text-medex-primary">
            {transfer.transfer_id}
          </span>
          {getStatusBadge(transfer.state)}
          {transfer.cross_state && (
            <span className="px-2 py-0.5 rounded text-2xs font-mono font-bold bg-medex-amber/20 text-medex-amber border border-medex-amber/40">
              CROSS-STATE
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-2xs font-mono text-medex-secondary">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-medex-cyan" />
            {transfer.eta_hours}h ETA ({transfer.route.duration_min} min)
          </span>
          <span className="flex items-center gap-1">
            <Truck className="w-3 h-3 text-medex-cyan" />
            {transfer.distance_km} km
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-medex-green-light" />
            ₹{transfer.cost_inr}
          </span>
        </div>
      </div>

      {/* Drug & Movement Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-medex-primary">
            {transfer.drug_name}
          </span>
          <span className="text-2xs font-mono text-medex-muted block">
            {transfer.drug_code} · <strong className="text-medex-cyan">{transfer.qty} {transfer.unit}</strong>
          </span>
        </div>

        {transfer.batch_expiry_date && (
          <div className="text-right">
            <span className="text-2xs font-mono text-medex-muted block flex items-center gap-1 justify-end">
              <Calendar className="w-3 h-3" /> Expiry: {transfer.batch_expiry_date}
            </span>
            {!transfer.expiry_ok && (
              <span className="text-2xs font-mono font-bold text-medex-red-light flex items-center gap-1 justify-end">
                <AlertTriangle className="w-3 h-3" /> Expiry Risk Warning
              </span>
            )}
          </div>
        )}
      </div>

      {/* Donor & Recipient Cover Impact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Donor Impact */}
        <div className="p-2.5 rounded bg-medex-bg/60 border border-medex-border">
          <span className="text-2xs font-mono text-medex-muted uppercase block">
            DONOR FACILITY (FROM)
          </span>
          <span className="font-semibold text-medex-primary block mt-0.5 font-sans">
            {transfer.from.name}
          </span>
          <div className="text-2xs font-mono mt-1 flex items-center gap-1">
            <span className="text-medex-secondary">{transfer.from.cover_days_before}d cover</span>
            <span className="text-medex-muted">&rarr;</span>
            <span className="font-bold text-medex-cyan">{transfer.from.cover_days_after}d after move</span>
            {transfer.from.cover_days_after >= 14 ? (
              <span className="text-medex-green-light font-bold">(&ge;14d Floor OK)</span>
            ) : (
              <span className="text-medex-red-light font-bold">(&lt;14d Below Floor)</span>
            )}
          </div>
        </div>

        {/* Recipient Impact */}
        <div className="p-2.5 rounded bg-medex-bg/60 border border-medex-border">
          <span className="text-2xs font-mono text-medex-muted uppercase block">
            RECIPIENT FACILITY (TO)
          </span>
          <span className="font-semibold text-medex-primary block mt-0.5 font-sans">
            {transfer.to.name}
          </span>
          <div className="text-2xs font-mono mt-1 flex items-center gap-1">
            <span className="text-medex-red-light font-bold">{transfer.to.cover_days_before}d cover</span>
            <span className="text-medex-muted">&rarr;</span>
            <span className="font-bold text-medex-green-light">{transfer.to.cover_days_after}d after move</span>
          </div>
        </div>
      </div>

      {/* Gemini Reasoning */}
      {transfer.reason && (
        <div className="p-2.5 bg-medex-bg/80 rounded border border-medex-border text-2xs font-sans text-medex-secondary">
          <span className="font-semibold text-medex-cyan block font-mono mb-0.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-medex-cyan" />
            Why this transfer was recommended:
          </span>
          "{transfer.reason}"
        </div>
      )}
    </div>
  );
};
