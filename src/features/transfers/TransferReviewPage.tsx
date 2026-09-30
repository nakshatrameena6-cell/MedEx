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
import { COPY } from '../../constants/copy';
import { Select } from '../../components/common/Select';
import { RefreshCw, X, RotateCcw } from 'lucide-react';
import { Card3D } from '../../components/3d/Card3D';

import { useToast } from '../../context/ToastContext';

export const TransferReviewPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { role, district, user, isMockMode } = useAuthRole();
  const toast = useToast();

  const queryDistrict = searchParams.get('district_id');
  const queryDrug = searchParams.get('drug_code');

  const [filterState, setFilterState] = useState<TransferState | 'ALL'>('ALL');
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
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

  return (
    <div className="space-y-6 font-sans text-theme-text">
      {/* Page Header */}
      <div className="relative">
        <PageHeader
          title={COPY.headers.transfersTitle}
          subtitle={`${transfers.length} stock reallocation proposals active in District ${district}`}
          activeFilterCount={activeFilterCount}
          onToggleFilters={() => setIsFilterPopoverOpen(!isFilterPopoverOpen)}
          actionSlot={
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={() => fetchTransfersData(true)}
              isLoading={isLoadingTransfers}
            >
              {COPY.actions.refresh}
            </Button>
          }
        />

        {/* Filters Popover */}
        {isFilterPopoverOpen && (
          <div
            ref={popoverRef}
            className="absolute right-0 top-12 z-30 w-80 bg-theme-surface border border-theme-border rounded-xl shadow-xl p-4 space-y-4 font-sans animate-fade-in text-theme-text"
          >
            <div className="flex items-center justify-between border-b border-theme-border pb-2">
              <h3 className="text-[14px] font-semibold text-theme-text">Filter Proposals</h3>
              <button
                type="button"
                onClick={() => setIsFilterPopoverOpen(false)}
                className="p-1 rounded text-theme-muted hover:text-theme-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <Select
                label="Transfer State"
                value={filterState}
                onChange={(val) => setFilterState(val as any)}
                options={[
                  { value: 'ALL', label: 'All States' },
                  { value: 'OPEN', label: 'OPEN' },
                  { value: 'APPROVED', label: 'APPROVED' },
                  { value: 'REJECTED', label: 'REJECTED' },
                  { value: 'ESCALATED', label: 'ESCALATED' },
                  { value: 'CLOSED', label: 'CLOSED' },
                ]}
              />
            </div>

            <div className="pt-2 border-t border-theme-border flex items-center justify-between">
              <button
                type="button"
                onClick={() => setFilterState('ALL')}
                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-theme-muted hover:text-theme-primary transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              <Button variant="primary" size="sm" onClick={() => setIsFilterPopoverOpen(false)}>
                Apply
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Max 3 KPI Cards */}
      {isLoadingTransfers ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Open Proposals (Hero Card) */}
          <Card3D glowColor="rgba(45, 212, 191, 0.28)">
            <div className="p-5 font-sans flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-theme-primary font-bold tracking-wider">[01]</span>
                  <span className="text-[13px] font-medium text-theme-muted">Open Proposals</span>
                </div>
                <StatusBadge status="CYAN" label="Active" size="sm" />
              </div>
              <div className="flex items-baseline gap-2 pt-1">
                <span className="metric-value text-[40px] font-medium text-theme-primary leading-none tracking-tight font-mono">
                  {openCount}
                </span>
                <span className="text-[12px] font-mono text-theme-muted">proposals</span>
              </div>
              <div className="pt-2 border-t border-theme-border flex items-center justify-between text-[11px] text-theme-muted">
                <span>OR-Tools solver solutions</span>
                <span className="font-mono text-[9px] text-theme-primary font-bold uppercase tracking-wider">
                  SOLVER READY
                </span>
              </div>
            </div>
          </Card3D>

          {/* Card 2: Average ETA */}
          <Card3D glowColor="rgba(56, 189, 248, 0.25)">
            <div className="p-5 font-sans flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-theme-primary font-bold tracking-wider">[02]</span>
                  <span className="text-[13px] font-medium text-theme-muted">Average Transit ETA</span>
                </div>
                <span className="font-mono text-[10px] text-theme-muted bg-white/[0.05] px-2 py-0.5 rounded border border-theme-border">
                  P50 TRANSIT
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 pt-1">
                <span className="metric-value text-[40px] font-medium text-theme-text leading-none tracking-tight font-mono">
                  {avgEta}
                </span>
                <span className="text-[13px] font-mono text-theme-muted">hours</span>
              </div>
              <div className="pt-2 border-t border-theme-border flex items-center justify-between text-[11px] text-theme-muted">
                <span>Fleet dispatch window</span>
                <span className="font-mono text-[9px] text-theme-primary font-bold uppercase tracking-wider">
                  IN NETWORK
                </span>
              </div>
            </div>
          </Card3D>

          {/* Card 3: Reallocation Qty */}
          <Card3D glowColor="rgba(16, 185, 129, 0.25)">
            <div className="p-5 font-sans flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-theme-healthy-text font-bold tracking-wider">[03]</span>
                  <span className="text-[13px] font-medium text-theme-muted">Total Reallocated Qty</span>
                </div>
                <span className="font-mono text-[10px] text-theme-muted bg-white/[0.05] px-2 py-0.5 rounded border border-theme-border">
                  TOTAL BUFFER
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 pt-1">
                <span className="metric-value text-[40px] font-medium text-theme-text leading-none tracking-tight font-mono">
                  {totalQty.toLocaleString()}
                </span>
                <span className="text-[13px] font-mono text-theme-muted">units</span>
              </div>
              <div className="pt-2 border-t border-theme-border flex items-center justify-between text-[11px] text-theme-muted">
                <span>Balancing stock across depots</span>
                <span className="font-mono text-[9px] text-theme-healthy-text font-bold uppercase tracking-wider">
                  OPTIMIZED
                </span>
              </div>
            </div>
          </Card3D>
        </div>
      )}

      {/* Split Layout: Left Form & Proposals List | Right Map Visual */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5/12) */}
        <div className="lg:col-span-5 space-y-6">
          <OptimizerForm
            currentDistrict={queryDistrict || district}
            onRunOptimizer={handleRunOptimizer}
            isLoading={isOptimizing}
            disabled={isReadOnly}
          />

          {errorMsg && (
            <ErrorState
              title="Optimizer Error"
              message={errorMsg}
              onRetry={fetchTransfersData}
            />
          )}

          {isLoadingTransfers ? (
            <div className="space-y-3">
              <Skeleton className="w-full h-32 rounded-lg" />
              <Skeleton className="w-full h-32 rounded-lg" />
            </div>
          ) : transfers.length === 0 ? (
            <EmptyState
              title={solverStatus === 'INFEASIBLE' ? 'No Feasible Proposals' : 'No Transfers Found'}
              description={
                solverStatus === 'INFEASIBLE'
                  ? 'No route met floor cover constraints (≥14d) and vehicle limits.'
                  : 'No transfer proposals match the selected filter parameters.'
              }
            />
          ) : (
            <div className="space-y-4">
              {transfers.map((t) => (
                <ProposalCard
                  key={t.transfer_id}
                  transfer={t}
                  isSelected={selectedTransfer?.transfer_id === t.transfer_id}
                  onSelect={(selected) => setSelectedTransfer(selected)}
                />
              ))}
            </div>
          )}

          {selectedTransfer && (
            <TransferDecisionPanel
              transfer={selectedTransfer}
              onDecisionSuccess={() => fetchTransfersData()}
              userRole={role}
              headers={getAuthHeaders()}
            />
          )}
        </div>

        {/* Right Column (7/12): Main Map Visual */}
        <div className="lg:col-span-7 sticky top-20 space-y-4">
          <div className="rounded-lg border border-theme-border bg-theme-surface overflow-hidden h-[600px] relative">
            <FacilityMap
              facilities={facilities}
              selectedFacilityId={selectedTransfer?.to.facility_id || null}
              onSelectFacility={() => {}}
              activePolyline={selectedTransfer?.route?.polyline || null}
              transferRoute={
                selectedTransfer
                  ? {
                      from: {
                        lat: selectedTransfer.from.lat,
                        lng: selectedTransfer.from.lng,
                        name: selectedTransfer.from.name,
                        facility_id: selectedTransfer.from.facility_id,
                      },
                      to: {
                        lat: selectedTransfer.to.lat,
                        lng: selectedTransfer.to.lng,
                        name: selectedTransfer.to.name,
                        facility_id: selectedTransfer.to.facility_id,
                      },
                      polyline: selectedTransfer.route?.polyline || null,
                    }
                  : null
              }
              showControls={true}
              showLegend={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
