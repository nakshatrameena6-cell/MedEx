import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cloud, Bug, Sprout } from 'lucide-react';
import { DemandForecastPositionChart } from '../components/charts/DemandForecastPositionChart';
import { useToast } from '../context/ToastContext';

export const ForecastView: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [isDrafting, setIsDrafting] = useState(false);

  const handleDraftRequisition = () => {
    setIsDrafting(true);
    toast.info('Drafting restock requisition for 350 units of ORS...');
    setTimeout(() => {
      setIsDrafting(false);
      navigate('/transfers?to=TN-PHC-014&qty=350&drug=ORS');
    }, 600);
  };

  const handleSimulateSurge = () => {
    navigate('/scenario?facility_id=TN-PHC-014&scenario=epidemic_surge');
  };

  return (
    <div className="space-y-6 font-sans text-left select-none max-w-[1520px] mx-auto pb-10">
      {/* =========================================================================
          1. PAGE HEADER: Title & Horizon
          ========================================================================= */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Medicine Demand: Oral Rehydration Salts (ORS)
        </h1>
        <p className="text-sm font-medium text-slate-400">
          Next 4-Week Forecast: Oct 01 – Oct 28, 2026
        </p>
      </div>

      {/* =========================================================================
          2. TOP KPI CARDS ROW (3 CARDS)
          ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Expected Highest Demand */}
        <div className="rounded-2xl bg-[#0d1612] border border-[#263e30] p-5 flex flex-col justify-between space-y-4 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-200">
              Expected Peak Demand
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#182a20] border border-[#3b664d] text-[#a3c4b0] font-mono text-[11px] font-semibold">
              <span className="text-[10px]">ⓘ</span>
              <span>Projected</span>
            </span>
          </div>

          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-4xl sm:text-5xl font-bold text-[#82a890] font-mono tracking-tight">
              42
            </span>
            <span className="text-sm font-mono text-slate-300">
              sachets/day
            </span>
          </div>

          <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-[#182a20]">
            <span className="text-slate-400">±7 sachets estimated variation</span>
            <span className="text-emerald-400 font-bold">+35% vs past average</span>
          </div>
        </div>

        {/* Card 2: Current Stock & Daily Use */}
        <div className="rounded-2xl bg-[#181208] border border-[#4d3416] p-5 flex flex-col justify-between space-y-4 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-200">
              Current Stock Available
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#2a1d0d] border border-[#6b471a] text-[#f5b759] font-mono text-[11px] font-semibold">
              <span className="text-[10px]">ⓘ</span>
              <span>On Hand</span>
            </span>
          </div>

          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-4xl sm:text-5xl font-bold text-white font-mono tracking-tight">
              180
            </span>
            <span className="text-sm font-mono text-slate-300">
              sachets in stock
            </span>
          </div>

          <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-amber-950/80">
            <span className="text-slate-400">Enough for ~6 days</span>
            <span className="text-amber-300/80">Restocked 4 days ago</span>
          </div>
        </div>

        {/* Card 3: Stockout Risk */}
        <div className="rounded-2xl bg-[#170a0e] border border-red-900/50 p-5 flex flex-col justify-between space-y-4 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-200">
              Risk of Running Out
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-950/80 border border-red-700/60 text-red-400 font-mono text-[11px] font-semibold">
              <span className="text-[10px]">ⓘ</span>
              <span>Action Needed</span>
            </span>
          </div>

          <div className="space-y-1 pt-1">
            <div className="text-xl sm:text-2xl font-bold text-red-400 font-mono tracking-tight flex flex-wrap items-baseline gap-1.5">
              <span>Runs out in ~11 Days</span>
              <span className="text-xs font-normal text-slate-400 font-sans">
                (around Oct 11)
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-red-950/80 text-xs font-mono text-red-300/80">
            Reorder recommended now to avoid shortage
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. MAIN CHART SECTION: Demand Forecast & Inventory Position
          ========================================================================= */}
      <DemandForecastPositionChart />

      {/* =========================================================================
          4. BOTTOM SECTION: Key Drivers & Outbreak Signals + Action Buttons
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column: Key Drivers (9 Cols) */}
        <div className="lg:col-span-9 space-y-3">
          <h3 className="text-sm font-semibold text-white tracking-wide">
            What Is Driving This Demand?
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Driver 1: Monsoon Precipitation */}
            <div className="p-4 rounded-2xl bg-[#091122] border border-slate-800 flex items-center gap-3.5 shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-blue-950/70 border border-blue-700/50 flex items-center justify-center text-blue-400 shrink-0">
                <Cloud className="w-6 h-6" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="text-xs font-medium text-slate-300 truncate">
                  Heavy Monsoon Rain (Next 7 Days)
                </div>
                <div className="text-2xl font-bold text-emerald-400 font-mono tracking-tight leading-none pt-0.5">
                  +38%
                </div>
                <div className="text-[11px] text-slate-400">more medicine needed</div>
              </div>
            </div>

            {/* Driver 2: Illness Spike */}
            <div className="p-4 rounded-2xl bg-[#141006] border border-slate-800 flex items-center gap-3.5 shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-amber-950/70 border border-amber-700/50 flex items-center justify-center text-amber-400 shrink-0">
                <Bug className="w-6 h-6" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="text-xs font-medium text-slate-300 truncate" title="Water & Mosquito Illness Spike (Diarrhea/Dengue)">
                  Water & Mosquito Illnesses
                </div>
                <div className="text-2xl font-bold text-emerald-400 font-mono tracking-tight leading-none pt-0.5">
                  +24%
                </div>
                <div className="text-[11px] text-slate-400">rise in local cases</div>
              </div>
            </div>

            {/* Driver 3: Seasonal Pattern */}
            <div className="p-4 rounded-2xl bg-[#081813] border border-slate-800 flex items-center gap-3.5 shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-emerald-950/70 border border-emerald-700/50 flex items-center justify-center text-emerald-400 shrink-0">
                <Sprout className="w-6 h-6" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="text-xs font-medium text-slate-300 truncate">
                  Regular Seasonal Pattern
                </div>
                <div className="text-2xl font-bold text-emerald-400 font-mono tracking-tight leading-none pt-0.5">
                  +18%
                </div>
                <div className="text-[11px] text-slate-400">usual yearly trend</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Action Buttons Box (3 Cols) */}
        <div className="lg:col-span-3 rounded-2xl bg-[#080e1c] border border-slate-800 p-4 sm:p-5 flex flex-col justify-center gap-3 shadow-xl relative overflow-visible">
          {/* Primary Action Button with Diamond Sparkle Flare */}
          <div className="relative group">
            {/* Diamond Flare sitting atop right edge */}
            <div className="absolute -top-6 right-6 pointer-events-none z-20">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="overflow-visible">
                <defs>
                  <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                    <stop offset="35%" stopColor="#bae6fd" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <circle cx="24" cy="24" r="22" fill="url(#starGlow)" />
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
              onClick={handleDraftRequisition}
              disabled={isDrafting}
              className="w-full py-3.5 px-4 rounded-xl bg-[#e09f3e] hover:bg-[#edb053] text-[#1c1204] font-bold text-xs sm:text-[13px] tracking-normal shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer block text-center"
            >
              Order Restock (350 Sachets)
            </button>
          </div>

          {/* Secondary Action Button */}
          <button
            type="button"
            onClick={handleSimulateSurge}
            className="w-full py-3 px-4 rounded-xl bg-[#101915] hover:bg-[#17231e] border border-[#2b4236] text-[#e8f1eb] font-medium text-xs tracking-normal transition-colors cursor-pointer text-center"
          >
            Test Outbreak Surge Scenario
          </button>
        </div>
      </div>
    </div>
  );
};
