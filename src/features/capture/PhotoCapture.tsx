import React, { useState } from 'react';
import { CaptureResponse } from '../../types/api';
import {
  RotateCcw,
  Crop,
  Sun,
  RefreshCw,
  FileText,
  CheckCircle2,
  ChevronRight,
  Download,
  Sparkles,
} from 'lucide-react';

interface PhotoCaptureProps {
  facilityId: string;
  onCaptureSuccess: (res: CaptureResponse) => void;
  headers: Record<string, string>;
  disabled?: boolean;
}

interface RegisterRow {
  sno: number;
  name: string;
  strength: string;
  form: string;
  batch: string;
  expiry: string;
  received: number;
  issued: number;
  balance: number;
  remarks: string;
  drugCode: string;
  isEntity?: 'drug' | 'batch' | null;
  tag?: string;
}

const SAMPLE_REGISTER_DATA: RegisterRow[] = [
  { sno: 1, name: 'Paracetamol', strength: '500 mg', form: 'Tablet', batch: 'B-1048', expiry: '11/2027', received: 200, issued: 50, balance: 150, remarks: '—', drugCode: 'PARA' },
  { sno: 2, name: 'ORS', strength: 'IP', form: 'Powder', batch: 'B-1092', expiry: '08/2027', received: 100, issued: 20, balance: 80, remarks: '—', drugCode: 'ORS', isEntity: 'drug', tag: 'ORS 50g' },
  { sno: 3, name: 'Amoxicillin', strength: '250 mg', form: 'Capsule', batch: 'A-2231', expiry: '03/2027', received: 150, issued: 30, balance: 120, remarks: '—', drugCode: 'AMOX' },
  { sno: 4, name: 'Metformin', strength: '500 mg', form: 'Tablet', batch: 'M-7789', expiry: '11/2026', received: 300, issued: 60, balance: 240, remarks: '—', drugCode: 'MET' },
  { sno: 5, name: 'Cetirizine', strength: '10 mg', form: 'Tablet', batch: 'C-5567', expiry: '06/2027', received: 200, issued: 40, balance: 160, remarks: '—', drugCode: 'CET' },
  { sno: 6, name: 'Azithromycin', strength: '500 mg', form: 'Tablet', batch: 'Z-9012', expiry: '09/2026', received: 100, issued: 25, balance: 75, remarks: '—', drugCode: 'AZI' },
  { sno: 7, name: 'Vitamin C', strength: '500 mg', form: 'Tablet', batch: 'V-3341', expiry: '02/2027', received: 250, issued: 50, balance: 200, remarks: '—', drugCode: 'VITC' },
  { sno: 8, name: 'Ibuprofen', strength: '400 mg', form: 'Tablet', batch: 'I-6678', expiry: '10/2026', received: 150, issued: 30, balance: 120, remarks: '—', drugCode: 'IBU' },
  { sno: 9, name: 'Dextrose 5%', strength: '100 ml', form: 'Injection', batch: 'D-1123', expiry: '04/2027', received: 50, issued: 10, balance: 40, remarks: '—', drugCode: 'DEX5' },
  { sno: 10, name: 'Cefixime', strength: '200 mg', form: 'Tablet', batch: 'C-8890', expiry: '01/2027', received: 120, issued: 25, balance: 100, remarks: '—', drugCode: 'CEF' },
];

export const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  facilityId,
  onCaptureSuccess,
  disabled = false,
}) => {
  const [selectedSample, setSelectedSample] = useState<number>(1);
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [isEnhanced, setIsEnhanced] = useState<boolean>(true);
  const [enhancementMode, setEnhancementMode] = useState<'Auto' | 'B&W' | 'Contrast' | 'Noise Reduction'>('Auto');
  const [rotation, setRotation] = useState<number>(0);
  const [cropActive, setCropActive] = useState<boolean>(false);

  // Trigger laser scan animation cycle
  const handleRescan = () => {
    setIsScanning(false);
    setTimeout(() => {
      setIsScanning(true);
    }, 100);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Convert extracted table rows to CaptureResponse format and transition to review
  const handleProceedToReview = () => {
    if (disabled) return;

    const response: CaptureResponse = {
      capture_id: `OCR-${Date.now().toString().slice(-6)}`,
      facility_id: facilityId,
      source: 'photo',
      language: 'en-IN',
      transcript: 'OCR extracted physical medicine stock register (10 items detected)',
      confidence_threshold: 0.85,
      rows: SAMPLE_REGISTER_DATA.map((row) => ({
        row_id: row.sno,
        drug_heard: `${row.name} ${row.strength}`,
        drug_code: row.drugCode,
        drug_name: `${row.name} ${row.strength}`,
        qty: row.balance,
        unit: row.form.toLowerCase() + 's',
        batch_no: row.batch,
        expiry_date: `20${row.expiry.split('/')[1]}-${row.expiry.split('/')[0]}-28`,
        confidence: row.isEntity ? 0.98 : 0.92,
        needs_confirm: false,
      })),
      warnings: [],
    };

    onCaptureSuccess(response);
  };

  return (
    <div className="space-y-4 text-left font-sans select-none">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* =========================================================================
            CENTER/LEFT: Document Viewfinder & Telemetry HUD (8 Cols)
            ========================================================================= */}
        <div className="xl:col-span-8 space-y-3.5">
          {/* Top Status Header Strip */}
          <div className="p-3 px-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            {/* Left: Radar Scanning Telemetry */}
            <div className="flex items-center gap-3">
              <div className="medscan-radar-reticle">
                <div className="medscan-radar-sweep" />
                <div className="w-2 h-2 rounded-full bg-teal-400 z-10 shadow-[0_0_8px_#2dd4bf]" />
              </div>
              <div>
                <div className="font-bold text-white tracking-wider flex items-center gap-1.5">
                  <span>{isScanning ? 'SCANNING...' : 'SCAN READY'}</span>
                </div>
                <div className="text-[10px] text-slate-400">Reading medicine register page...</div>
              </div>
            </div>

            {/* Middle: Confidence Meter */}
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 flex items-center justify-center">
                <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="3.5"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#2dd4bf"
                    strokeWidth="3.5"
                    strokeDasharray="92, 100"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-[9px] font-bold text-teal-400">92%</span>
              </div>
              <div>
                <div className="text-[9px] text-slate-400 uppercase tracking-wider">Scan Accuracy</div>
                <div className="font-bold text-slate-200">92% Match</div>
              </div>
            </div>

            {/* Pages & Status */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-slate-300">
                <FileText className="w-3.5 h-3.5 text-teal-400" />
                <span className="text-[11px] font-semibold">1 / 1</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isScanning ? 'bg-teal-400 animate-ping' : 'bg-emerald-400'}`} />
                <span className="text-[11px] text-teal-300 font-semibold">
                  {isScanning ? 'Scanning...' : 'Complete'}
                </span>
              </div>
            </div>
          </div>

          {/* Central Photorealistic Document Viewfinder */}
          <div className="medscan-scanner-frame relative border border-slate-800 p-4 sm:p-6 bg-slate-950 flex items-center justify-center min-h-[490px] overflow-hidden">
            {/* 4 Reticle Corner Brackets */}
            <div className="medscan-corner-bracket medscan-corner-tl" />
            <div className="medscan-corner-bracket medscan-corner-tr" />
            <div className="medscan-corner-bracket medscan-corner-bl" />
            <div className="medscan-corner-bracket medscan-corner-br" />

            {/* Glowing Sweeping Laser Line */}
            {isScanning && <div className="medscan-laser-beam" />}

            {/* Photorealistic Physical Paper Register Sheet */}
            <div
              style={{ transform: `rotate(${rotation}deg)` }}
              className={`medscan-paper-sheet w-full max-w-2xl rounded-sm p-4 sm:p-6 text-[10px] sm:text-[11px] transition-all duration-300 select-none shadow-2xl ${
                isEnhanced ? 'medscan-paper-enhanced' : ''
              } ${cropActive ? 'ring-2 ring-teal-400/80 ring-offset-4 ring-offset-slate-950' : ''}`}
            >
              {/* Document Header */}
              <div className="border-b-2 border-slate-700/80 pb-3 mb-3 flex items-baseline justify-between">
                <div>
                  <h3 className="font-bold text-[14px] sm:text-[16px] text-slate-900 tracking-wider underline underline-offset-4">
                    MEDICINE STOCK REGISTER
                  </h3>
                </div>
                <div className="font-mono text-slate-700 text-[10px] sm:text-xs">
                  Date: <span className="underline font-semibold">14/09/2026</span>
                </div>
              </div>

              {/* Table of Stock Items */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-700/70 text-[9.5px] sm:text-[10.5px]">
                  <thead>
                    <tr className="bg-slate-300/60 text-slate-800 font-bold border-b border-slate-700/70">
                      <th className="p-1 sm:p-1.5 border-r border-slate-700/60 w-7 text-center">S.No</th>
                      <th className="p-1 sm:p-1.5 border-r border-slate-700/60">Medicine Name</th>
                      <th className="p-1 sm:p-1.5 border-r border-slate-700/60">Strength</th>
                      <th className="p-1 sm:p-1.5 border-r border-slate-700/60">Form</th>
                      <th className="p-1 sm:p-1.5 border-r border-slate-700/60">Batch No.</th>
                      <th className="p-1 sm:p-1.5 border-r border-slate-700/60">Expiry Date</th>
                      <th className="p-1 sm:p-1.5 border-r border-slate-700/60 text-right">Qty Recd</th>
                      <th className="p-1 sm:p-1.5 border-r border-slate-700/60 text-right">Qty Iss</th>
                      <th className="p-1 sm:p-1.5 border-r border-slate-700/60 text-right font-bold">Balance</th>
                      <th className="p-1 sm:p-1.5 text-center">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-600/50 font-mono text-slate-800">
                    {SAMPLE_REGISTER_DATA.map((row) => (
                      <tr key={row.sno} className="hover:bg-slate-200/40">
                        <td className="p-1 border-r border-slate-700/60 text-center">{row.sno}</td>
                        <td className="p-1 border-r border-slate-700/60 font-sans font-medium text-slate-900 relative">
                          {row.name === 'ORS' ? (
                            <span className="relative inline-block px-1 rounded border-2 border-teal-500 bg-teal-500/15 font-bold text-slate-950">
                              ORS
                              {/* Glowing Detected Entity Tag */}
                              <span className="absolute -top-3.5 -right-9 px-1 py-0.2 rounded bg-teal-600 text-white font-mono text-[8px] font-bold shadow-md uppercase tracking-wider z-20 whitespace-nowrap">
                                ORS 50g
                              </span>
                            </span>
                          ) : (
                            row.name
                          )}
                        </td>
                        <td className="p-1 border-r border-slate-700/60">{row.strength}</td>
                        <td className="p-1 border-r border-slate-700/60">{row.form}</td>
                        <td className="p-1 border-r border-slate-700/60 relative">
                          {row.batch === 'B-1092' ? (
                            <span className="relative inline-block px-1 rounded border-2 border-amber-500 bg-amber-400/20 font-bold text-slate-950">
                              B-1092
                              {/* Glowing Detected Batch Tag */}
                              <span className="absolute -top-3.5 -right-12 px-1 py-0.2 rounded bg-amber-600 text-white font-mono text-[8px] font-bold shadow-md uppercase tracking-wider z-20 whitespace-nowrap">
                                Batch B-1092
                              </span>
                            </span>
                          ) : (
                            row.batch
                          )}
                        </td>
                        <td className="p-1 border-r border-slate-700/60">{row.expiry}</td>
                        <td className="p-1 border-r border-slate-700/60 text-right">{row.received}</td>
                        <td className="p-1 border-r border-slate-700/60 text-right">{row.issued}</td>
                        <td className="p-1 border-r border-slate-700/60 text-right font-bold text-slate-950">{row.balance}</td>
                        <td className="p-1 text-center">{row.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Document Signatures Footer */}
              <div className="mt-4 pt-3 flex items-center justify-between text-slate-700 text-[10px] font-mono">
                <div>Prepared By: ___________________</div>
                <div>Checked By: ___________________</div>
              </div>
            </div>
          </div>

          {/* Document Tool Bar (Below Viewfinder) */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 px-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCropActive(!cropActive)}
                className={`px-3 py-1.5 rounded-lg border font-mono flex items-center gap-1.5 transition-colors ${
                  cropActive
                    ? 'bg-teal-500/20 border-teal-500/50 text-teal-300'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <Crop className="w-3.5 h-3.5" />
                <span>Auto Detect</span>
              </button>

              <button
                type="button"
                onClick={handleRotate}
                title="Rotate 90 degrees"
                className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Rotate</span>
              </button>

              <button
                type="button"
                onClick={() => setCropActive(!cropActive)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
              >
                <Crop className="w-3.5 h-3.5" />
                <span>Crop</span>
              </button>

              <button
                type="button"
                onClick={() => setIsEnhanced(!isEnhanced)}
                className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1 transition-colors ${
                  isEnhanced
                    ? 'bg-teal-500/20 border-teal-500/50 text-teal-300'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Enhance</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleRescan}
              title="Rescan document"
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-teal-300 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Re-scan</span>
            </button>
          </div>

          {/* Bottom Action / Status Bar */}
          <div className="p-3.5 px-4 rounded-xl bg-slate-900 border border-teal-500/30 shadow-lg flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white">Scan Complete</span>
                <span className="text-slate-400 ml-2 text-[11px] hidden sm:inline">
                  Detected 2 key highlighted entities (e.g.{' '}
                  <span className="text-teal-400 font-mono">ORS 50g</span>,{' '}
                  <span className="text-amber-400 font-mono">Batch B-1092</span>)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-slate-400 text-[11px] font-mono hidden md:flex items-center gap-1.5">
                <span>1 page processed</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>

              <button
                type="button"
                onClick={handleProceedToReview}
                disabled={disabled}
                className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-teal-500/25 cursor-pointer active:scale-95"
              >
                <span>Review & Confirm (10 Medicines)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: 1-Click Presets & Document Enhancement (4 Cols)
            ========================================================================= */}
        <div className="xl:col-span-4 space-y-4">
          {/* Card 1: Sample Register Presets */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 text-base">⚡</span>
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Sample Register Pages
              </h4>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Choose an example register page to test instant scanning:
            </p>

            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { id: 1, name: 'Sample 1', desc: 'Handwritten Register', isLoaded: selectedSample === 1 },
                { id: 2, name: 'Sample 2', desc: 'Printed Register', isLoaded: selectedSample === 2 },
                { id: 3, name: 'Sample 3', desc: 'Mixed Format', isLoaded: selectedSample === 3 },
              ].map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => {
                    setSelectedSample(sample.id);
                    handleRescan();
                  }}
                  className={`p-2 rounded-xl border cursor-pointer transition-all flex flex-col justify-between text-left group ${
                    sample.isLoaded
                      ? 'bg-teal-950/40 border-teal-500 shadow-[0_0_12px_rgba(45,212,191,0.2)]'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="relative w-full h-16 rounded bg-slate-800 overflow-hidden mb-2 border border-slate-700/60 flex items-center justify-center">
                    {/* Simulated miniature register thumbnail */}
                    <div className="w-full h-full bg-[#e6dfd1] p-1 opacity-70 flex flex-col gap-0.5">
                      <div className="h-1 bg-slate-600 rounded-sm w-3/4 mb-0.5" />
                      <div className="h-0.5 bg-slate-400 rounded-sm w-full" />
                      <div className="h-0.5 bg-slate-400 rounded-sm w-full" />
                      <div className="h-0.5 bg-slate-400 rounded-sm w-full" />
                      <div className="h-0.5 bg-slate-400 rounded-sm w-full" />
                    </div>

                    {sample.isLoaded ? (
                      <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-teal-500 text-slate-950 flex items-center justify-center text-[10px] font-bold shadow">
                        ✓
                      </span>
                    ) : (
                      <Download className="absolute bottom-1 right-1 w-3 h-3 text-slate-400 group-hover:text-white" />
                    )}
                  </div>

                  <div className="text-[11px] font-semibold text-white leading-tight">
                    {sample.name}
                  </div>
                  <div className="text-[9px] text-slate-400 truncate mt-0.5">
                    {sample.desc}
                  </div>

                  {sample.isLoaded && (
                    <span className="mt-2 text-[9px] font-mono font-bold text-center px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/40">
                      Loaded
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Document Contrast & Clarity */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-400" />
                <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Image Cleanup & Clarity
                </h4>
              </div>
              {/* Interactive Toggle Switch */}
              <button
                type="button"
                onClick={() => setIsEnhanced(!isEnhanced)}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                  isEnhanced ? 'bg-teal-500 justify-end' : 'bg-slate-700 justify-start'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-snug">
              Removes camera shadows and sharpens faint handwriting automatically.
            </p>

            {/* Before / After Thumbnail Comparison */}
            <div className="grid grid-cols-2 gap-3 items-center pt-1">
              {/* Before */}
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="w-full h-16 rounded bg-[#d6cfbe] p-1 opacity-70 flex flex-col gap-0.5 border border-slate-700/60">
                  <div className="h-1 bg-slate-600 rounded-sm w-2/3" />
                  <div className="h-0.5 bg-slate-400 rounded-sm w-full" />
                  <div className="h-0.5 bg-slate-400 rounded-sm w-full" />
                </div>
                <div className="text-[10px] text-slate-300 font-semibold">
                  Before <span className="text-slate-500 font-normal">(Original)</span>
                </div>
                <ul className="text-[9px] text-slate-400 space-y-0.5 list-disc list-inside">
                  <li>Low contrast</li>
                  <li>Faint text</li>
                  <li>Shadows & noise</li>
                </ul>
              </div>

              {/* After */}
              <div className="p-2 rounded-xl bg-slate-950 border border-teal-500/40 space-y-2">
                <div className="w-full h-16 rounded bg-white p-1 flex flex-col gap-0.5 border border-teal-500/50 shadow-inner">
                  <div className="h-1 bg-slate-900 rounded-sm w-2/3" />
                  <div className="h-0.5 bg-slate-800 rounded-sm w-full" />
                  <div className="h-0.5 bg-slate-800 rounded-sm w-full" />
                </div>
                <div className="text-[10px] text-teal-300 font-semibold">
                  After <span className="text-slate-400 font-normal">(Enhanced)</span>
                </div>
                <ul className="text-[9px] text-slate-300 space-y-0.5 list-disc list-inside">
                  <li>Higher contrast</li>
                  <li>Sharper text</li>
                  <li>Clean B&W output</li>
                </ul>
              </div>
            </div>

            {/* Enhancement Mode Pill Group */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Enhancement Mode
              </span>
              <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
                {[
                  { id: 'Auto', label: 'Auto' },
                  { id: 'B&W', label: 'B&W' },
                  { id: 'Contrast', label: 'Contrast' },
                  { id: 'Noise Reduction', label: 'Noise Reduction' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setEnhancementMode(mode.id as any)}
                    className={`py-1.5 px-2 rounded-lg border text-center transition-colors ${
                      enhancementMode === mode.id
                        ? 'bg-teal-500/20 border-teal-500 text-teal-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
