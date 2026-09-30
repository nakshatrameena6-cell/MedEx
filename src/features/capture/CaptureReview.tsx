import React, { useState } from 'react';
import { CaptureResponse, ConfirmedRow, CaptureConfirmResponse } from '../../types/api';
import { confirmCapture } from '../../services/captureService';
import { ShieldAlert, AlertTriangle, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

interface CaptureReviewProps {
  captureData: CaptureResponse;
  onConfirmSuccess: (res: CaptureConfirmResponse) => void;
  headers: Record<string, string>;
  disabled?: boolean;
}

const DRUG_MASTER_OPTIONS = [
  { code: 'ORS', name: 'Oral Rehydration Salts', unit: 'sachets' },
  { code: 'PARA500', name: 'Paracetamol 500 mg', unit: 'tablets' },
  { code: 'AMOX500', name: 'Amoxicillin 500mg', unit: 'capsules' },
  { code: 'AZITH250', name: 'Azithromycin 250mg', unit: 'tablets' },
  { code: 'ZINC20', name: 'Zinc Sulfate 20mg', unit: 'tablets' },
  { code: 'IVM12', name: 'Ivermectin 12mg', unit: 'tablets' },
  { code: 'ALB400', name: 'Albendazole 400mg', unit: 'tablets' },
  { code: 'CEF200', name: 'Cefixime 200mg', unit: 'tablets' },
];

export const CaptureReview: React.FC<CaptureReviewProps> = ({
  captureData,
  onConfirmSuccess,
  headers,
  disabled = false,
}) => {
  // Initialize editable rows state
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

  const handleConfirm = async () => {
    setErrorMsg(null);

    // Client-side validation: all rows must have non-empty drug_code and qty >= 0
    for (let i = 0; i < editableRows.length; i++) {
      if (!editableRows[i].drug_code) {
        setErrorMsg(`Row ${i + 1} is missing a matched Drug Code. Please select a valid drug from the list.`);
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

      onConfirmSuccess(res);
    } catch (err: any) {
      console.error('Confirm capture error:', err);
      setErrorMsg(err.message || 'Failed to confirm stock snapshot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Capture Header Summary */}
      <div className="p-4 bg-medex-surface/60 border border-medex-border rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xs font-mono font-bold text-medex-cyan uppercase">
              CAPTURE ID: {captureData.capture_id}
            </span>
            <span className="px-2 py-0.5 rounded text-2xs font-mono font-bold bg-medex-cyan/15 text-medex-cyan uppercase">
              {captureData.source}
            </span>
            {captureData.language && (
              <span className="px-2 py-0.5 rounded text-2xs font-mono font-bold bg-medex-surface border border-medex-border text-medex-secondary">
                {captureData.language}
              </span>
            )}
          </div>
          <p className="text-2xs text-medex-muted mt-1 font-mono">
            Facility: {captureData.facility_id} | Confidence Threshold:{' '}
            {(captureData.confidence_threshold * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Transcript Evidence Section */}
      {captureData.transcript && (
        <div className="p-4 bg-medex-sidebar border border-medex-border rounded-xl">
          <span className="text-2xs font-mono font-bold text-medex-cyan uppercase block mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            STT Transcript Evidence
          </span>
          <p className="text-xs text-medex-primary font-mono bg-medex-bg/60 p-2.5 rounded border border-medex-border">
            "{captureData.transcript}"
          </p>
        </div>
      )}

      {/* Backend Warnings Panel */}
      {captureData.warnings && captureData.warnings.length > 0 && (
        <div className="p-3 bg-medex-amber/15 border border-medex-amber/30 rounded-lg text-xs text-medex-amber-light space-y-1">
          <span className="font-semibold flex items-center gap-1.5 font-mono">
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
        <h4 className="text-xs font-bold text-medex-primary font-mono uppercase tracking-wider flex items-center gap-2">
          Structured Stock Rows ({captureData.rows.length})
        </h4>

        {captureData.rows.map((row, idx) => {
          const isLowConfidence = row.needs_confirm || row.confidence < captureData.confidence_threshold || !row.drug_code;
          const currentEdit = editableRows[idx];

          return (
            <div
              key={row.row_id || idx}
              className={`p-4 rounded-xl border transition-all ${
                isLowConfidence
                  ? 'bg-medex-amber/10 border-medex-amber/50 shadow-sm'
                  : 'bg-medex-surface/40 border-medex-border'
              }`}
            >
              {/* Row Banner */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-medex-border/60">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono text-medex-primary">
                    Row #{idx + 1}
                  </span>
                  <span className="text-2xs font-mono text-medex-secondary bg-medex-surface px-2 py-0.5 rounded border border-medex-border">
                    Heard: "{row.drug_heard}"
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-2xs font-mono font-bold px-2 py-0.5 rounded ${
                      row.confidence >= 0.85
                        ? 'bg-medex-green/15 text-medex-green-light border border-medex-green/30'
                        : 'bg-medex-amber/15 text-medex-amber-light border border-medex-amber/30'
                    }`}
                  >
                    Confidence: {(row.confidence * 100).toFixed(0)}%
                  </span>

                  {isLowConfidence && (
                    <span className="text-2xs font-mono font-bold px-2 py-0.5 rounded bg-medex-amber text-medex-bg flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" />
                      NEEDS CONFIRMATION
                    </span>
                  )}
                </div>
              </div>

              {/* Editable Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                {/* Drug Master Select */}
                <div className="md:col-span-2">
                  <label className="text-2xs font-mono text-medex-muted block mb-1">
                    Matched Drug Code
                  </label>
                  <select
                    value={currentEdit.drug_code}
                    onChange={(e) => handleDrugSelect(idx, e.target.value)}
                    className="w-full bg-medex-bg border border-medex-border rounded px-2.5 py-1.5 text-xs text-medex-primary focus:outline-none focus:border-medex-cyan font-mono"
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
                  <label className="text-2xs font-mono text-medex-muted block mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={currentEdit.qty}
                    onChange={(e) => handleRowChange(idx, 'qty', parseInt(e.target.value) || 0)}
                    className="w-full bg-medex-bg border border-medex-border rounded px-2.5 py-1.5 text-xs text-medex-primary focus:outline-none focus:border-medex-cyan font-mono font-bold"
                  />
                </div>

                {/* Unit Input */}
                <div>
                  <label className="text-2xs font-mono text-medex-muted block mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={currentEdit.unit}
                    onChange={(e) => handleRowChange(idx, 'unit', e.target.value)}
                    className="w-full bg-medex-bg border border-medex-border rounded px-2.5 py-1.5 text-xs text-medex-primary focus:outline-none focus:border-medex-cyan font-mono"
                  />
                </div>

                {/* Batch No (Optional) */}
                <div>
                  <label className="text-2xs font-mono text-medex-muted block mb-1">
                    Batch No (Opt)
                  </label>
                  <input
                    type="text"
                    placeholder="B-1092"
                    value={currentEdit.batch_no || ''}
                    onChange={(e) => handleRowChange(idx, 'batch_no', e.target.value)}
                    className="w-full bg-medex-bg border border-medex-border rounded px-2.5 py-1.5 text-xs text-medex-primary focus:outline-none focus:border-medex-cyan font-mono"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {errorMsg && (
        <div className="p-3 bg-medex-red/15 border border-medex-red/30 rounded-lg text-xs text-medex-red-light flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Confirmation Action Button */}
      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isSubmitting || disabled}
          className={`px-6 py-3 rounded-lg bg-medex-cyan text-medex-bg font-bold text-xs inline-flex items-center gap-2 shadow-lg transition-all ${
            disabled || isSubmitting
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:brightness-110'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Snapshot to Backend...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Stock Update (POST /capture/confirm)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
