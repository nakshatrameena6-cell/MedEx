import React, { useState } from 'react';
import { OptimizeRequest } from '../../types/api';
import { Cpu, AlertCircle, Loader2 } from 'lucide-react';

interface OptimizerFormProps {
  currentDistrict: string;
  onRunOptimizer: (req: OptimizeRequest) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export const OptimizerForm: React.FC<OptimizerFormProps> = ({
  currentDistrict,
  onRunOptimizer,
  isLoading,
  disabled = false,
}) => {
  const [districtId, setDistrictId] = useState<string>(
    currentDistrict !== 'ALL' ? currentDistrict : 'TN-D01'
  );
  const [drugCode, setDrugCode] = useState<string>(''); // empty = all RED drugs
  const [emergencyMode, setEmergencyMode] = useState<boolean>(false);
  const [allowCrossState, setAllowCrossState] = useState<boolean>(false);
  const [blockedFacilityIds, setBlockedFacilityIds] = useState<string[]>([]);
  const [maxProposals, setMaxProposals] = useState<number>(5);

  const handleEmergencyToggle = (checked: boolean) => {
    setEmergencyMode(checked);
    if (!checked) {
      setAllowCrossState(false); // Contract constraint: allow_cross_state requires emergency_mode = true
    }
  };

  const handleBlockedToggle = (facId: string) => {
    setBlockedFacilityIds((prev) =>
      prev.includes(facId) ? prev.filter((id) => id !== facId) : [...prev, facId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRunOptimizer({
      district_id: districtId,
      drug_code: drugCode ? drugCode : null,
      emergency_mode: emergencyMode,
      allow_cross_state: emergencyMode ? allowCrossState : false,
      blocked_facility_ids: blockedFacilityIds,
      max_proposals: maxProposals,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="medex-panel p-4 bg-medex-surface/60 border border-medex-border rounded-xl space-y-4 text-left">
      <div className="flex items-center gap-2 pb-2 border-b border-medex-border">
        <Cpu className="w-4 h-4 text-medex-cyan" />
        <h4 className="text-xs font-bold text-medex-primary font-mono uppercase tracking-wider">
          Transfer Finder Settings
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* District ID */}
        <div>
          <label className="text-2xs font-mono text-medex-muted block mb-1">
            District
          </label>
          <select
            value={districtId}
            onChange={(e) => setDistrictId(e.target.value)}
            disabled={disabled}
            className="w-full bg-medex-bg border border-medex-border rounded px-2.5 py-1.5 font-mono text-medex-primary focus:outline-none focus:border-medex-cyan"
          >
            <option value="TN-D01">TN-D01 (Tamil Nadu District 01)</option>
            <option value="BR-D02">BR-D02 (Bihar District 02)</option>
            <option value="MH-D03">MH-D03 (Maharashtra District 03)</option>
          </select>
        </div>

        {/* Drug Filter */}
        <div>
          <label className="text-2xs font-mono text-medex-muted block mb-1">
            Medicine Filter
          </label>
          <select
            value={drugCode}
            onChange={(e) => setDrugCode(e.target.value)}
            disabled={disabled}
            className="w-full bg-medex-bg border border-medex-border rounded px-2.5 py-1.5 font-mono text-medex-primary focus:outline-none focus:border-medex-cyan"
          >
            <option value="">All Low Stock Medicines</option>
            <option value="ORS">ORS (Oral Rehydration Salts)</option>
            <option value="PARA500">Paracetamol 500 mg</option>
            <option value="AMOX500">Amoxicillin 500mg</option>
          </select>
        </div>
      </div>

      {/* Toggles: Emergency Mode & Cross State */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <label className="flex items-center gap-2 cursor-pointer bg-medex-bg/60 p-2.5 rounded border border-medex-border">
          <input
            type="checkbox"
            checked={emergencyMode}
            onChange={(e) => handleEmergencyToggle(e.target.checked)}
            disabled={disabled}
            className="rounded border-medex-border text-medex-cyan focus:ring-0 bg-medex-bg"
          />
          <div>
            <span className="text-xs font-bold text-medex-primary block font-mono">
              Emergency Mode
            </span>
            <span className="text-2xs text-medex-muted block">
              Allows longer routes during shortages
            </span>
          </div>
        </label>

        <label
          className={`flex items-center gap-2 p-2.5 rounded border ${
            !emergencyMode
              ? 'opacity-40 cursor-not-allowed bg-medex-bg/20 border-medex-border'
              : 'cursor-pointer bg-medex-bg/60 border-medex-border'
          }`}
        >
          <input
            type="checkbox"
            checked={allowCrossState}
            onChange={(e) => setAllowCrossState(e.target.checked)}
            disabled={disabled || !emergencyMode}
            className="rounded border-medex-border text-medex-cyan focus:ring-0 bg-medex-bg"
          />
          <div>
            <span className="text-xs font-bold text-medex-primary block font-mono">
              From Other States
            </span>
            <span className="text-2xs text-medex-muted block">
              Available in emergency mode
            </span>
          </div>
        </label>
      </div>

      {/* Blocked Facilities Selection (Road-cut toggle) */}
      <div>
        <label className="text-2xs font-mono text-medex-muted block mb-1">
          Excluded Health Centres (e.g. road closures)
        </label>
        <div className="flex flex-wrap gap-2">
          {['TN-PHC-021', 'TN-PHC-042', 'TN-CHC-003'].map((facId) => {
            const isBlocked = blockedFacilityIds.includes(facId);
            return (
              <button
                key={facId}
                type="button"
                onClick={() => handleBlockedToggle(facId)}
                disabled={disabled}
                className={`px-2.5 py-1 rounded text-2xs font-mono font-semibold transition-all border ${
                  isBlocked
                    ? 'bg-medex-red/20 border-medex-red/50 text-medex-red-light'
                    : 'bg-medex-bg border-medex-border text-medex-secondary hover:text-medex-primary'
                }`}
              >
                {isBlocked ? `✕ ${facId} (Excluded)` : `+ ${facId}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Max Proposals Slider */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-2xs font-mono text-medex-muted">
            Maximum Suggested Transfers: <strong className="text-medex-cyan">{maxProposals}</strong>
          </label>
        </div>
        <input
          type="range"
          min="1"
          max="20"
          value={maxProposals}
          onChange={(e) => setMaxProposals(parseInt(e.target.value) || 5)}
          disabled={disabled}
          className="w-full accent-medex-cyan bg-medex-bg h-1.5 rounded cursor-pointer"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || disabled}
        className={`w-full py-2.5 rounded-lg bg-medex-cyan text-medex-bg font-bold text-xs inline-flex items-center justify-center gap-2 shadow-md transition-all ${
          isLoading || disabled ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110'
        }`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Calculating Best Routes...</span>
          </>
        ) : (
          <>
            <Cpu className="w-4 h-4" />
            <span>Find Best Transfers</span>
          </>
        )}
      </button>

      {disabled && (
        <div className="text-2xs text-medex-amber flex items-center gap-1 font-mono">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Your user role is view-only.</span>
        </div>
      )}
    </form>
  );
};
