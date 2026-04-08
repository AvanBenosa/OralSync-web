import { isAxiosError } from 'axios';
import { apiClient } from '../../../common/services/api-client';
import { ExceptionResponse } from '../../../common/api/responses';
import {
  AdminClinicLockRequest,
  AdminClinicManualPaymentModel,
  AdminClinicManualPaymentStatusRequest,
  AdminClinicModel,
  AdminClinicSubscriptionHistoryDeleteRequest,
  AdminClinicSubscriptionHistoryModel,
  AdminClinicSubscriptionHistoryRequest,
  AdminDashboardModel,
  AdminUserModel,
} from './types';

const ADMIN_CLINICS_ENDPOINT =
  process.env.REACT_APP_ADMIN_CLINICS_ENDPOINT || '/api/dmd/admin/get-clinics';
const ADMIN_USERS_ENDPOINT =
  process.env.REACT_APP_ADMIN_USERS_ENDPOINT || '/api/dmd/admin/get-users';
const ADMIN_CLINIC_LOCK_ENDPOINT =
  process.env.REACT_APP_ADMIN_CLINIC_LOCK_ENDPOINT || '/api/dmd/admin/set-clinic-lock';
const ADMIN_CLINIC_SUBSCRIPTION_HISTORIES_ENDPOINT =
  process.env.REACT_APP_ADMIN_CLINIC_SUBSCRIPTION_HISTORIES_ENDPOINT ||
  '/api/dmd/admin/get-clinic-subscription-histories';
const ADMIN_CREATE_CLINIC_SUBSCRIPTION_HISTORY_ENDPOINT =
  process.env.REACT_APP_ADMIN_CREATE_CLINIC_SUBSCRIPTION_HISTORY_ENDPOINT ||
  '/api/dmd/admin/create-clinic-subscription-history';
const ADMIN_UPDATE_CLINIC_SUBSCRIPTION_HISTORY_ENDPOINT =
  process.env.REACT_APP_ADMIN_UPDATE_CLINIC_SUBSCRIPTION_HISTORY_ENDPOINT ||
  '/api/dmd/admin/put-clinic-subscription-history';
const ADMIN_DELETE_CLINIC_SUBSCRIPTION_HISTORY_ENDPOINT =
  process.env.REACT_APP_ADMIN_DELETE_CLINIC_SUBSCRIPTION_HISTORY_ENDPOINT ||
  '/api/dmd/admin/delete-clinic-subscription-history';
const ADMIN_CLINIC_MANUAL_PAYMENTS_ENDPOINT =
  process.env.REACT_APP_ADMIN_CLINIC_MANUAL_PAYMENTS_ENDPOINT ||
  '/api/dmd/admin/get-clinic-manual-payments';
const ADMIN_UPDATE_CLINIC_MANUAL_PAYMENT_STATUS_ENDPOINT =
  process.env.REACT_APP_ADMIN_UPDATE_CLINIC_MANUAL_PAYMENT_STATUS_ENDPOINT ||
  '/api/dmd/admin/put-clinic-manual-payment-status';
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

const clearAdminClinicSubscriptionHistoryCache = (): void => {
  Array.from(adminResponseCache.keys())
    .filter((key) => key.startsWith('admin-clinic-subscription-histories:'))
    .forEach((key) => {
      adminResponseCache.delete(key);
    });
};

const clearAdminClinicManualPaymentsCache = (): void => {
  Array.from(adminResponseCache.keys())
    .filter((key) => key.startsWith('admin-clinic-manual-payments:'))
    .forEach((key) => {
      adminResponseCache.delete(key);
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

export const getAdminClinicSubscriptionHistories = async (
  clinicId: string,
  forceRefresh: boolean = false
): Promise<AdminClinicSubscriptionHistoryModel[]> => {
  const requestKey = `admin-clinic-subscription-histories:${clinicId.trim()}`;

  if (forceRefresh) {
    adminResponseCache.delete(requestKey);
  }

  const cachedValue = getCachedValue<AdminClinicSubscriptionHistoryModel[]>(requestKey);
  if (cachedValue) {
    return cachedValue;
  }

  const activeRequest = adminRequestCache.get(requestKey);
  if (activeRequest) {
    return activeRequest as Promise<AdminClinicSubscriptionHistoryModel[]>;
  }

  const request = (async (): Promise<AdminClinicSubscriptionHistoryModel[]> => {
    try {
      const response = await apiClient.get<AdminClinicSubscriptionHistoryModel[]>(
        ADMIN_CLINIC_SUBSCRIPTION_HISTORIES_ENDPOINT,
        {
          params: {
            ClinicId: clinicId.trim(),
          },
        }
      );
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

export const createAdminClinicSubscriptionHistory = async (
  request: AdminClinicSubscriptionHistoryRequest
): Promise<AdminClinicSubscriptionHistoryModel> => {
  try {
    const response = await apiClient.post<AdminClinicSubscriptionHistoryModel>(
      ADMIN_CREATE_CLINIC_SUBSCRIPTION_HISTORY_ENDPOINT,
      request
    );
    clearAdminClinicSubscriptionHistoryCache();
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const updateAdminClinicSubscriptionHistory = async (
  request: AdminClinicSubscriptionHistoryRequest
): Promise<AdminClinicSubscriptionHistoryModel> => {
  try {
    const response = await apiClient.put<AdminClinicSubscriptionHistoryModel>(
      ADMIN_UPDATE_CLINIC_SUBSCRIPTION_HISTORY_ENDPOINT,
      request
    );
    clearAdminClinicSubscriptionHistoryCache();
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const deleteAdminClinicSubscriptionHistory = async (
  request: AdminClinicSubscriptionHistoryDeleteRequest
): Promise<boolean> => {
  try {
    const response = await apiClient.delete<boolean>(
      ADMIN_DELETE_CLINIC_SUBSCRIPTION_HISTORY_ENDPOINT,
      {
        data: request,
      }
    );
    clearAdminClinicSubscriptionHistoryCache();
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const getAdminClinicManualPayments = async (
  clinicId: string,
  forceRefresh: boolean = false
): Promise<AdminClinicManualPaymentModel[]> => {
  const requestKey = `admin-clinic-manual-payments:${clinicId.trim()}`;

  if (forceRefresh) {
    adminResponseCache.delete(requestKey);
  }

  const cachedValue = getCachedValue<AdminClinicManualPaymentModel[]>(requestKey);
  if (cachedValue) {
    return cachedValue;
  }

  const activeRequest = adminRequestCache.get(requestKey);
  if (activeRequest) {
    return activeRequest as Promise<AdminClinicManualPaymentModel[]>;
  }

  const request = (async (): Promise<AdminClinicManualPaymentModel[]> => {
    try {
      const response = await apiClient.get<AdminClinicManualPaymentModel[]>(
        ADMIN_CLINIC_MANUAL_PAYMENTS_ENDPOINT,
        {
          params: {
            ClinicId: clinicId.trim(),
          },
        }
      );
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

export const updateAdminClinicManualPaymentStatus = async (
  request: AdminClinicManualPaymentStatusRequest
): Promise<AdminClinicManualPaymentModel> => {
  try {
    const response = await apiClient.put<AdminClinicManualPaymentModel>(
      ADMIN_UPDATE_CLINIC_MANUAL_PAYMENT_STATUS_ENDPOINT,
      request
    );
    clearAdminClinicManualPaymentsCache();
    clearAdminClinicSubscriptionHistoryCache();
    adminResponseCache.delete('admin-clinics');
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};
