import { isAxiosError } from 'axios';
import {
  ExceptionResponse,
  ResponseMethod,
  SuccessResponse,
} from '../../../common/api/responses';
import { resolveClinicId } from '../../../common/components/ClinicId';
import { apiClient } from '../../../common/services/api-client';
import { useAuthStore } from '../../../common/store/authStore';
import { DashboardResponseModel } from './types';

const DASHBOARD_ENDPOINT = '/api/dmd/dashboard/get-dashboard';
const dashboardRequestCache = new Map<string, Promise<DashboardResponseModel>>();
const dashboardResponseCache = new Map<
  string,
  {
    data: DashboardResponseModel;
    cachedAt: number;
  }
>();
const DASHBOARD_RESPONSE_CACHE_TTL_MS = 5000;

export const GetDashboard = async (
  clinicId?: string | null,
  forceRefresh: boolean = false
): Promise<DashboardResponseModel> => {
  const resolvedClinicId = resolveClinicId(clinicId);
  const branchId = useAuthStore.getState().branchId?.trim() || '';
  const clinicKey = `${String(resolvedClinicId ?? 'current-clinic')}|${branchId || 'all-branches'}`;

  if (forceRefresh) {
    dashboardResponseCache.delete(clinicKey);
  }

  const cachedResponse = dashboardResponseCache.get(clinicKey);
  if (
    cachedResponse &&
    Date.now() - cachedResponse.cachedAt < DASHBOARD_RESPONSE_CACHE_TTL_MS
  ) {
    return cachedResponse.data;
  }

  const activeRequest = dashboardRequestCache.get(clinicKey);
  if (activeRequest) {
    return activeRequest;
  }

  const request = (async (): Promise<DashboardResponseModel> => {
    try {
      const response = await apiClient.get<DashboardResponseModel>(DASHBOARD_ENDPOINT, {
        params: {
          ClinicId: resolvedClinicId ?? undefined,
          BranchId: branchId || undefined,
        },
      });

      const responseData =
        SuccessResponse(response, ResponseMethod.Fetch, undefined, false) || {
          totalPatients: 0,
          patientsToday: 0,
          scheduledAppointments: 0,
          pendingAppointments: 0,
          incomeToday: 0,
          totalIncomeMonthly: 0,
          totalExpenseMonthly: 0,
          latestPatients: [],
          addPatients: false,
          addAppointment: false,
          monthlyIncome: [],
          monthlyRevenue: [],
          nextDayAppointment: [],
          todayAppointment: [],
          clinicId: resolvedClinicId,
        };

      dashboardResponseCache.set(clinicKey, {
        data: responseData,
        cachedAt: Date.now(),
      });

      return responseData;
    } catch (error) {
      if (isAxiosError(error)) {
        await ExceptionResponse(error);
      }
      throw error;
    } finally {
      dashboardRequestCache.delete(clinicKey);
    }
  })();

  dashboardRequestCache.set(clinicKey, request);
  return request;
};
