import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ArrowUpRight, Building2, ChevronRight, RefreshCw, Globe2, ShieldCheck, Clock3 } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { DeltaChip } from '../components/common/DeltaChip';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { TableSkeleton } from '../components/common/Skeleton';
import { RiskDrawer } from '../features/risk/RiskDrawer';
import { RiskFiltersPopover } from '../features/risk/RiskFiltersPopover';
import { RiskSparkline } from '../features/risk/RiskSparkline';
import { EarthPinGlobe3D, PinLocation } from '../components/3d/EarthPinGlobe3D';
import { useAuthRole } from '../context/AuthRoleContext';
import { RiskItem, RiskResponse, RiskStatus } from '../types/api';
import { getRisk } from '../services/riskService';

const FILTERS = [
  { value: 'ALL', label: 'All priorities' }, { value: 'RED', label: 'Critical' },
  { value: 'AMBER', label: 'Watch' }, { value: 'GREEN', label: 'Healthy' },
];

export const RiskView: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { role, district, user, isMockMode } = useAuthRole();
  const statusFilter = searchParams.get('status') || 'ALL';
  const drugFilter = searchParams.get('drug_code') || 'ALL';
  const limitFilter = searchParams.get('limit') || '50';
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [showGlobe, setShowGlobe] = useState(true);
  const [selectedItem, setSelectedItem] = useState<RiskItem | null>(null);
  const selectedRowRef = useRef<HTMLElement | null>(null);
  const [riskResponse, setRiskResponse] = useState<RiskResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setErrorMessage('');
    setSelectedItem(null);
    const headers: Record<string, string> = { 'X-Role': role, 'X-District': district, 'X-User': user };
    if (isMockMode) headers['X-Mock'] = 'true';
    getRisk({
      district_id: district,
      drug_code: drugFilter !== 'ALL' ? drugFilter : undefined,
      status: statusFilter !== 'ALL' ? statusFilter as RiskStatus : undefined,
      limit: Math.max(1, Math.min(500, parseInt(limitFilter, 10) || 50)),
    }, headers).then((data) => {
      if (!cancelled) setRiskResponse(data);
    }).catch((error: unknown) => {
      if (!cancelled) {
        setRiskResponse(null);
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load risk data.');
      }
    }).finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [role, district, user, isMockMode, statusFilter, drugFilter, limitFilter, refreshKey]);

  const items = riskResponse?.items || [];
  const resilience = riskResponse?.resilience;
  const redCount = items.filter((item) => item.status === 'RED' || item.cover_days <= 7).length;
  const avgLeadTime = items.length ? (items.reduce((sum, item) => sum + item.lead_time_days, 0) / items.length).toFixed(1) : '--';
  const activeFilterCount = Number(statusFilter !== 'ALL') + Number(drugFilter !== 'ALL') + Number(limitFilter !== '50');
  // Multiple medicines can belong to one facility; display its most urgent status.
  const facilityMap = new Map<string, RiskItem>();
  const severity = { RED: 3, AMBER: 2, GREEN: 1 };
  items.forEach((item) => {
    const previous = facilityMap.get(item.facility_id);
    if (!previous || severity[item.status] > severity[previous.status]) facilityMap.set(item.facility_id, item);
  });
  const pins: PinLocation[] = [...facilityMap.values()]
    .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng))
    .map((item) => ({ name: item.facility_name, lat: item.lat!, lon: item.lng!, status: item.status === 'RED' ? 'critical' : item.status === 'AMBER' ? 'warning' : 'healthy' }));
  const updateFilters = (status: string, drug: string, limit: string) => {
    const params: Record<string, string> = {};
    if (status !== 'ALL') params.status = status;
    if (drug !== 'ALL') params.drug_code = drug;
    if (limit !== '50') params.limit = limit;
    setSearchParams(params);
  };
  const openItem = (item: RiskItem, element: HTMLElement) => { selectedRowRef.current = element; setSelectedItem(item); };
  const unavailable = isLoading || !!errorMessage;

  return (
    <div className="space-y-6 pb-4">
      <div className="relative">
        <PageHeader title="Risk intelligence" subtitle="A clearer view of supply risk. Prioritize today to protect tomorrow."
          activeFilterCount={activeFilterCount} onToggleFilters={() => setIsFilterPopoverOpen((open) => !open)}
          actionSlot={<>
            <Button variant="secondary" size="sm" icon={Globe2} aria-pressed={showGlobe} onClick={() => setShowGlobe((show) => !show)}>{showGlobe ? 'Hide globe' : 'Show globe'}</Button>
            <Button variant="primary" size="sm" icon={RefreshCw} onClick={() => setRefreshKey((key) => key + 1)} isLoading={isLoading}>Refresh data</Button>
          </>}
        />
        <RiskFiltersPopover isOpen={isFilterPopoverOpen} onClose={() => setIsFilterPopoverOpen(false)}
          statusFilter={statusFilter} onStatusChange={(value) => updateFilters(value, drugFilter, limitFilter)}
          drugFilter={drugFilter} onDrugChange={(value) => updateFilters(statusFilter, value, limitFilter)}
          limitFilter={limitFilter} onLimitChange={(value) => updateFilters(statusFilter, drugFilter, value)}
          onReset={() => setSearchParams({})} />
      </div>

      <div className={showGlobe ? 'risk-overview' : ''}>
        <AnimatePresence>
          {showGlobe && <motion.div key="earth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-w-0">
            <EarthPinGlobe3D height="100%" pins={unavailable ? [] : pins} isDemo={isMockMode}
              activeNodeName={selectedItem?.facility_name}
              onPinSelect={(name) => {
                const item = [...facilityMap.values()].find((facility) => facility.facility_name === name);
                if (item) {
                  selectedRowRef.current = document.activeElement as HTMLElement;
                  setSelectedItem(item);
                }
              }}
            />
          </motion.div>}
        </AnimatePresence>
        <div className={`risk-metrics ${!showGlobe ? '!grid-cols-1 sm:!grid-cols-3' : ''}`}>
          <div className="surface-card risk-metric animate-page-enter stagger-1">
            <div className="flex items-center justify-between gap-2 text-xs text-theme-muted"><span>Needs attention</span><AlertTriangle size={16} className="text-theme-critical" /></div>
            <div className="flex items-end justify-between">
              <div><span className="metric-value text-theme-critical">{unavailable ? '--' : redCount.toString().padStart(2, '0')}</span><span className="ml-2 text-xs text-theme-muted">items</span></div>
              <span className="text-[10px] rounded-full px-2 py-1 bg-theme-critical-bg text-theme-critical-text">Critical</span>
            </div>
            <div className="risk-metric-footer">Critical risk or under 7 days of stock</div>
          </div>
          <div className="surface-card risk-metric animate-page-enter stagger-2">
            <div className="flex items-center justify-between text-xs text-theme-muted"><span>Network resilience</span><ShieldCheck size={16} className="text-theme-primary" /></div>
            <div className="flex items-end justify-between gap-2">
              <div><span className="metric-value">{unavailable ? '--' : resilience?.score ?? '--'}</span><span className="ml-2 text-xs text-theme-muted">/ 100</span></div>
              {!unavailable && resilience && <RiskSparkline data={[resilience.previous_week_score, resilience.score]} />}
            </div>
            <div className="risk-metric-footer flex items-center justify-between"><span>Against previous week</span>{!unavailable && resilience && <DeltaChip value={resilience.delta} unit="pts" />}</div>
          </div>
          <div className="surface-card risk-metric animate-page-enter stagger-3">
            <div className="flex items-center justify-between text-xs text-theme-muted"><span>Average lead time</span><Clock3 size={16} className="text-theme-healthy-text" /></div>
            <div><span className="metric-value">{unavailable ? '--' : avgLeadTime}</span><span className="ml-2 text-xs text-theme-muted">days</span></div>
            <div className="risk-metric-footer">Delivery time across the current queue</div>
          </div>
        </div>
      </div>

      {!unavailable && resilience?.drift_alert && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-theme-border bg-theme-warning-bg px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg text-theme-warning-text bg-theme-surface"><AlertTriangle size={17} /></span>
            <div><p className="text-[12px] font-medium text-theme-text">A shift in network resilience</p>
              <p className="text-[11px] text-theme-muted mt-1">Down {Math.abs(resilience.delta)} points this week. Review critical supplies before the next delivery cycle.</p></div>
          </div>
          <a href="#risk-queue" className="inline-flex items-center gap-2 text-xs text-theme-warning-text">Review queue <ArrowUpRight size={15} /></a>
        </div>
      )}

      <section id="risk-queue" className="surface-card risk-queue scroll-mt-4">
        <div className="p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3"><h2 className="text-[18px] font-medium tracking-tight">Priority queue</h2>
            {!unavailable && <span className="text-[10px] font-mono text-theme-muted bg-theme-bg px-2 py-1 rounded-md">{items.length} ITEMS</span>}
          </div>
          <div className="flex flex-wrap items-center gap-1" aria-label="Filter priorities">
            {FILTERS.map((filter) => <button key={filter.value} type="button" className="filter-pill" aria-pressed={statusFilter === filter.value} onClick={() => updateFilters(filter.value, drugFilter, limitFilter)}>{filter.label}</button>)}
          </div>
        </div>
        {isLoading ? <div className="p-5" role="status" aria-label="Loading risk queue"><TableSkeleton rows={4} columns={5} /></div>
          : errorMessage ? <ErrorState message={errorMessage} onRetry={() => setRefreshKey((key) => key + 1)} />
          : !items.length ? <EmptyState title="No matching risks" description="No supply risks match the current filters." action={activeFilterCount > 0 ? <Button variant="secondary" size="sm" onClick={() => setSearchParams({})}>Clear filters</Button> : undefined} />
          : <>
            <div className="hidden md:block overflow-x-auto">
              <table className="risk-table">
                <thead><tr><th scope="col">Medicine / facility</th><th scope="col">Stock coverage</th><th scope="col">Priority</th><th scope="col">Recommended focus</th><th scope="col"><span className="sr-only">Details</span></th></tr></thead>
                <tbody>{items.map((item, index) => {
                  const color = item.status === 'RED' ? 'var(--color-critical)' : item.status === 'AMBER' ? 'var(--color-warning-text)' : 'var(--color-healthy-text)';
                  return <tr key={`${item.facility_id}:${item.drug_code}`} className="animate-page-enter" style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
                    tabIndex={0} aria-label={`View ${item.drug_name} at ${item.facility_name}`}
                    onClick={(event) => openItem(item, event.currentTarget)}
                    onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openItem(item, event.currentTarget); } }}>
                    <td><div className="font-medium text-theme-text">{item.drug_name}</div><div className="flex items-center gap-1.5 mt-2 text-[11px] text-theme-muted"><Building2 size={12} />{item.facility_name}<span className="font-mono text-[9px] ml-1">{item.drug_code}</span></div></td>
                    <td><span className="font-display text-[16px] font-medium" style={{ color }}>{item.cover_days} <span className="text-[11px] font-sans">days</span></span><div className="cover-track"><span style={{ width: `${Math.max(0, Math.min(100, item.cover_days / 30 * 100))}%`, background: color }} /></div><div className="text-[10px] text-theme-muted mt-2">{item.stock_qty.toLocaleString()} {item.unit}</div></td>
                    <td><StatusBadge status={item.status} size="sm" /></td>
                    <td><p className="text-theme-muted text-[11px] leading-relaxed max-w-[270px] line-clamp-2" title={item.reason}>{item.reason || 'Continue monitoring supply levels.'}</p></td>
                    <td><ChevronRight size={16} className="text-theme-muted" /></td>
                  </tr>;
                })}</tbody>
              </table>
            </div>
            <div className="md:hidden divide-y divide-theme-border">
              {items.map((item) => <button key={`${item.facility_id}:${item.drug_code}`} type="button" onClick={(event) => openItem(item, event.currentTarget)} className="w-full p-5 text-left hover:bg-theme-primary-tint">
                <div className="flex justify-between gap-3"><span className="text-sm font-medium">{item.drug_name}</span><StatusBadge status={item.status} size="sm" /></div>
                <div className="text-xs text-theme-muted mt-2">{item.facility_name}</div>
                <div className="mt-4 flex justify-between items-center text-xs"><span>{item.cover_days} days of stock</span><span className="text-theme-primary flex items-center gap-1">View details <ChevronRight size={14} /></span></div>
              </button>)}
            </div>
          </>}
        <div className="px-5 py-3 border-t border-theme-border flex flex-wrap justify-between gap-2 text-[10px] text-theme-muted">
          <span>{isMockMode ? 'Demonstration data' : 'District supply intelligence'} / {district}</span>
          {riskResponse?.as_of && <span>Updated {new Date(riskResponse.as_of).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>}
        </div>
      </section>
      <RiskDrawer item={selectedItem} onClose={() => { setSelectedItem(null); selectedRowRef.current?.focus(); }} triggerRef={selectedRowRef} />
    </div>
  );
};

export default RiskView;
