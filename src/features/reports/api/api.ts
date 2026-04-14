import { isAxiosError } from 'axios';

import { ExceptionResponse, ResponseMethod, SuccessResponse } from '../../../common/api/responses';
import { apiClient } from '../../../common/services/api-client';
import { useAuthStore } from '../../../common/store/authStore';
import type {
  AppointmentFunnelModel,
  AppointmentVolumeModel,
  ExpenseBreakdownModel,
  OutstandingBalancesModel,
  PatientDemographicsModel,
  PatientGrowthModel,
  ProfitLossModel,
  ReportFilter,
  RevenueSummaryModel,
} from './types';

const BASE = '/api/dmd/reports';
const CACHE_TTL_MS = 5000;

const requestCache = new Map<string, Promise<unknown>>();
const responseCache = new Map<string, { data: unknown; cachedAt: number }>();

async function fetchReport<T>(
  endpoint: string,
  params: Record<string, string | undefined>,
  forceRefresh = false
): Promise<T> {
  const key = `${endpoint}:${JSON.stringify(params)}`;

  if (forceRefresh) {
    responseCache.delete(key);
  }

  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached.data as T;
  }

  const active = requestCache.get(key);
  if (active) return active as Promise<T>;

  const req = (async (): Promise<T> => {
    try {
      const response = await apiClient.get<T>(endpoint, {
        params: Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined)),
      });
      const data = SuccessResponse(response, ResponseMethod.Fetch, undefined, false) as T;
      responseCache.set(key, { data, cachedAt: Date.now() });
      return data;
    } catch (error) {
      if (isAxiosError(error)) {
        await ExceptionResponse(error);
      }
      throw error;
    } finally {
      requestCache.delete(key);
    }
  })();

  requestCache.set(key, req);
  return req;
}

function buildParams(clinicId: string | null | undefined, filter?: ReportFilter): Record<string, string | undefined> {
  const branchId = useAuthStore.getState().branchId?.trim() || undefined;
  return {
    ClinicId: clinicId ?? undefined,
    BranchId: filter?.branchId || branchId || undefined,
    DateFrom: filter?.dateFrom || undefined,
    DateTo: filter?.dateTo || undefined,
  };
}

// ── Finance ───────────────────────────────────────────────────────────────

export const GetRevenueSummary = (
  clinicId?: string | null,
  filter?: ReportFilter,
  forceRefresh = false
): Promise<RevenueSummaryModel> =>
  fetchReport<RevenueSummaryModel>(`${BASE}/revenue-summary`, buildParams(clinicId, filter), forceRefresh);

export const GetExpenseBreakdown = (
  clinicId?: string | null,
  filter?: ReportFilter,
  forceRefresh = false
): Promise<ExpenseBreakdownModel> =>
  fetchReport<ExpenseBreakdownModel>(`${BASE}/expense-breakdown`, buildParams(clinicId, filter), forceRefresh);

export const GetOutstandingBalances = (
  clinicId?: string | null,
  filter?: ReportFilter,
  forceRefresh = false
): Promise<OutstandingBalancesModel> =>
  fetchReport<OutstandingBalancesModel>(
    `${BASE}/outstanding-balances`,
    { ClinicId: clinicId ?? undefined, BranchId: filter?.branchId || useAuthStore.getState().branchId?.trim() || undefined },
    forceRefresh
  );

export const GetProfitLoss = (
  clinicId?: string | null,
  filter?: ReportFilter,
  forceRefresh = false
): Promise<ProfitLossModel> =>
  fetchReport<ProfitLossModel>(`${BASE}/profit-loss`, buildParams(clinicId, filter), forceRefresh);

// ── Patient ───────────────────────────────────────────────────────────────

export const GetPatientGrowth = (
  clinicId?: string | null,
  filter?: ReportFilter,
  forceRefresh = false
): Promise<PatientGrowthModel> =>
  fetchReport<PatientGrowthModel>(`${BASE}/patient-growth`, buildParams(clinicId, filter), forceRefresh);

export const GetPatientDemographics = (
  clinicId?: string | null,
  filter?: ReportFilter,
  forceRefresh = false
): Promise<PatientDemographicsModel> =>
  fetchReport<PatientDemographicsModel>(
    `${BASE}/patient-demographics`,
    { ClinicId: clinicId ?? undefined, BranchId: filter?.branchId || useAuthStore.getState().branchId?.trim() || undefined },
    forceRefresh
  );

// ── Appointment ───────────────────────────────────────────────────────────

export const GetAppointmentVolume = (
  clinicId?: string | null,
  filter?: ReportFilter,
  forceRefresh = false
): Promise<AppointmentVolumeModel> =>
  fetchReport<AppointmentVolumeModel>(`${BASE}/appointment-volume`, buildParams(clinicId, filter), forceRefresh);

export const GetAppointmentFunnel = (
  clinicId?: string | null,
  filter?: ReportFilter,
  forceRefresh = false
): Promise<AppointmentFunnelModel> =>
  fetchReport<AppointmentFunnelModel>(`${BASE}/appointment-funnel`, buildParams(clinicId, filter), forceRefresh);
