import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Building2,
  ChevronRight,
  RefreshCw,
  Activity,
  Layers,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { DeltaChip } from '../components/common/DeltaChip';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { TableSkeleton, Skeleton } from '../components/common/Skeleton';
import { RiskDrawer } from '../features/risk/RiskDrawer';
import { RiskFiltersPopover } from '../features/risk/RiskFiltersPopover';
import { RiskSparkline } from '../features/risk/RiskSparkline';
import { EarthPinGlobe3D } from '../components/3d/EarthPinGlobe3D';
import { Card3D } from '../components/3d/Card3D';
import { JellyRadio, StatusMark } from '../components/reactbits';
import { useAuthRole } from '../context/AuthRoleContext';
import { RiskItem, RiskResponse, RiskStatus } from '../types/api';
import { getRisk } from '../services/riskService';
import { COPY } from '../constants/copy';

export const RiskView: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { role, district, user, isMockMode } = useAuthRole();

  // Filters state reflected in URL params
  const statusFilter = searchParams.get('status') || 'ALL';
  const drugFilter = searchParams.get('drug_code') || 'ALL';
  const limitFilter = searchParams.get('limit') || '50';

  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [show3DLattice, setShow3DLattice] = useState(true);

  // Selected item for "Why this is flagged" drawer
  const [selectedItem, setSelectedItem] = useState<RiskItem | null>(null);
  const selectedRowRef = useRef<HTMLElement | null>(null);

  // API Data State
  const [riskResponse, setRiskResponse] = useState<RiskResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Count-up animation state for hero KPI
  const [animatedCount, setAnimatedCount] = useState<number>(0);

  const loadRiskData = async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage('');

    const headers: Record<string, string> = {
      'X-Role': role,
      'X-District': district,
      'X-User': user,
    };
    if (isMockMode) {
      headers['X-Mock'] = 'true';
    }

    try {
      const data = await getRisk(
        {
          district_id: district,
          drug_code: drugFilter !== 'ALL' ? drugFilter : undefined,
          status: statusFilter !== 'ALL' ? (statusFilter as RiskStatus) : undefined,
          limit: parseInt(limitFilter, 10),
        },
        headers
      );
      setRiskResponse(data);
    } catch (err: any) {
      setIsError(true);
      setErrorMessage(err.message || 'Failed to load risk data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRiskData();
  }, [role, district, user, isMockMode, statusFilter, drugFilter, limitFilter]);

  const items = riskResponse?.items || [];
  const resilience = riskResponse?.resilience;

  // Red count (running out soon)
  const redCount = items.filter((i) => i.status === 'RED' || i.cover_days <= 7).length;
  const amberCount = items.filter((i) => i.status === 'AMBER').length;
  const greenCount = items.filter((i) => i.status === 'GREEN').length;

  // Animated count-up simulation on load (~500ms)
  useEffect(() => {
    if (isLoading) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setAnimatedCount(redCount);
      return;
    }

    setAnimatedCount(0);
    const duration = 500;
    const steps = 15;
    const increment = redCount / steps;
    let step = 0;

    const timer = setInterval(() => {
      step += 1;
      setAnimatedCount(Math.min(Math.round(increment * step), redCount));
      if (step >= steps) clearInterval(timer);
    }, duration / steps);

    return () => clearInterval(timer);
  }, [redCount, isLoading]);

  // Average lead time
  const avgLeadTime = items.length > 0
    ? (items.reduce((acc, curr) => acc + curr.lead_time_days, 0) / items.length).toFixed(1)
    : '6.0';

  // Active filter count
  let activeFilterCount = 0;
  if (statusFilter !== 'ALL') activeFilterCount += 1;
  if (drugFilter !== 'ALL') activeFilterCount += 1;
  if (limitFilter !== '50') activeFilterCount += 1;

  const updateFilters = (newStatus: string, newDrug: string, newLimit: string) => {
    const params: Record<string, string> = {};
    if (newStatus !== 'ALL') params.status = newStatus;
    if (newDrug !== 'ALL') params.drug_code = newDrug;
    if (newLimit !== '50') params.limit = newLimit;
    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setSearchParams({});
  };

  return (
    <div className="space-y-6 font-sans text-theme-text pb-12">
      {/* Page Header */}
      <div className="relative">
        <PageHeader
          title={COPY.headers.riskQueueTitle}
          subtitle={
            items.length > 0
              ? `${items.length} health facilities tracked under active federated neural telemetry`
              : 'All facility stock levels are within normal bounds'
          }
          activeFilterCount={activeFilterCount}
          onToggleFilters={() => setIsFilterPopoverOpen(!isFilterPopoverOpen)}
          actionSlot={
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShow3DLattice(!show3DLattice)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
                  show3DLattice
                    ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300 shadow-[0_0_15px_rgba(45,212,191,0.15)]'
                    : 'border-white/[0.08] bg-[#0c131a] text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{show3DLattice ? '3D LATTICE: ACTIVE' : '3D LATTICE: HIDDEN'}</span>
              </button>

              <Button
                variant="secondary"
                size="sm"
                icon={RefreshCw}
                onClick={loadRiskData}
                isLoading={isLoading}
              >
                {COPY.actions.refresh}
              </Button>
            </div>
          }
        />

        {/* Filters Popover */}
        <RiskFiltersPopover
          isOpen={isFilterPopoverOpen}
          onClose={() => setIsFilterPopoverOpen(false)}
          statusFilter={statusFilter}
          onStatusChange={(val) => updateFilters(val, drugFilter, limitFilter)}
          drugFilter={drugFilter}
          onDrugChange={(val) => updateFilters(statusFilter, val, limitFilter)}
          limitFilter={limitFilter}
          onLimitChange={(val) => updateFilters(statusFilter, drugFilter, val)}
          onReset={handleResetFilters}
        />
      </div>

      {/* V4 3D Tactical Neural Supply Lattice Module */}
      <AnimatePresence>
        {show3DLattice && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <EarthPinGlobe3D
              height="440px"
              interactive={true}
              showHUD={true}
              activeNodeName={selectedItem?.facility_name || 'GLOBAL SUPPLY NETWORK'}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drift Alert Banner */}
      {resilience?.drift_alert && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[13px] text-amber-300 flex items-center justify-between gap-4 font-sans backdrop-blur-md shadow-lg"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" strokeWidth={1.8} />
            <div>
              <span className="font-semibold block font-mono text-xs uppercase tracking-wider text-amber-200">
                Resilience Drift Anomaly Detected
              </span>
              <span className="text-[12px] opacity-90 leading-tight block">
                District resilience score dropped by{' '}
                <strong className="underline text-amber-300">{Math.abs(resilience.delta)} points</strong> vs previous week (Previous: {resilience.previous_week_score} → Current: {resilience.score}).
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-[10px] font-bold uppercase tracking-widest shrink-0">
            DRIFT ACTIVE
          </span>
        </motion.div>
      )}

      {/* 3 KPI Cards: 3D Interactive Telemetry Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: "Running out soon" (Hero Card with 3D crimson sheen) */}
          <Card3D glowColor="rgba(239, 68, 68, 0.28)">
            <div className="p-5 font-sans flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-red-400 font-bold tracking-wider">[01]</span>
                  <span className="text-[13px] font-medium text-theme-muted">Running out soon</span>
                </div>
                <StatusBadge status="RED" label="Critical" size="sm" />
              </div>

              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-[38px] font-bold text-red-400 leading-none tracking-tight font-mono">
                  {animatedCount}
                </span>
                <span className="text-[12px] font-mono text-theme-muted">
                  within 7 days
                </span>
              </div>

              <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between text-[11px] text-theme-muted">
                <span>Stock below 7-day safety buffer</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                  <span className="font-mono text-[9px] text-red-400 font-bold">URGENT</span>
                </div>
              </div>
            </div>
          </Card3D>

          {/* Card 2: "Resilience" (3D emerald/teal glow with micro-sparkline) */}
          <Card3D glowColor="rgba(45, 212, 191, 0.28)">
            <div className="p-5 font-sans flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-cyan-400 font-bold tracking-wider">[02]</span>
                  <span className="text-[13px] font-medium text-theme-muted">Resilience Index</span>
                </div>
                {resilience && (
                  <RiskSparkline data={[resilience.previous_week_score, resilience.score]} />
                )}
              </div>

              <div className="flex items-baseline justify-between gap-2 pt-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[38px] font-bold text-theme-text leading-none tracking-tight font-mono">
                    {resilience?.score ?? 71}
                  </span>
                  <span className="text-[14px] font-mono text-theme-muted">/ 100</span>
                </div>
                {resilience && (
                  <DeltaChip value={resilience.delta} unit="pts" />
                )}
              </div>

              <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between text-[11px] text-theme-muted">
                <span>District supply network health</span>
                <span className="font-mono text-[9px] text-emerald-400 font-bold uppercase tracking-wider">
                  OPTIMAL BUFFER
                </span>
              </div>
            </div>
          </Card3D>

          {/* Card 3: "Delivery time" (3D sky blue sheen) */}
          <Card3D glowColor="rgba(56, 189, 248, 0.25)">
            <div className="p-5 font-sans flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-sky-400 font-bold tracking-wider">[03]</span>
                  <span className="text-[13px] font-medium text-theme-muted">Average Lead Time</span>
                </div>
                <span className="font-mono text-[10px] text-slate-400 bg-white/[0.05] px-2 py-0.5 rounded border border-white/[0.08]">
                  P50 METRIC
                </span>
              </div>

              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-[38px] font-bold text-theme-text leading-none tracking-tight font-mono">
                  {avgLeadTime}
                </span>
                <span className="text-[13px] font-mono text-theme-muted">days</span>
              </div>

              <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between text-[11px] text-theme-muted">
                <span>Dispatch transit from regional depot</span>
                <span className="font-mono text-[9px] text-sky-400 font-bold uppercase tracking-wider">
                  DISPATCH ACTIVE
                </span>
              </div>
            </div>
          </Card3D>
        </div>
      )}

      {/* Main Risk Table Section (V4 Tactical HUD Centerpiece) */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0c131a]/95 backdrop-blur-xl overflow-hidden shadow-2xl space-y-0">
        {/* Table Toolbar Header with Tactile Status Tabs */}
        <div className="p-4 border-b border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#080d12]/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-theme-text font-mono flex items-center gap-2">
                <span>PRIORITIZED STOCK EXHAUSTION QUEUE</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-white/[0.06] text-slate-400 font-normal">
                  {items.length} records
                </span>
              </h2>
              <p className="text-[11px] text-theme-muted">
                Real-time stock cover telemetry sorted by critical depletion threshold
              </p>
            </div>
          </div>

          {/* ReactBits JellyRadio Interactive Filter */}
          <div className="flex items-center">
            <JellyRadio
              items={[
                { value: 'ALL', label: `All (${items.length})` },
                { value: 'RED', label: `Critical (${redCount})` },
                { value: 'AMBER', label: `Watch (${amberCount})` },
                { value: 'GREEN', label: `Stable (${greenCount})` },
              ]}
              value={statusFilter}
              onChange={(val: string) => updateFilters(val, drugFilter, limitFilter)}
              chipColor="var(--color-surface)"
              activeColor="var(--palette-lime)"
              textColor="var(--color-text)"
              activeTextColor="var(--palette-coffee)"
              size="sm"
              radius={12}
            />
          </div>
        </div>

        {/* Content State Handling */}
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={6} columns={5} />
          </div>
        ) : isError ? (
          <div className="p-6">
            <ErrorState
              title="Couldn't load risk data"
              message={errorMessage || 'Failed to communicate with risk intelligence engine.'}
              onRetry={loadRiskData}
            />
          </div>
        ) : items.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No active risks detected"
              description="No health facilities meet the current risk status or drug filter criteria."
              action={
                activeFilterCount > 0 ? (
                  <Button variant="secondary" size="sm" onClick={handleResetFilters}>
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div>
            {/* Desktop & Tablet Table View (≥768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans">
                <thead>
                  <tr className="bg-[#070b0f] border-b border-white/[0.08] text-slate-400 text-[11px] font-mono uppercase tracking-wider sticky top-0 z-10">
                    <th scope="col" className="px-5 py-3 w-5/12">Item & Facility Location</th>
                    <th scope="col" className="px-5 py-3 w-2/12">Stock Left & Cover</th>
                    <th scope="col" className="px-5 py-3 w-2/12">Operational Status</th>
                    <th scope="col" className="px-5 py-3 w-2/12">Telemetry Recommendation</th>
                    <th scope="col" className="px-3 py-3 w-10 text-right"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05] text-xs">
                  {items.map((item, idx) => {
                    const isSelected =
                      selectedItem?.facility_id === item.facility_id &&
                      selectedItem?.drug_code === item.drug_code;

                    const isRed = item.status === 'RED';
                    const isAmber = item.status === 'AMBER';

                    // Rail indicator color
                    const railBorder = isRed
                      ? 'border-l-[4px] border-l-red-500 bg-red-500/[0.03]'
                      : isAmber
                      ? 'border-l-[4px] border-l-amber-500 bg-amber-500/[0.03]'
                      : 'border-l-[4px] border-l-emerald-500 bg-transparent';

                    return (
                      <motion.tr
                        key={`${item.facility_id}:${item.drug_code}`}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(idx * 0.025, 0.25) }}
                        tabIndex={0}
                        role="button"
                        aria-expanded={isSelected}
                        aria-controls="risk-drawer-panel"
                        aria-label={`${item.drug_name} at ${item.facility_name}, ${
                          isRed ? 'critical' : isAmber ? 'watch' : 'stable'
                        }, ${item.cover_days} days left`}
                        onClick={(e) => {
                          selectedRowRef.current = e.currentTarget as HTMLElement;
                          setSelectedItem(item);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            selectedRowRef.current = e.currentTarget as HTMLElement;
                            setSelectedItem(item);
                          }
                        }}
                        className={`group transition-all duration-150 h-[68px] cursor-pointer focus-visible:outline-2 focus-visible:outline-cyan-400 ${railBorder} ${
                          isSelected
                            ? 'bg-cyan-500/10 ring-1 ring-cyan-500/40'
                            : 'hover:bg-white/[0.03]'
                        }`}
                      >
                        {/* Item & Location */}
                        <td className="px-5 py-3.5 align-middle">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[14px] text-theme-text font-mono tracking-tight">
                                {item.drug_name}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.06] text-slate-300">
                                {item.drug_code}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[12px] text-theme-muted">
                              <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" strokeWidth={1.8} />
                              <span className="font-medium text-slate-300">{item.facility_name}</span>
                              <span className="font-mono text-[10px] text-slate-500">({item.facility_id})</span>
                            </div>
                          </div>
                        </td>

                        {/* Stock Left & Cover */}
                        <td className="px-5 py-3.5 align-middle font-mono">
                          <div className="flex items-baseline gap-1.5">
                            <span
                              className={`text-[16px] font-bold ${
                                isRed
                                  ? 'text-red-400'
                                  : isAmber
                                  ? 'text-amber-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {item.cover_days} days
                            </span>
                            <span className="text-[11px] text-slate-400">
                              ({item.stock_qty.toLocaleString()} {item.unit})
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 block">
                            Lead time: {item.lead_time_days} days
                          </span>
                        </td>

                        {/* Operational Status */}
                        <td className="px-5 py-3.5 align-middle">
                          <div className="flex items-center gap-2">
                            <StatusMark
                              status={isRed ? 'failed' : isAmber ? 'running' : 'done'}
                              size={16}
                              doneColor="#C5D86D"
                              errorColor="#F05D23"
                              color="#FFA578"
                            />
                            <StatusBadge status={item.status} size="sm" />
                          </div>
                        </td>

                        {/* Telemetry Recommendation / Action */}
                        <td className="px-5 py-3.5 align-middle">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] text-slate-300 truncate max-w-[200px]" title={item.reason}>
                              {item.reason || 'Monitor telemetry'}
                            </span>
                          </div>
                        </td>

                        {/* Action Chevron */}
                        <td className="px-3 py-3.5 align-middle text-right">
                          <div className="p-1 rounded-md text-slate-500 group-hover:text-cyan-400 group-hover:bg-cyan-500/10 transition-all inline-flex items-center justify-center">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View (<768px) */}
            <div className="block md:hidden divide-y divide-white/[0.08]">
              {items.map((item) => {
                const isSelected =
                  selectedItem?.facility_id === item.facility_id &&
                  selectedItem?.drug_code === item.drug_code;
                const isRed = item.status === 'RED';
                const isAmber = item.status === 'AMBER';

                return (
                  <div
                    key={`${item.facility_id}:${item.drug_code}`}
                    onClick={() => setSelectedItem(item)}
                    className={`p-4 transition-colors cursor-pointer border-l-4 ${
                      isRed
                        ? 'border-l-red-500 bg-red-500/[0.04]'
                        : isAmber
                        ? 'border-l-amber-500 bg-amber-500/[0.04]'
                        : 'border-l-emerald-500 bg-transparent'
                    } ${isSelected ? 'bg-cyan-500/10' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-theme-text font-mono">
                            {item.drug_name}
                          </span>
                          <span className="text-[10px] font-mono px-1 rounded bg-white/[0.08] text-slate-300">
                            {item.drug_code}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-theme-muted mt-1">
                          <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>{item.facility_name}</span>
                        </div>
                      </div>
                      <StatusBadge status={item.status} size="sm" />
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs font-mono border-t border-white/[0.05] pt-2">
                      <span className={isRed ? 'text-red-400 font-bold' : 'text-slate-300'}>
                        {item.cover_days} days cover left
                      </span>
                      <span className="text-cyan-400 text-2xs flex items-center gap-1 font-sans">
                        <span>Details</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* "Why This Is Flagged" Slide-Over Drawer */}
      <RiskDrawer
        item={selectedItem}
        onClose={() => {
          setSelectedItem(null);
          selectedRowRef.current?.focus();
        }}
        triggerRef={selectedRowRef}
      />
    </div>
  );
};

export default RiskView;
