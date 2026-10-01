import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, RotateCcw, Info, ChevronDown } from 'lucide-react';
import { SimulationTrajectoryChart } from '../../components/charts/SimulationTrajectoryChart';
import { useToast } from '../../context/ToastContext';

type PresetType = 'monsoon' | 'waterborne' | 'supply_chain';

interface PresetConfig {
  id: PresetType;
  label: string;
  district: string;
  blocks: string;
  archetype: string;
  uplift: number;
  incubation: string;
  horizonWeeks: number;
  stockoutDay: number;
  stockoutDate: string;
  baselineDelta: string;
  deficitSachets: number;
  atRiskPopulation: string;
}

const PRESETS: Record<PresetType, PresetConfig> = {
  monsoon: {
    id: 'monsoon',
    label: 'Monsoon Surge +45%',
    district: 'TN-D01 (Tamil Nadu)',
    blocks: '3 Blocks selected (Alandur, etc.)',
    archetype: 'Dengue / Vector-borne',
    uplift: 45,
    incubation: 'Week 2',
    horizonWeeks: 4,
    stockoutDay: 9,
    stockoutDate: 'Oct 09',
    baselineDelta: '-12 Days vs. Baseline',
    deficitSachets: 480,
    atRiskPopulation: '14,200 Residents',
  },
  waterborne: {
    id: 'waterborne',
    label: 'Waterborne Outbreak',
    district: 'TN-D01 (Tamil Nadu)',
    blocks: '4 Blocks selected (Tambaram, etc.)',
    archetype: 'Diarrhea / Waterborne',
    uplift: 65,
    incubation: 'Week 1',
    horizonWeeks: 4,
    stockoutDay: 6,
    stockoutDate: 'Oct 06',
    baselineDelta: '-15 Days vs. Baseline',
    deficitSachets: 720,
    atRiskPopulation: '22,400 Residents',
  },
  supply_chain: {
    id: 'supply_chain',
    label: 'Supply Chain Freeze',
    district: 'TN-D01 (Tamil Nadu)',
    blocks: 'All 5 Blocks',
    archetype: 'Supply Chain Delay',
    uplift: 30,
    incubation: 'Week 3',
    horizonWeeks: 6,
    stockoutDay: 12,
    stockoutDate: 'Oct 12',
    baselineDelta: '-9 Days vs. Baseline',
    deficitSachets: 360,
    atRiskPopulation: '9,800 Residents',
  },
};

export const ScenarioPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [activePreset, setActivePreset] = useState<PresetType>('monsoon');
  const [district, setDistrict] = useState<string>('TN-D01 (Tamil Nadu)');
  const [blocks, setBlocks] = useState<string>('3 Blocks selected (Alandur, etc.)');
  const [archetype, setArchetype] = useState<string>('Dengue / Vector-borne');
  const [uplift, setUplift] = useState<number>(45);
  const [incubation, setIncubation] = useState<string>('Week 2');
  const [horizonWeeks, setHorizonWeeks] = useState<number>(4);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Dynamic calculations based on slider
  const dynamicStockoutDay = Math.max(4, Math.round(15 - (uplift / 100) * 13));
  const dynamicStockoutDate = `Oct ${String(dynamicStockoutDay).padStart(2, '0')}`;
  const dynamicDeltaDays = -(21 - dynamicStockoutDay);
  const dynamicDeficit = Math.round(300 + (uplift / 45) * 180);
  const dynamicResidents = `${Math.round(8000 + (uplift / 45) * 6200).toLocaleString()} Residents`;

  const handleSelectPreset = (key: PresetType) => {
    setActivePreset(key);
    const p = PRESETS[key];
    setDistrict(p.district);
    setBlocks(p.blocks);
    setArchetype(p.archetype);
    setUplift(p.uplift);
    setIncubation(p.incubation);
    setHorizonWeeks(p.horizonWeeks);
    toast.info(`Selected scenario: ${p.label}`);
  };

  const handleReset = () => {
    handleSelectPreset('monsoon');
    toast.info('Settings reset to default.');
  };

  const handleRunSimulation = () => {
    setIsSimulating(true);
    toast.info('Running simulation...');
    setTimeout(() => {
      setIsSimulating(false);
      toast.success('Simulation updated: new stock trajectory calculated.');
    }, 700);
  };

  const handleEmergencyOrder = () => {
    toast.info(`Preparing emergency order for ${dynamicDeficit} sachets...`);
    setTimeout(() => {
      navigate(`/transfers?to=TN-PHC-014&qty=${dynamicDeficit}&drug=ORS&priority=EMERGENCY`);
    }, 500);
  };

  const handleStockTransfer = () => {
    navigate('/transfers');
  };

  const handleApplyIntervention = () => {
    toast.success('Plan saved: safety stock prioritized.');
  };

  const handleExportBrief = () => {
    toast.success('Downloading Scenario Summary...');
    const briefContent = `MEDEX WHAT-IF SCENARIO ASSESSMENT BRIEF
=========================================
District: ${district}
Blocks: ${blocks}
Outbreak Type: ${archetype}
Demand Increase: +${uplift}%
Peak Week: ${incubation}
Time Period: ${horizonWeeks} Weeks

PROJECTED IMPACT:
----------------------------
Runs Out On: Day ${dynamicStockoutDay} (${dynamicStockoutDate})
Timing Difference: ${dynamicDeltaDays} Days vs. Baseline
Medicine Shortage: ${dynamicDeficit} Sachets
People Affected: ${dynamicResidents}

Generated: ${new Date().toISOString()}
Note: This was run in test mode and does not alter real stock.`;

    const blob = new Blob([briefContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MedEx_Scenario_Summary_${district.replace(/\s+/g, '_')}_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 font-sans text-left select-none max-w-[1540px] mx-auto pb-12">
      {/* =========================================================================
          1. PAGE HEADER: Overline, Title & Subtitle
          ========================================================================= */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-widest text-slate-400 uppercase">
          <span>— PLANNING</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          What-If Emergency Planner
        </h1>
        <p className="text-sm font-medium text-slate-400">
          Test how disease outbreaks or delivery delays affect medicine stock, safely without changing real data
        </p>
      </div>

      {/* =========================================================================
          2. TWO-COLUMN GRID LAYOUT
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* =====================================================================
            LEFT COLUMN: Scenario Setup (Approx 5 cols / 40%)
            ===================================================================== */}
        <div className="lg:col-span-5 rounded-2xl bg-[#091122] border border-slate-800 p-5 sm:p-6 space-y-5 shadow-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight">
              Scenario Setup
            </h2>
          </div>

          {/* Quick Presets Row */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleSelectPreset('monsoon')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                activePreset === 'monsoon'
                  ? 'border border-[#82a890]/80 bg-[#16271e] text-[#a3c4b0] shadow-[0_0_10px_rgba(130,168,144,0.3)]'
                  : 'border border-slate-700/60 bg-[#0c1527] text-slate-300 hover:text-white'
              }`}
            >
              Monsoon Surge (+45%)
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('waterborne')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                activePreset === 'waterborne'
                  ? 'border border-[#82a890]/80 bg-[#16271e] text-[#a3c4b0] shadow-[0_0_10px_rgba(130,168,144,0.3)]'
                  : 'border border-slate-700/60 bg-[#0c1527] text-slate-300 hover:text-white'
              }`}
            >
              Diarrhea Outbreak (+65%)
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('supply_chain')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                activePreset === 'supply_chain'
                  ? 'border border-[#82a890]/80 bg-[#16271e] text-[#a3c4b0] shadow-[0_0_10px_rgba(130,168,144,0.3)]'
                  : 'border border-slate-700/60 bg-[#0c1527] text-slate-300 hover:text-white'
              }`}
            >
              Delivery Delay (+30%)
            </button>
          </div>          {/* Section 1: CHOOSE LOCATION */}
          <div className="space-y-2 pt-1 border-t border-slate-800/80">
            <span className="text-[11px] font-mono font-semibold tracking-wider text-slate-400 uppercase block pt-1">
              1. CHOOSE LOCATION
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* District */}
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium block">District</label>
                <div className="relative">
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full appearance-none bg-[#0c1527] border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 pr-8"
                  >
                    <option value="TN-D01 (Tamil Nadu)">TN-D01 (Tamil Nadu)</option>
                    <option value="TN-D02 (Coimbatore)">TN-D02 (Coimbatore)</option>
                    <option value="TN-D03 (Madurai)">TN-D03 (Madurai)</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-3" />
                </div>
              </div>

              {/* Blocks */}
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium block">Blocks / Sub-Districts</label>
                <div className="relative">
                  <select
                    value={blocks}
                    onChange={(e) => setBlocks(e.target.value)}
                    className="w-full appearance-none bg-[#0c1527] border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 pr-8 truncate"
                  >
                    <option value="3 Blocks selected (Alandur, etc.)">3 Blocks (Alandur, etc.)</option>
                    <option value="All 5 Blocks">All 5 Blocks</option>
                    <option value="Single Block Focus">Single Block Focus</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-3" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: SELECT OUTBREAK TYPE */}
          <div className="space-y-2 pt-1 border-t border-slate-800/80">
            <span className="text-[11px] font-mono font-semibold tracking-wider text-slate-400 uppercase block pt-1">
              2. SELECT OUTBREAK TYPE
            </span>
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium block">Outbreak or Delay Type</label>
              <div className="relative">
                <select
                  value={archetype}
                  onChange={(e) => setArchetype(e.target.value)}
                  className="w-full appearance-none bg-[#0c1527] border border-slate-700/70 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 pr-8"
                >
                  <option value="Dengue / Vector-borne">Dengue (Mosquito-borne)</option>
                  <option value="Diarrhea / Waterborne">Diarrhea (Waterborne)</option>
                  <option value="Influenza / Respiratory">Flu / Respiratory</option>
                  <option value="Supply Chain Delay">Supply Delivery Delay</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-3.5" />
              </div>
            </div>
          </div>

          {/* Section 3: SET SEVERITY */}
          <div className="space-y-3 pt-1 border-t border-slate-800/80">
            <span className="text-[11px] font-mono font-semibold tracking-wider text-slate-400 uppercase block pt-1">
              3. SET SEVERITY
            </span>

            {/* Slider with header labels and badge */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-300">Expected Extra Demand</span>
                <span className="px-2 py-0.5 rounded-md bg-[#0e172a] border border-slate-700 text-white font-mono text-[11px] font-bold">
                  +{uplift}%
                </span>
                <span className="font-mono text-slate-300 text-xs">+{uplift}% demand</span>
              </div>

              {/* Slider Track with gradient fill and glowing thumb */}
              <div className="relative flex items-center py-1">
                <input
                  type="range"
                  min="10"
                  max="120"
                  step="5"
                  value={uplift}
                  onChange={(e) => setUplift(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer focus:outline-none slider-fiery"
                  style={{
                    background: `linear-gradient(to right, #f59e0b 0%, #ef4444 ${
                      ((uplift - 10) / 110) * 100
                    }%, #334155 ${((uplift - 10) / 110) * 100}%, #334155 100%)`,
                  }}
                />
              </div>
            </div>

            {/* Incubation Peak */}
            <div className="space-y-1 pt-1">
              <label className="text-xs text-slate-300 font-medium block">Peak Week</label>
              <div className="relative">
                <select
                  value={incubation}
                  onChange={(e) => setIncubation(e.target.value)}
                  className="w-full appearance-none bg-[#0c1527] border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 pr-8"
                >
                  <option value="Week 1">Week 1 (Fast Surge)</option>
                  <option value="Week 2">Week 2 (Typical Surge)</option>
                  <option value="Week 3">Week 3 (Delayed Surge)</option>
                  <option value="Week 4">Week 4 (Gradual Rise)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-3" />
              </div>
            </div>
          </div>

          {/* Section 4: TIME PERIOD */}
          <div className="space-y-2 pt-1 border-t border-slate-800/80">
            <span className="text-[11px] font-mono font-semibold tracking-wider text-slate-400 uppercase block pt-1">
              4. TIME PERIOD
            </span>
            <div className="grid grid-cols-4 gap-2">
              {[2, 4, 6, 8].map((w) => {
                const isSelected = horizonWeeks === w;
                return (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setHorizonWeeks(w)}
                    className={`py-1.5 px-2 rounded-full text-xs font-mono transition-all text-center cursor-pointer ${
                      isSelected
                        ? 'border border-[#82a890]/80 bg-[#16271e] text-[#a3c4b0] shadow-[0_0_8px_rgba(130,168,144,0.3)]'
                        : 'border border-slate-700/60 bg-[#0c1527] text-slate-400 hover:text-white'
                    }`}
                  >
                    {isSelected ? `(*) ${w} Wks` : `( ) ${w} Wks`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-3 pt-3 border-t border-slate-800/80">
            {/* Primary Run Live Simulation Button */}
            <button
              type="button"
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className="flex-1 py-3 px-4 rounded-xl bg-[#e09f3e] hover:bg-[#edb053] text-[#1c1204] font-bold text-xs tracking-normal shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-[#1c1204]" />
              <span>{isSimulating ? 'Simulating…' : 'Run Simulation'}</span>
            </button>

            {/* Reset to Baseline Button */}
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 py-3 px-4 rounded-xl bg-[#0c1527] hover:bg-slate-800/80 border border-slate-700/70 text-slate-300 hover:text-white font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset Settings</span>
            </button>
          </div>
        </div>

        {/* =====================================================================
            RIGHT COLUMN: Projected Stock Level (Approx 7 cols / 60%)
            ===================================================================== */}
        <div className="lg:col-span-7 rounded-2xl bg-[#091122] border border-slate-800 p-5 sm:p-6 space-y-5 shadow-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight">
              Projected Stock Level (Oct 01 – Oct 28)
            </h2>
          </div>

          {/* Top Row: 3 Status KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Card 1: Stockout Day */}
            <div className="rounded-xl bg-[#101915] border border-[#263e30] p-4 flex flex-col justify-between space-y-2 shadow-lg">
              <span className="text-[10px] font-mono font-bold tracking-wider text-[#82a890] uppercase">
                RUNS OUT ON
              </span>
              <div className="text-2xl font-bold font-mono text-white tracking-tight flex items-baseline gap-1.5">
                <span>Day {dynamicStockoutDay}</span>
                <span className="text-xs font-normal text-[#a3c4b0] font-sans">
                  ({dynamicStockoutDate})
                </span>
              </div>
              <div className="text-xs font-mono text-red-400 font-semibold pt-1 border-t border-[#182a20]">
                Runs out {Math.abs(dynamicDeltaDays)} days sooner than normal
              </div>
            </div>

            {/* Card 2: Cumulative Deficit */}
            <div className="rounded-xl bg-[#1c1106] border border-amber-900/60 p-4 flex flex-col justify-between space-y-2 shadow-lg">
              <span className="text-[10px] font-mono font-bold tracking-wider text-amber-400 uppercase">
                STOCK SHORTAGE
              </span>
              <div className="text-2xl font-bold font-mono text-white tracking-tight flex items-baseline gap-1.5">
                <span>{dynamicDeficit}</span>
                <span className="text-xs font-normal text-amber-300 font-sans">
                  Sachets
                </span>
              </div>
              <div className="text-xs font-mono text-amber-400/80 pt-1 border-t border-amber-950/80">
                Depleting quickly
              </div>
            </div>

            {/* Card 3: Population at Risk */}
            <div className="rounded-xl bg-[#061e14] border border-emerald-900/60 p-4 flex flex-col justify-between space-y-2 shadow-lg">
              <span className="text-[10px] font-mono font-bold tracking-wider text-emerald-400 uppercase">
                PEOPLE AFFECTED
              </span>
              <div className="text-2xl font-bold font-mono text-white tracking-tight flex items-baseline gap-1.5">
                <span>{dynamicResidents.split(' ')[0]}</span>
                <span className="text-xs font-normal text-emerald-300 font-sans">
                  Residents
                </span>
              </div>
              <div className="text-xs font-mono text-emerald-400/80 pt-1 border-t border-emerald-950/80">
                Estimated in local area
              </div>
            </div>
          </div>

          {/* Centerpiece: Simulation Trajectory Chart */}
          <div className="pt-1">
            <SimulationTrajectoryChart
              upliftPct={uplift}
              stockoutDay={dynamicStockoutDay}
            />
          </div>

          {/* Bottom Action Buttons Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
            {/* Left Group */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleEmergencyOrder}
                className="px-4 py-2.5 rounded-xl bg-[#0c1527] hover:bg-slate-800/80 border border-slate-700/70 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
              >
                Emergency Restock Order
              </button>

              <button
                type="button"
                onClick={handleStockTransfer}
                className="px-4 py-2.5 rounded-xl bg-[#0c1527] hover:bg-slate-800/80 border border-slate-700/70 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
              >
                Stock Transfers
              </button>
            </div>

            {/* Right Group */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleApplyIntervention}
                className="px-4 py-2.5 rounded-xl bg-blue-900/50 hover:bg-blue-900/80 border border-blue-600/60 text-blue-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                Save Plan
              </button>

              {/* Export Brief Button with Diamond Sparkle Flare */}
              <div className="relative group">
                <div className="absolute -top-5 right-3 pointer-events-none z-20">
                  <svg width="44" height="44" viewBox="0 0 48 48" fill="none" className="overflow-visible">
                    <defs>
                      <radialGradient id="starGlowExport" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                        <stop offset="35%" stopColor="#bae6fd" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                      </radialGradient>
                    </defs>
                    <circle cx="24" cy="24" r="22" fill="url(#starGlowExport)" />
                    <path
                      d="M24 2 Q24 24 46 24 Q24 24 24 46 Q24 24 2 24 Q24 24 24 2 Z"
                      fill="white"
                      fillOpacity="0.95"
                    />
                    <path
                      d="M12 12 L36 36 M12 36 L36 12"
                      stroke="white"
                      strokeWidth="0.8"
                      strokeOpacity="0.4"
                    />
                    <circle cx="24" cy="24" r="2" fill="#ffffff" />
                  </svg>
                </div>

                <button
                  type="button"
                  onClick={handleExportBrief}
                  className="py-2.5 px-4 rounded-xl bg-[#82a890] hover:bg-[#9ec2ab] text-[#09140e] font-bold text-xs tracking-normal shadow-lg shadow-emerald-950/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  Download Summary
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Citation & Sandbox Isolation Banner */}
          <div className="rounded-xl bg-[#060c18] border border-slate-800/80 p-3 flex items-center gap-2.5 text-xs font-mono text-slate-300">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="truncate">Test mode: actions here do not affect actual inventory records.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
