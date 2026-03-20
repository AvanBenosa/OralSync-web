import { isAxiosError } from 'axios';
import { apiClient } from '../../../common/services/api-client';
import { ExceptionResponse } from '../../../common/api/responses';
import {
  AdminClinicLockRequest,
  AdminClinicModel,
  AdminDashboardModel,
  AdminUserModel,
} from './types';

const ADMIN_CLINICS_ENDPOINT =
  process.env.REACT_APP_ADMIN_CLINICS_ENDPOINT || '/api/dmd/admin/get-clinics';
const ADMIN_USERS_ENDPOINT =
  process.env.REACT_APP_ADMIN_USERS_ENDPOINT || '/api/dmd/admin/get-users';
const ADMIN_CLINIC_LOCK_ENDPOINT =
  process.env.REACT_APP_ADMIN_CLINIC_LOCK_ENDPOINT || '/api/dmd/admin/set-clinic-lock';
const ADMIN_DASHBOARD_ENDPOINT =
  process.env.REACT_APP_ADMIN_DASHBOARD_ENDPOINT || '/api/dmd/admin/dashboard-summary';
const ADMIN_RESPONSE_CACHE_TTL_MS = 5000;

const adminRequestCache = new Map<string, Promise<unknown>>();
const adminResponseCache = new Map<
  string,
  {
    data: unknown;
    cachedAt: number;
  }
>();

const getCachedValue = <T,>(key: string): T | null => {
  const cached = adminResponseCache.get(key);
  if (!cached || Date.now() - cached.cachedAt >= ADMIN_RESPONSE_CACHE_TTL_MS) {
    return null;
  }

  return cached.data as T;
};

const setCachedValue = <T,>(key: string, data: T): void => {
  adminResponseCache.set(key, {
    data,
    cachedAt: Date.now(),
  });
};

export const getAdminClinics = async (forceRefresh: boolean = false): Promise<AdminClinicModel[]> => {
  const requestKey = 'admin-clinics';

  if (forceRefresh) {
    adminResponseCache.delete(requestKey);
  }

  const cachedValue = getCachedValue<AdminClinicModel[]>(requestKey);
  if (cachedValue) {
    return cachedValue;
  }

  const activeRequest = adminRequestCache.get(requestKey);
  if (activeRequest) {
    return activeRequest as Promise<AdminClinicModel[]>;
  }

  const request = (async (): Promise<AdminClinicModel[]> => {
    try {
      const response = await apiClient.get<AdminClinicModel[]>(ADMIN_CLINICS_ENDPOINT);
      const items = response.data || [];
      setCachedValue(requestKey, items);
      return items;
    } catch (error) {
      if (isAxiosError(error)) {
        await ExceptionResponse(error);
      }
      throw error;
    } finally {
      adminRequestCache.delete(requestKey);
    }
  })();

  adminRequestCache.set(requestKey, request);
  return request;
};

export const getAdminDashboard = async (
  forceRefresh: boolean = false
): Promise<AdminDashboardModel> => {
  const requestKey = 'admin-dashboard';

  if (forceRefresh) {
    adminResponseCache.delete(requestKey);
  }

  const cachedValue = getCachedValue<AdminDashboardModel>(requestKey);
  if (cachedValue) {
    return cachedValue;
  }

  const activeRequest = adminRequestCache.get(requestKey);
  if (activeRequest) {
    return activeRequest as Promise<AdminDashboardModel>;
  }

  const request = (async (): Promise<AdminDashboardModel> => {
    try {
      const response = await apiClient.get<AdminDashboardModel>(ADMIN_DASHBOARD_ENDPOINT);
      const item = response.data || {
        totalClinics: 0,
        totalDoctors: 0,
        totalPatients: 0,
        clinics: [],
        dailyPatientTrends: [],
        owners: [],
      };
      setCachedValue(requestKey, item);
      return item;
    } catch (error) {
      if (isAxiosError(error)) {
        await ExceptionResponse(error);
      }
      throw error;
    } finally {
      adminRequestCache.delete(requestKey);
    }
  })();

  adminRequestCache.set(requestKey, request);
  return request;
};

export const getAdminUsers = async (forceRefresh: boolean = false): Promise<AdminUserModel[]> => {
  const requestKey = 'admin-users';

  if (forceRefresh) {
    adminResponseCache.delete(requestKey);
  }

  const cachedValue = getCachedValue<AdminUserModel[]>(requestKey);
  if (cachedValue) {
    return cachedValue;
  }

  const activeRequest = adminRequestCache.get(requestKey);
  if (activeRequest) {
    return activeRequest as Promise<AdminUserModel[]>;
  }

  const request = (async (): Promise<AdminUserModel[]> => {
    try {
      const response = await apiClient.get<AdminUserModel[]>(ADMIN_USERS_ENDPOINT);
      const items = response.data || [];
      setCachedValue(requestKey, items);
      return items;
    } catch (error) {
      if (isAxiosError(error)) {
        await ExceptionResponse(error);
      }
      throw error;
    } finally {
      adminRequestCache.delete(requestKey);
    }
  })();

  adminRequestCache.set(requestKey, request);
  return request;
};

export const updateClinicLockStatus = async (
  request: AdminClinicLockRequest
): Promise<AdminClinicModel> => {
  try {
    const response = await apiClient.post<AdminClinicModel>(ADMIN_CLINIC_LOCK_ENDPOINT, request);
    adminResponseCache.delete('admin-clinics');
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};
