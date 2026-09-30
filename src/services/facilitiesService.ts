import { FacilityList, FacilityStatus, Facility, RiskStatus, FacilityType } from '../types/api';
import { fetchApi } from './apiClient';

export interface ListFacilitiesParams {
  district_id?: string;
  drug_code?: string;
  status?: RiskStatus;
  type?: FacilityType;
}

// Contract-backed fixtures matching openapi.yaml schema & PRD specs
const FIXTURE_FACILITIES: Facility[] = [
  {
    facility_id: 'TN-PHC-014',
    name: 'PHC Sample-014',
    type: 'PHC',
    state_code: 'TN',
    district_id: 'TN-D01',
    block: 'Block-A',
    lat: 10.792,
    lng: 78.704,
    population_served: 18500,
    vulnerability_weight: 1.8,
    status: 'RED',
    last_report_at: '2026-09-29T05:10:00Z',
  },
  {
    facility_id: 'TN-PHC-021',
    name: 'PHC Sample-021',
    type: 'PHC',
    state_code: 'TN',
    district_id: 'TN-D01',
    block: 'Block-B',
    lat: 10.835,
    lng: 78.752,
    population_served: 22000,
    vulnerability_weight: 1.0,
    status: 'GREEN',
    last_report_at: '2026-09-29T04:45:00Z',
  },
  {
    facility_id: 'TN-CHC-003',
    name: 'CHC Sample-003',
    type: 'CHC',
    state_code: 'TN',
    district_id: 'TN-D01',
    block: 'Block-A',
    lat: 10.812,
    lng: 78.688,
    population_served: 45000,
    vulnerability_weight: 1.2,
    status: 'AMBER',
    last_report_at: '2026-09-29T06:00:00Z',
  },
  {
    facility_id: 'TN-PHC-031',
    name: 'PHC Sample-031',
    type: 'PHC',
    state_code: 'TN',
    district_id: 'TN-D01',
    block: 'Block-C',
    lat: 10.745,
    lng: 78.631,
    population_served: 16200,
    vulnerability_weight: 1.5,
    status: 'AMBER',
    last_report_at: '2026-09-29T05:30:00Z',
  },
  {
    facility_id: 'TN-PHC-042',
    name: 'PHC Sample-042',
    type: 'PHC',
    state_code: 'TN',
    district_id: 'TN-D01',
    block: 'Block-B',
    lat: 10.871,
    lng: 78.815,
    population_served: 19800,
    vulnerability_weight: 1.9,
    status: 'RED',
    last_report_at: '2026-09-29T04:15:00Z',
  },
  {
    facility_id: 'TN-WHS-001',
    name: 'Central District Warehouse-01',
    type: 'WAREHOUSE',
    state_code: 'TN',
    district_id: 'TN-D01',
    block: 'Central',
    lat: 10.798,
    lng: 78.718,
    population_served: 350000,
    vulnerability_weight: 1.0,
    status: 'GREEN',
    last_report_at: '2026-09-29T06:20:00Z',
  },
  {
    facility_id: 'TN-PHC-055',
    name: 'PHC Sample-055',
    type: 'PHC',
    state_code: 'TN',
    district_id: 'TN-D01',
    block: 'Block-C',
    lat: 10.718,
    lng: 78.585,
    population_served: 14100,
    vulnerability_weight: 1.1,
    status: 'GREEN',
    last_report_at: '2026-09-29T05:50:00Z',
  },
  {
    facility_id: 'TN-CHC-008',
    name: 'CHC Sample-008',
    type: 'CHC',
    state_code: 'TN',
    district_id: 'TN-D01',
    block: 'Block-B',
    lat: 10.852,
    lng: 78.790,
    population_served: 38000,
    vulnerability_weight: 1.3,
    status: 'GREEN',
    last_report_at: '2026-09-29T06:10:00Z',
  },
];

const FIXTURE_STATUSES: Record<string, FacilityStatus> = {
  'TN-PHC-014': {
    as_of: '2026-09-29T06:30:00Z',
    facility: FIXTURE_FACILITIES[0],
    stock: [
      {
        drug_code: 'ORS',
        drug_name: 'Oral Rehydration Salts',
        unit: 'sachets',
        stock_qty: 120,
        usable_qty: 120,
        nearest_expiry: '2027-03-31',
        cover_days: 5.1,
        status: 'RED',
        last_updated_at: '2026-09-29T05:10:00Z',
      },
      {
        drug_code: 'PARA500',
        drug_name: 'Paracetamol 500 mg',
        unit: 'tablets',
        stock_qty: 800,
        usable_qty: 800,
        nearest_expiry: '2027-08-31',
        cover_days: 41.0,
        status: 'GREEN',
        last_updated_at: '2026-09-29T05:10:00Z',
      },
      {
        drug_code: 'AMOX500',
        drug_name: 'Amoxicillin 500mg',
        unit: 'capsules',
        stock_qty: 320,
        usable_qty: 320,
        nearest_expiry: '2026-12-15',
        cover_days: 11.2,
        status: 'AMBER',
        last_updated_at: '2026-09-29T05:10:00Z',
      },
    ],
    beds: { total: 10, occupied: 6, occupancy_pct: 60.0 },
    attendance: { date: '2026-09-29', sanctioned: 8, present: 6, present_pct: 75.0 },
    open_alerts: 2,
  },
  'TN-CHC-003': {
    as_of: '2026-09-29T06:30:00Z',
    facility: FIXTURE_FACILITIES[2],
    stock: [
      {
        drug_code: 'ORS',
        drug_name: 'Oral Rehydration Salts',
        unit: 'sachets',
        stock_qty: 2400,
        usable_qty: 2400,
        nearest_expiry: '2027-06-30',
        cover_days: 42.0,
        status: 'GREEN',
        last_updated_at: '2026-09-29T06:00:00Z',
      },
      {
        drug_code: 'PARA500',
        drug_name: 'Paracetamol 500 mg',
        unit: 'tablets',
        stock_qty: 1200,
        usable_qty: 1150,
        nearest_expiry: '2026-11-20',
        cover_days: 14.5,
        status: 'AMBER',
        last_updated_at: '2026-09-29T06:00:00Z',
      },
    ],
    beds: { total: 30, occupied: 19, occupancy_pct: 63.3 },
    attendance: { date: '2026-09-29', sanctioned: 18, present: 16, present_pct: 88.9 },
    open_alerts: 1,
  },
};

export async function listFacilities(
  params: ListFacilitiesParams,
  headers: Record<string, string> = {}
): Promise<FacilityList> {
  return fetchApi<FacilityList>(
    '/facilities',
    { params, headers },
    () => {
      let filtered = [...FIXTURE_FACILITIES];

      if (params.district_id && params.district_id !== 'ALL') {
        filtered = filtered.filter((f) => f.district_id === params.district_id);
      }
      if (params.status) {
        filtered = filtered.filter((f) => f.status === params.status);
      }
      if (params.type) {
        filtered = filtered.filter((f) => f.type === params.type);
      }

      return {
        as_of: '2026-09-29T06:30:00Z',
        items: filtered,
      };
    }
  );
}

export async function getFacilityStatus(
  facilityId: string,
  headers: Record<string, string> = {}
): Promise<FacilityStatus> {
  return fetchApi<FacilityStatus>(
    `/facilities/${facilityId}/status`,
    { headers },
    () => {
      const statusFixture = FIXTURE_STATUSES[facilityId];
      if (statusFixture) return statusFixture;

      // Fallback generator for facilities not explicitly in dictionary
      const facility = FIXTURE_FACILITIES.find((f) => f.facility_id === facilityId) || {
        facility_id: facilityId,
        name: `Facility ${facilityId}`,
        type: 'PHC' as FacilityType,
        state_code: 'TN',
        district_id: 'TN-D01',
        lat: 10.80,
        lng: 78.70,
        status: 'GREEN' as RiskStatus,
      };

      return {
        as_of: new Date().toISOString(),
        facility,
        stock: [
          {
            drug_code: 'ORS',
            drug_name: 'Oral Rehydration Salts',
            unit: 'sachets',
            stock_qty: 650,
            usable_qty: 650,
            nearest_expiry: '2027-05-31',
            cover_days: 24.0,
            status: 'GREEN',
            last_updated_at: new Date().toISOString(),
          },
          {
            drug_code: 'PARA500',
            drug_name: 'Paracetamol 500 mg',
            unit: 'tablets',
            stock_qty: 1500,
            usable_qty: 1500,
            nearest_expiry: '2027-09-30',
            cover_days: 35.0,
            status: 'GREEN',
            last_updated_at: new Date().toISOString(),
          },
        ],
        beds: { total: 12, occupied: 5, occupancy_pct: 41.7 },
        attendance: { date: new Date().toISOString().split('T')[0], sanctioned: 10, present: 9, present_pct: 90.0 },
        open_alerts: 0,
      };
    }
  );
}
