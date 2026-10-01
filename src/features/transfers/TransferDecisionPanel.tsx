import React, { useState } from 'react';
import { Decision, Transfer } from '../../types/api';
import { decideTransfer } from '../../services/transferService';
import { Check, Edit2, X, ArrowUpRight, CheckCircle2, Loader2, AlertTriangle, MessageSquare } from 'lucide-react';

interface TransferDecisionPanelProps {
  transfer: Transfer;
  onDecisionSuccess: (updatedTransfer: Transfer) => void;
  userRole: string;
  headers: Record<string, string>;
}

export const TransferDecisionPanel: React.FC<TransferDecisionPanelProps> = ({
  transfer,
  onDecisionSuccess,
  userRole,
  headers,
}) => {
  const [activeAction, setActiveAction] = useState<Decision | null>(null);
  const [comment, setComment] = useState<string>('');
  const [modifiedQty, setModifiedQty] = useState<number>(transfer.qty);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isAuditor = userRole === 'AUDITOR';
  const isFacility = userRole === 'FACILITY';
  const isReadOnly = isAuditor || isFacility;

  const currentState = transfer.state;

  // Check valid actions based on OpenAPI state transition rules
  const canApprove = ['OPEN', 'UNDER_REVIEW', 'ESCALATED'].includes(currentState);
  const canModify = ['OPEN', 'UNDER_REVIEW'].includes(currentState);
  const canReject = ['OPEN', 'UNDER_REVIEW', 'ESCALATED'].includes(currentState);
  const canEscalate = ['OPEN', 'UNDER_REVIEW'].includes(currentState);
  const canMarkDone = ['APPROVED', 'IN_TRANSIT'].includes(currentState);

  const handleOpenAction = (action: Decision) => {
    setErrorMsg(null);
    setActiveAction(action);
    setComment('');
    setModifiedQty(transfer.qty);
  };

  const handleCancelAction = () => {
    setActiveAction(null);
    setErrorMsg(null);
  };

  const handleSubmitDecision = async () => {
    if (!activeAction) return;

    setErrorMsg(null);

    // Contract requirement: comment is required for REJECT
    if (activeAction === 'REJECT' && !comment.trim()) {
      setErrorMsg('Comment is required when rejecting a transfer proposal.');
      return;
    }

    if (activeAction === 'MODIFY' && (modifiedQty <= 0 || isNaN(modifiedQty))) {
      setErrorMsg('Please enter a valid modified quantity greater than 0.');
      return;
    }

    setIsSubmitting(true);

    try {
      const updated = await decideTransfer(
        transfer.transfer_id,
        {
          decision: activeAction,
          comment: comment.trim() ? comment.trim() : undefined,
          modified_qty: activeAction === 'MODIFY' ? modifiedQty : undefined,
        },
        headers
      );

      setActiveAction(null);
      onDecisionSuccess(updated);
    } catch (err: any) {
      console.error('Decision submission error:', err);
      if (err.status === 409) {
        setErrorMsg(`Invalid State Transition: ${err.message}. Refreshing transfer state.`);
      } else if (err.status === 422) {
        setErrorMsg(`Constraint Violation: ${err.message}`);
      } else {
        setErrorMsg(err.message || 'Failed to submit transfer decision.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="medex-panel p-4 bg-medex-surface/60 border border-medex-cyan/30 rounded-xl space-y-4 text-left">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-medex-border">
        <div>
          <h4 className="text-xs font-bold text-medex-primary font-mono uppercase tracking-wider">
            Review & Actions
          </h4>
          <span className="text-2xs font-mono text-medex-secondary">
            Transfer {transfer.transfer_id} · Status: <strong className="text-medex-cyan">{currentState}</strong>
          </span>
        </div>

        {isReadOnly && (
          <span className="text-2xs font-mono text-medex-amber bg-medex-amber/15 px-2 py-0.5 rounded border border-medex-amber/30">
            {isAuditor ? 'AUDITOR READ-ONLY' : 'VIEW ONLY'}
          </span>
        )}
      </div>

      {!isReadOnly && (
        <div className="flex flex-wrap items-center gap-2">
          {canApprove && (
            <button
              type="button"
              onClick={() => handleOpenAction('APPROVE')}
              className="px-3 py-1.5 rounded-lg bg-medex-green/15 border border-medex-green/40 text-medex-green-light font-bold text-xs inline-flex items-center gap-1.5 hover:bg-medex-green/25 transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Approve</span>
            </button>
          )}

          {canModify && (
            <button
              type="button"
              onClick={() => handleOpenAction('MODIFY')}
              className="px-3 py-1.5 rounded-lg bg-medex-amber/15 border border-medex-amber/40 text-medex-amber-light font-bold text-xs inline-flex items-center gap-1.5 hover:bg-medex-amber/25 transition-all"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Amount</span>
            </button>
          )}

          {canReject && (
            <button
              type="button"
              onClick={() => handleOpenAction('REJECT')}
              className="px-3 py-1.5 rounded-lg bg-medex-red/15 border border-medex-red/40 text-medex-red-light font-bold text-xs inline-flex items-center gap-1.5 hover:bg-medex-red/25 transition-all"
            >
              <X className="w-3.5 h-3.5" />
              <span>Decline</span>
            </button>
          )}

          {canEscalate && (
            <button
              type="button"
              onClick={() => handleOpenAction('ESCALATE')}
              className="px-3 py-1.5 rounded-lg bg-medex-surface border border-medex-border text-medex-secondary font-bold text-xs inline-flex items-center gap-1.5 hover:text-medex-primary transition-all"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Escalate to District</span>
            </button>
          )}

          {canMarkDone && (
            <button
              type="button"
              onClick={() => handleOpenAction('MARK_DONE')}
              className="px-3 py-1.5 rounded-lg bg-medex-cyan/15 border border-medex-cyan/40 text-medex-cyan font-bold text-xs inline-flex items-center gap-1.5 hover:bg-medex-cyan/25 transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Delivered</span>
            </button>
          )}
        </div>
      )}

      {/* Decision Action Modal / Dialog Form */}
      {activeAction && (
        <div className="p-4 bg-medex-bg border border-medex-border rounded-xl space-y-3 animate-fade-in">
          <h5 className="text-xs font-bold text-medex-primary font-mono flex items-center gap-1.5">
            Confirm Decision: <span className="text-medex-cyan">{activeAction}</span>
          </h5>

          {/* MODIFY Specific Inputs */}
          {activeAction === 'MODIFY' && (
            <div className="space-y-2">
              <label className="text-2xs font-mono text-medex-muted block">
                Modified Quantity (Base Unit)
              </label>
              <input
                type="number"
                min="1"
                value={modifiedQty}
                onChange={(e) => setModifiedQty(parseInt(e.target.value) || 1)}
                className="w-full bg-medex-surface border border-medex-border rounded px-3 py-1.5 text-xs text-medex-primary font-mono font-bold focus:outline-none focus:border-medex-cyan"
              />
            </div>
          )}

          {/* Comment Field */}
          <div className="space-y-1">
            <label className="text-2xs font-mono text-medex-muted block flex items-center justify-between">
              <span>Decision Comment / Governance Rationale</span>
              {activeAction === 'REJECT' && (
                <span className="text-medex-red-light font-bold">* REQUIRED FOR REJECT</span>
              )}
            </label>
            <textarea
              rows={2}
              placeholder={
                activeAction === 'REJECT'
                  ? 'Enter reason for rejection (required)...'
                  : 'Enter approval notes or dispatch instructions (optional)...'
              }
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-medex-surface border border-medex-border rounded p-2.5 text-xs text-medex-primary focus:outline-none focus:border-medex-cyan font-sans"
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-medex-red/15 border border-medex-red/30 rounded text-xs text-medex-red-light flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit & Cancel Buttons */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleCancelAction}
              disabled={isSubmitting}
              className="px-3 py-1.5 rounded bg-medex-surface border border-medex-border text-medex-secondary text-xs font-semibold hover:text-medex-primary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmitDecision}
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded bg-medex-cyan text-medex-bg font-bold text-xs inline-flex items-center gap-1.5 hover:brightness-110 shadow-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Submit Decision</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
