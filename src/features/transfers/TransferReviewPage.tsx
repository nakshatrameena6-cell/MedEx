import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthRole } from '../../context/AuthRoleContext';
import { OptimizeRequest, OptimizeResponse, Transfer, TransferState } from '../../types/api';
import { listTransfers, runOptimizer } from '../../services/transferService';
import { listFacilities } from '../../services/facilitiesService';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { FacilityMap } from '../../components/map/FacilityMap';
import { OptimizerForm } from './OptimizerForm';
import { ProposalCard } from './ProposalCard';
import { TransferDecisionPanel } from './TransferDecisionPanel';
import { Select } from '../../components/common/Select';
import {
  Activity, Boxes, Clock3, Command, MapPin, RefreshCw,
  Route, ShieldCheck, SlidersHorizontal, Sparkles, Truck, X,
} from 'lucide-react';

import { useToast } from '../../context/ToastContext';

export const TransferReviewPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { role, district, user, isMockMode } = useAuthRole();
  const toast = useToast();

  const queryDistrict = searchParams.get('district_id');
  const queryDrug = searchParams.get('drug_code');

  const [filterState, setFilterState] = useState<TransferState | 'ALL'>('ALL');
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [isOptimizerOpen, setIsOptimizerOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const [facilities, setFacilities] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
  const [solverStatus, setSolverStatus] = useState<'OPTIMAL' | 'FEASIBLE' | 'INFEASIBLE' | null>(null);

  const [isLoadingTransfers, setIsLoadingTransfers] = useState<boolean>(true);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      'X-Role': role,
      'X-District': district,
      'X-User': user,
    };
    if (isMockMode) {
      headers['X-Mock'] = 'true';
    }
    return headers;
  };

  const loadFacilitiesData = async () => {
    try {
      const data = await listFacilities(
        { district_id: queryDistrict || (district !== 'ALL' ? district : 'TN-D01') },
        getAuthHeaders()
      );
      setFacilities(data.items);
    } catch (err) {
      console.warn('Failed to load facilities for transfer map:', err);
    }
  };

  const fetchTransfersData = async (isManualRefresh = false) => {
    setIsLoadingTransfers(true);
    setErrorMsg(null);
    try {
      const data = await listTransfers(
        {
          district_id: queryDistrict || district,
          state: filterState !== 'ALL' ? filterState : undefined,
        },
        getAuthHeaders()
      );

      let filteredItems = data.items;
      if (queryDrug) {
        filteredItems = filteredItems.filter((t) => t.drug_code === queryDrug);
      }

      setTransfers(filteredItems);
      if (filteredItems.length > 0) {
        setSelectedTransfer(filteredItems[0]);
      } else {
        setSelectedTransfer(null);
      }
      if (isManualRefresh) {
        toast.success('Transfer proposals refreshed');
      }
    } catch (err: any) {
      console.error('Failed to load transfers:', err);
      setErrorMsg(err.message || 'Failed to load transfer proposals.');
      toast.error(err.message || 'Failed to load transfer proposals');
    } finally {
      setIsLoadingTransfers(false);
    }
  };

  useEffect(() => {
    loadFacilitiesData();
    fetchTransfersData();
  }, [role, district, user, isMockMode, filterState, queryDistrict, queryDrug]);

  const handleRunOptimizer = async (req: OptimizeRequest) => {
    setIsOptimizing(true);
    setErrorMsg(null);
    try {
      const res: OptimizeResponse = await runOptimizer(req, getAuthHeaders());
      setSolverStatus(res.solver.status);

      if (res.solver.status === 'INFEASIBLE' || res.proposals.length === 0) {
        setTransfers([]);
        setSelectedTransfer(null);
        toast.info('No feasible transfer proposals found for these parameters');
      } else {
        setTransfers(res.proposals);
        setSelectedTransfer(res.proposals[0]);
        toast.success(`Optimization run completed — ${res.proposals.length} proposals generated`);
      }
    } catch (err: any) {
      console.error('Optimizer error:', err);
      setErrorMsg(err.message || 'Failed to run OR-Tools optimizer.');
      toast.error(err.message || 'Failed to run optimization solver');
    } finally {
      setIsOptimizing(false);
    }
  };

  const isReadOnly = role === 'AUDITOR' || role === 'FACILITY';
  const openCount = transfers.filter((t) => t.state === 'OPEN').length;
  const avgEta = transfers.length > 0
    ? (transfers.reduce((acc, curr) => acc + curr.eta_hours, 0) / transfers.length).toFixed(1)
    : '2.5';
  const totalQty = transfers.reduce((acc, curr) => acc + curr.qty, 0);

  let activeFilterCount = 0;
  if (filterState !== 'ALL') activeFilterCount += 1;

  const route = selectedTransfer ? {
    from: { ...selectedTransfer.from },
    to: { ...selectedTransfer.to },
    polyline: selectedTransfer.route?.polyline || null,
  } : null;

  return (
    <div className="space-y-6 font-sans text-theme-text">
      <div className="relative">
        <PageHeader
          title="Transfer command"
          subtitle="Direct critical stock where it creates the greatest protection."
          activeFilterCount={activeFilterCount}
          onToggleFilters={() => setIsFilterPopoverOpen((open) => !open)}
          actionSlot={<>
            <Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => fetchTransfersData(true)} isLoading={isLoadingTransfers}>Sync network</Button>
            <Button size="sm" icon={SlidersHorizontal} onClick={() => setIsOptimizerOpen(true)}>New optimization</Button>
          </>}
        />
        {isFilterPopoverOpen && (
          <div ref={popoverRef} className="absolute right-0 top-full z-30 w-80 max-w-full surface-card p-4 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between"><h3 className="text-sm font-medium">Mission filter</h3><button aria-label="Close transfer filters" onClick={() => setIsFilterPopoverOpen(false)}><X size={16} /></button></div>
            <Select label="Transfer state" value={filterState} onChange={(value) => setFilterState(value as TransferState | 'ALL')} options={[
              { value: 'ALL', label: 'All missions' }, { value: 'OPEN', label: 'Open' },
              { value: 'APPROVED', label: 'Approved' }, { value: 'REJECTED', label: 'Rejected' },
              { value: 'ESCALATED', label: 'Escalated' }, { value: 'CLOSED', label: 'Closed' },
            ]} />
            <div className="flex justify-between"><Button variant="ghost" size="sm" onClick={() => setFilterState('ALL')}>Reset</Button><Button size="sm" onClick={() => setIsFilterPopoverOpen(false)}>Apply</Button></div>
          </div>
        )}
      </div>

      <section className="transfer-theater">
        <div className="transfer-map">
          <FacilityMap facilities={facilities} selectedFacilityId={selectedTransfer?.to.facility_id || null}
            onSelectFacility={() => {}} activePolyline={selectedTransfer?.route?.polyline || null}
            transferRoute={route} showControls showLegend={false} />
          <div className="transfer-theater-top">
            <div><span className="eyebrow !text-[#a9bdd8]">Live network theater</span><p className="text-xs text-white mt-2">District {district} / synchronized now</p></div>
            <span className="transfer-live"><i /> Command online</span>
          </div>
          {selectedTransfer && <div className="transfer-route-card">
            <div className="flex items-center justify-between gap-3"><span className="eyebrow !text-[#a9bdd8]">Active mission / {selectedTransfer.transfer_id}</span><StatusBadge status={selectedTransfer.state === 'OPEN' ? 'CYAN' : selectedTransfer.state === 'APPROVED' ? 'GREEN' : 'AMBER'} label={selectedTransfer.state} size="sm" /></div>
            <div className="transfer-route-nodes">
              <div><span>ORIGIN</span><strong>{selectedTransfer.from.name}</strong><small>{selectedTransfer.from.cover_days_before}d cover</small></div>
              <div className="transfer-route-line"><Truck size={16} /><i /></div>
              <div className="text-right"><span>DESTINATION</span><strong>{selectedTransfer.to.name}</strong><small>{selectedTransfer.to.cover_days_before}d → {selectedTransfer.to.cover_days_after}d</small></div>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
              <div><span>ETA</span><strong>{selectedTransfer.eta_hours} hr</strong></div>
              <div><span>DISTANCE</span><strong>{selectedTransfer.distance_km} km</strong></div>
              <div><span>LOAD</span><strong>{selectedTransfer.qty} {selectedTransfer.unit}</strong></div>
            </div>
          </div>}
        </div>
        <div className="transfer-telemetry">
          {isLoadingTransfers ? <><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></> : <>
            <div className="transfer-stat"><span>Open missions</span><Command /><strong>{String(openCount).padStart(2, '0')}</strong><small>Awaiting command decision</small></div>
            <div className="transfer-stat"><span>Mean arrival</span><Clock3 /><strong>{avgEta}<em> hr</em></strong><small>Across the active route set</small></div>
            <div className="transfer-stat"><span>Stock mobilized</span><Boxes /><strong>{totalQty.toLocaleString()}</strong><small>Essential units in proposed moves</small></div>
          </>}
        </div>
      </section>

      <div className="transfer-signal-strip">
        <div><Activity size={16} /><span>Solver status</span><strong>{solverStatus || 'READY'}</strong></div>
        <div><ShieldCheck size={16} /><span>Donor floor</span><strong>14 DAYS</strong></div>
        <div><Route size={16} /><span>Routes monitored</span><strong>{transfers.length}</strong></div>
        <div><MapPin size={16} /><span>Facilities online</span><strong>{facilities.length}</strong></div>
      </div>

      {errorMsg && <ErrorState title="Command link interrupted" message={errorMsg} onRetry={fetchTransfersData} />}

      <section className="surface-card overflow-hidden">
        <div className="p-5 md:p-6 flex flex-wrap items-end justify-between gap-4 border-b border-theme-border">
          <div><span className="eyebrow">Ranked operations</span><h2 className="text-xl mt-2">Recommended missions</h2><p className="text-xs text-theme-muted mt-1">Select a route to inspect its operational impact and authorize movement.</p></div>
          <span className="font-mono text-[10px] text-theme-muted">{transfers.length} ACTIVE RECOMMENDATIONS</span>
        </div>
        <div className="p-4 md:p-6">
          {isLoadingTransfers ? <div className="space-y-3"><Skeleton className="h-36" /><Skeleton className="h-36" /></div>
          : transfers.length === 0 ? <EmptyState title={solverStatus === 'INFEASIBLE' ? 'No feasible missions' : 'No transfer missions'} description={solverStatus === 'INFEASIBLE' ? 'No route meets donor cover and fleet constraints.' : 'No proposals match this command filter.'} />
          : <div className="grid xl:grid-cols-[minmax(0,1.2fr)_minmax(350px,.8fr)] gap-6 items-start">
              <div className="space-y-3">{transfers.map((transfer) => <ProposalCard key={transfer.transfer_id} transfer={transfer} isSelected={selectedTransfer?.transfer_id === transfer.transfer_id} onSelect={setSelectedTransfer} />)}</div>
              <div className="xl:sticky xl:top-24">
                {selectedTransfer ? <TransferDecisionPanel transfer={selectedTransfer} onDecisionSuccess={() => fetchTransfersData()} userRole={role} headers={getAuthHeaders()} /> : <EmptyState title="Select a mission" description="Choose a transfer route to review command actions." />}
              </div>
            </div>}
        </div>
      </section>

      {isOptimizerOpen && <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Optimization command panel">
        <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-label="Close optimization panel" onClick={() => setIsOptimizerOpen(false)} />
        <div className="relative w-full max-w-xl h-full bg-theme-bg border-l border-theme-border p-5 md:p-7 overflow-y-auto animate-slide-up">
          <div className="flex items-start justify-between mb-7"><div><span className="eyebrow">Optimization command</span><h2 className="text-2xl mt-2">Build a mission set</h2><p className="text-xs text-theme-muted mt-2">Define operational limits, then let the solver rank safe stock movements.</p></div><button className="p-2 rounded-lg border border-theme-border" aria-label="Close optimizer" onClick={() => setIsOptimizerOpen(false)}><X size={17} /></button></div>
          <OptimizerForm currentDistrict={queryDistrict || district} onRunOptimizer={(request) => { handleRunOptimizer(request); setIsOptimizerOpen(false); }} isLoading={isOptimizing} disabled={isReadOnly} />
          <div className="mt-5 p-4 rounded-xl border border-theme-border bg-theme-surface text-xs text-theme-muted flex gap-3"><Sparkles size={17} className="text-theme-primary shrink-0" /><p>Every mission preserves the configured donor safety floor before ranking recipient impact, time, and cost.</p></div>
        </div>
      </div>}
    </div>
  );
};
