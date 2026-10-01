import React, { useState } from 'react';
import { CaptureResponse, ConfirmedRow, CaptureConfirmResponse } from '../../types/api';
import { confirmCapture } from '../../services/captureService';
import { ShieldAlert, AlertTriangle, CheckCircle2, Loader2, Sparkles, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useToast } from '../../context/ToastContext';

export interface CaptureReviewProps {
  captureData: CaptureResponse;
  onConfirmSuccess?: (response: CaptureConfirmResponse) => void;
  headers?: Record<string, string>;
  disabled?: boolean;
}

const DRUG_MASTER_OPTIONS = [
  { code: 'ORS', name: 'ORS Packets', unit: 'sachets' },
  { code: 'AMOX', name: 'Amoxicillin 500mg', unit: 'capsules' },
  { code: 'PARA', name: 'Paracetamol 500mg', unit: 'tablets' },
  { code: 'ZINC', name: 'Zinc Tablets 20mg', unit: 'tablets' },
  { code: 'ALBEN', name: 'Albendazole 400mg', unit: 'tablets' },
  { code: 'IFA', name: 'Iron Folic Acid', unit: 'tablets' },
];

export const CaptureReview: React.FC<CaptureReviewProps> = ({
  captureData,
  onConfirmSuccess,
  headers,
  disabled = false,
}) => {
  const toast = useToast();
  const [transcript, setTranscript] = useState<string>(captureData.transcript || '');
  const [editableRows, setEditableRows] = useState<ConfirmedRow[]>(() =>
    captureData.rows.map((r) => ({
      drug_code: r.drug_code || '',
      qty: r.qty,
      unit: r.unit || 'tablets',
      batch_no: r.batch_no || '',
      expiry_date: r.expiry_date || '',
    }))
  );

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRowChange = (index: number, field: keyof ConfirmedRow, value: any) => {
    setEditableRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleDrugSelect = (index: number, selectedCode: string) => {
    const found = DRUG_MASTER_OPTIONS.find((d) => d.code === selectedCode);
    setEditableRows((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        drug_code: selectedCode,
        unit: found ? found.unit : next[index].unit,
      };
      return next;
    });
  };

  const handleAddRow = () => {
    setEditableRows((prev) => [
      ...prev,
      {
        drug_code: 'ORS',
        qty: 100,
        unit: 'sachets',
        batch_no: '',
        expiry_date: '',
      },
    ]);
  };

  const handleDeleteRow = (index: number) => {
    if (editableRows.length <= 1) {
      setErrorMsg('At least one stock row is required.');
      return;
    }
    setErrorMsg(null);
    setEditableRows((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleConfirm = async () => {
    setErrorMsg(null);

    for (let i = 0; i < editableRows.length; i++) {
      if (!editableRows[i].drug_code) {
        setErrorMsg(`Row ${i + 1} is missing a matched Drug Code. Please select a drug from the master list.`);
        return;
      }
      if (editableRows[i].qty < 0 || isNaN(editableRows[i].qty)) {
        setErrorMsg(`Row ${i + 1} has an invalid quantity.`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payloadRows: ConfirmedRow[] = editableRows.map((r) => ({
        drug_code: r.drug_code,
        qty: Number(r.qty),
        unit: r.unit,
        batch_no: r.batch_no ? r.batch_no : null,
        expiry_date: r.expiry_date ? r.expiry_date : null,
      }));

      const res = await confirmCapture(
        {
          capture_id: captureData.capture_id,
          facility_id: captureData.facility_id,
          rows: payloadRows,
        },
        headers
      );

      toast.success('Stock snapshot confirmed and saved');
      onConfirmSuccess?.(res);
    } catch (err: any) {
      console.error('Confirm capture error:', err);
      setErrorMsg(err.message || 'Failed to confirm stock snapshot.');
      toast.error(err.message || 'Failed to confirm stock snapshot');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-left font-sans">
      {/* Capture Header Summary */}
      <div className="p-4 bg-theme-surface border border-theme-border rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-2xs font-mono font-bold text-theme-primary uppercase">
              ID: {captureData.capture_id}
            </span>
            <StatusBadge status="CYAN" label={captureData.source.toUpperCase()} size="sm" />
            {captureData.language && (
              <span className="px-2 py-0.5 rounded text-2xs font-mono font-bold bg-theme-bg border border-theme-border text-theme-muted">
                {captureData.language}
              </span>
            )}
          </div>
          <p className="text-2xs text-theme-muted mt-1 font-mono">
            Facility: {captureData.facility_id} | Confidence Threshold:{' '}
            {(captureData.confidence_threshold * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Editable Transcript Evidence Section */}
      <div className="p-4 bg-theme-bg/80 border border-theme-border rounded-xl space-y-2">
        <label className="text-2xs font-mono font-bold text-theme-primary uppercase flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          STT Transcript / OCR Evidence (Editable)
        </label>
        <textarea
          rows={2}
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Speech transcript or OCR text..."
          className="w-full bg-theme-surface border border-theme-border-control rounded-lg p-2.5 text-xs text-theme-text font-mono min-h-[56px] focus:outline-none focus:border-theme-primary"
        />
      </div>

      {/* Backend Warnings Panel */}
      {captureData.warnings && captureData.warnings.length > 0 && (
        <div className="p-3 bg-theme-warning-bg border border-theme-warning/40 rounded-lg text-xs text-theme-warning-text space-y-1 font-mono">
          <span className="font-semibold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            Backend Parsing Warnings:
          </span>
          <ul className="list-disc list-inside text-2xs space-y-0.5 pl-1">
            {captureData.warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Extracted Stock Rows Table / Form */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-theme-text font-mono uppercase tracking-wider">
            Parsed Stock Rows ({editableRows.length})
          </h4>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAddRow}
            className="min-h-[44px]"
          >
            <Plus className="w-4 h-4 mr-1" />
            <span>Add Stock Row</span>
          </Button>
        </div>

        {editableRows.map((currentEdit, idx) => {
          const originalRow = captureData.rows[idx];
          const confidence = originalRow?.confidence ?? 1.0;
          const isLowConfidence =
            originalRow?.needs_confirm || confidence < captureData.confidence_threshold || !currentEdit.drug_code;

          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border transition-all ${
                isLowConfidence
                  ? 'bg-theme-warning-bg/30 border-theme-warning/50 border-l-[4px] border-l-theme-warning'
                  : 'bg-theme-surface border-theme-border'
              }`}
            >
              {/* Row Header Banner */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-theme-border">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono text-theme-text">
                    Row #{idx + 1}
                  </span>
                  {originalRow?.drug_heard && (
                    <span className="text-2xs font-mono text-theme-muted bg-theme-bg px-2 py-0.5 rounded border border-theme-border">
                      Heard: "{originalRow.drug_heard}"
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {originalRow && (
                    <span
                      className={`text-2xs font-mono font-bold px-2 py-0.5 rounded ${
                        confidence >= 0.85
                          ? 'bg-theme-healthy-bg text-theme-healthy border border-theme-healthy/30'
                          : 'bg-theme-warning-bg text-theme-warning-text border border-theme-warning/30'
                      }`}
                    >
                      Confidence: {(confidence * 100).toFixed(0)}%
                    </span>
                  )}

                  {isLowConfidence && (
                    <span className="text-2xs font-mono font-bold px-2 py-0.5 rounded bg-theme-warning-bg text-theme-warning-text flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" />
                      NEEDS CONFIRMATION
                    </span>
                  )}
                </div>
              </div>

              {/* Responsive Inputs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
                {/* Drug Master Select */}
                <div className="lg:col-span-2">
                  <label className="text-2xs font-mono text-theme-muted block mb-1">
                    Matched Medicine Code
                  </label>
                  <select
                    value={currentEdit.drug_code}
                    onChange={(e) => handleDrugSelect(idx, e.target.value)}
                    className="w-full bg-theme-surface border border-theme-border-control rounded-lg px-2.5 py-2 text-xs text-theme-text font-mono min-h-[44px] focus:outline-none focus:border-theme-primary"
                  >
                    <option value="">-- Select Drug Master --</option>
                    {DRUG_MASTER_OPTIONS.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.code} ({d.name})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity Input */}
                <div>
                  <label className="text-2xs font-mono text-theme-muted block mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={currentEdit.qty}
                    onChange={(e) => handleRowChange(idx, 'qty', parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-theme-surface border border-theme-border-control rounded-lg px-2.5 py-2 text-xs text-theme-text font-mono font-bold min-h-[44px] focus:outline-none focus:border-theme-primary"
                  />
                </div>

                {/* Unit Input */}
                <div>
                  <label className="text-2xs font-mono text-theme-muted block mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={currentEdit.unit}
                    onChange={(e) => handleRowChange(idx, 'unit', e.target.value)}
                    className="w-full bg-theme-surface border border-theme-border-control rounded-lg px-2.5 py-2 text-xs text-theme-text font-mono min-h-[44px] focus:outline-none focus:border-theme-primary"
                  />
                </div>

                {/* Batch No (Optional) */}
                <div>
                  <label className="text-2xs font-mono text-theme-muted block mb-1">
                    Batch No (Opt)
                  </label>
                  <input
                    type="text"
                    placeholder="B-1092"
                    value={currentEdit.batch_no || ''}
                    onChange={(e) => handleRowChange(idx, 'batch_no', e.target.value)}
                    className="w-full bg-theme-surface border border-theme-border-control rounded-lg px-2.5 py-2 text-xs text-theme-text font-mono min-h-[44px] focus:outline-none focus:border-theme-primary"
                  />
                </div>

                {/* Delete Row Button */}
                <div className="flex justify-end sm:justify-start">
                  <button
                    type="button"
                    onClick={() => handleDeleteRow(idx)}
                    className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-lg bg-theme-bg border border-theme-border text-theme-critical hover:bg-theme-critical-bg transition-colors flex items-center justify-center"
                    title="Delete Row"
                    aria-label={`Delete Row ${idx + 1}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {errorMsg && (
        <div className="p-3 bg-theme-critical-bg border border-theme-critical/40 rounded-lg text-xs text-theme-critical-text flex items-center gap-2 font-mono">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Confirmation Action Button */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-theme-border">
        <Button
          variant="secondary"
          onClick={handleAddRow}
          className="w-full sm:w-auto min-h-[44px]"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Add Row</span>
        </Button>

        <Button
          variant="primary"
          onClick={handleConfirm}
          disabled={isSubmitting || disabled}
          className="w-full sm:w-auto min-h-[44px] px-6"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              <span>Saving Snapshot...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              <span>Confirm & Submit</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

