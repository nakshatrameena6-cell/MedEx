import React from 'react';
import { Transfer } from '../../types/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ArrowRight, Clock3, Route, Sparkles, Truck } from 'lucide-react';

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
    <button
      type="button"
      onClick={() => onSelect(transfer)}
      aria-pressed={isSelected}
      className={`transfer-mission-card w-full text-left ${
        isSelected
          ? 'is-selected'
          : ''
      }`}
    >
      <div className="transfer-mission-rank">0{transfer.rank}</div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[9px] text-theme-muted">{transfer.transfer_id}</span>
          {getStatusBadge(transfer.state)}
          {transfer.cross_state && <span className="text-[9px] text-theme-warning-text">CROSS-STATE</span>}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="min-w-0"><span className="text-[9px] text-theme-muted block">ORIGIN</span><strong className="text-xs block truncate">{transfer.from.name}</strong></div>
          <div className="flex-1 flex items-center min-w-[50px]"><i className="h-px flex-1 bg-theme-border" /><ArrowRight size={14} className="text-theme-primary mx-2" /><i className="h-px flex-1 bg-theme-border" /></div>
          <div className="min-w-0 text-right"><span className="text-[9px] text-theme-muted block">DESTINATION</span><strong className="text-xs block truncate">{transfer.to.name}</strong></div>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-theme-muted">
          <span className="flex items-center gap-1.5"><Truck size={12} />{transfer.qty} {transfer.unit}</span>
          <span className="flex items-center gap-1.5"><Clock3 size={12} />{transfer.eta_hours} hr ETA</span>
          <span className="flex items-center gap-1.5"><Route size={12} />{transfer.distance_km} km</span>
          <span>₹{transfer.cost_inr.toLocaleString()}</span>
        </div>
      </div>
      <div className="transfer-mission-impact">
        <span className="eyebrow !text-[8px]">Impact</span>
        <strong>{transfer.drug_name}</strong>
        <div><span>{transfer.to.cover_days_before}d</span><ArrowRight size={13} /><span>{transfer.to.cover_days_after}d</span></div>
        <small>recipient cover</small>
      </div>
      {isSelected && <Sparkles size={14} className="absolute right-3 top-3 text-theme-primary" />}
    </button>
  );
};
