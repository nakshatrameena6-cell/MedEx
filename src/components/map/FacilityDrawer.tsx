import React, { useEffect, useState } from 'react';
import { FacilityStatus } from '../../types/api';
import { getFacilityStatus } from '../../services/facilitiesService';
import { useAuthRole } from '../../context/AuthRoleContext';
import { Drawer } from '../common/Drawer';
import { StatusBadge } from '../common/StatusBadge';
import { Skeleton } from '../common/Skeleton';
import { ErrorState } from '../common/ErrorState';
import {
  Bed,
  Users,
  Pill,
  Bell,
  Clock,
  ShieldCheck,
  Building2,
  Calendar,
} from 'lucide-react';

interface FacilityDrawerProps {
  facilityId: string | null;
  onClose: () => void;
}

export const FacilityDrawer: React.FC<FacilityDrawerProps> = ({
  facilityId,
  onClose,
}) => {
  const { role, district, user, isMockMode } = useAuthRole();
  const [statusData, setStatusData] = useState<FacilityStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!facilityId) {
      setStatusData(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const headers: Record<string, string> = {
      'X-Role': role,
      'X-District': district,
      'X-User': user,
    };
    if (isMockMode) {
      headers['X-Mock'] = 'true';
    }

    getFacilityStatus(facilityId, headers)
      .then((data) => {
        if (isMounted) {
          setStatusData(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to fetch facility status');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [facilityId, role, district, user, isMockMode]);

  if (!facilityId) return null;

  return (
    <Drawer
      isOpen={!!facilityId}
      onClose={onClose}
      title={statusData?.facility?.name || `Facility Details (${facilityId})`}
      subtitle={`GET /facilities/${facilityId}/status`}
      width="lg"
    >
      {isLoading ? (
        <div className="space-y-4 p-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
          <Skeleton className="h-40" />
        </div>
      ) : error ? (
        <ErrorState
          title="Facility Status Unavailable"
          message={error}
          onRetry={() => {
            if (facilityId) {
              setIsLoading(true);
              setError(null);
              getFacilityStatus(facilityId, {
                'X-Role': role,
                'X-District': district,
                'X-User': user,
                ...(isMockMode ? { 'X-Mock': 'true' } : {}),
              })
                .then(setStatusData)
                .catch((e) => setError(e.message))
                .finally(() => setIsLoading(false));
            }
          }}
        />
      ) : statusData ? (
        <div className="space-y-5 font-sans">
          {/* Facility Top Summary Card */}
          <div className="medex-panel p-4 bg-medex-surface/80 border-medex-border space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-medex-cyan" />
                <span className="text-xs font-mono font-bold text-medex-primary">
                  {statusData.facility.facility_id}
                </span>
                <span className="text-2xs font-mono px-2 py-0.5 rounded bg-medex-elevated border border-medex-border text-medex-secondary font-semibold">
                  {statusData.facility.type}
                </span>
              </div>
              <StatusBadge status={statusData.facility.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-2xs font-mono pt-2 border-t border-medex-border-subtle">
              <div>
                <span className="text-medex-muted block">BLOCK / DISTRICT:</span>
                <span className="text-medex-primary font-semibold">
                  {statusData.facility.block || '—'} / {statusData.facility.district_id}
                </span>
              </div>
              <div>
                <span className="text-medex-muted block">POPULATION SERVED:</span>
                <span className="text-medex-primary font-semibold">
                  {statusData.facility.population_served
                    ? statusData.facility.population_served.toLocaleString()
                    : '—'}
                </span>
              </div>
              <div>
                <span className="text-medex-muted block">VULNERABILITY WEIGHT:</span>
                <span className="text-medex-cyan font-bold">
                  {statusData.facility.vulnerability_weight || 1.0}
                </span>
              </div>
              <div>
                <span className="text-medex-muted block">LAST REPORTED:</span>
                <span className="text-medex-secondary">
                  {statusData.facility.last_report_at
                    ? new Date(statusData.facility.last_report_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Operational Headroom KPI Cards (Beds, Attendance, Alerts) */}
          <div className="grid grid-cols-3 gap-3">
            {/* Beds */}
            <div className="medex-panel p-3 bg-medex-surface/50 border-medex-border text-center">
              <div className="flex items-center justify-center text-medex-cyan mb-1">
                <Bed className="w-4 h-4" />
              </div>
              <span className="text-2xs font-mono text-medex-muted uppercase block">
                Beds Occupied
              </span>
              <span className="text-base font-bold font-mono text-medex-primary mt-0.5 block">
                {statusData.beds.occupied} / {statusData.beds.total}
              </span>
              <span className="text-2xs font-mono text-medex-secondary">
                ({statusData.beds.occupancy_pct}%)
              </span>
            </div>

            {/* Attendance */}
            <div className="medex-panel p-3 bg-medex-surface/50 border-medex-border text-center">
              <div className="flex items-center justify-center text-medex-green mb-1">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-2xs font-mono text-medex-muted uppercase block">
                Staff Present
              </span>
              <span className="text-base font-bold font-mono text-medex-primary mt-0.5 block">
                {statusData.attendance.present} / {statusData.attendance.sanctioned}
              </span>
              <span className="text-2xs font-mono text-medex-secondary">
                ({statusData.attendance.present_pct}%)
              </span>
            </div>

            {/* Alerts */}
            <div className="medex-panel p-3 bg-medex-surface/50 border-medex-border text-center">
              <div className="flex items-center justify-center text-medex-amber mb-1">
                <Bell className="w-4 h-4" />
              </div>
              <span className="text-2xs font-mono text-medex-muted uppercase block">
                Open Alerts
              </span>
              <span className="text-base font-bold font-mono text-medex-amber-light mt-0.5 block">
                {statusData.open_alerts}
              </span>
              <span className="text-2xs font-mono text-medex-muted">Active</span>
            </div>
          </div>

          {/* Medicine Stock List */}
          <div className="medex-panel p-4 bg-medex-surface/80 border-medex-border space-y-3">
            <div className="flex items-center justify-between border-b border-medex-border pb-2">
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-medex-cyan" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-medex-primary font-mono">
                  Essential Medicine Inventory
                </h4>
              </div>
              <span className="text-2xs font-mono text-medex-muted">
                {statusData.stock.length} Items
              </span>
            </div>

            <div className="space-y-2.5 divide-y divide-medex-border-subtle">
              {statusData.stock.map((item) => (
                <div key={item.drug_code} className="pt-2.5 first:pt-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold text-medex-primary block">
                        {item.drug_name} ({item.drug_code})
                      </span>
                      <div className="flex items-center gap-3 text-2xs font-mono text-medex-secondary mt-0.5">
                        <span>
                          Usable Stock:{' '}
                          <strong className="text-medex-primary">
                            {item.usable_qty.toLocaleString()} {item.unit}
                          </strong>
                        </span>
                        {item.nearest_expiry && (
                          <span className="flex items-center gap-1 text-medex-muted">
                            <Calendar className="w-3 h-3" />
                            Exp: {item.nearest_expiry}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={item.status} size="sm" />
                      <span className="text-2xs font-mono text-medex-secondary">
                        <strong className="text-medex-primary font-bold">
                          {item.cover_days}
                        </strong>{' '}
                        days cover
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-2xs font-mono text-medex-muted flex items-center justify-between px-1 pt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              As of: {new Date(statusData.as_of).toLocaleTimeString()}
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-medex-cyan" />
              Contract Verified
            </span>
          </div>
        </div>
      ) : null}
    </Drawer>
  );
};
