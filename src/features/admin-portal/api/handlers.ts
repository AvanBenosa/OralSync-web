import {
  createAdminClinicSubscriptionHistory,
  deleteAdminClinicSubscriptionHistory,
  getAdminClinicSubscriptionHistories,
  getAdminClinics,
  getAdminUsers,
  updateAdminClinicSubscriptionHistory,
  updateClinicLockStatus,
} from './api';
import {
  AdminClinicLockRequest,
  AdminClinicModel,
  AdminClinicSubscriptionHistoryDeleteRequest,
  AdminClinicSubscriptionHistoryModel,
  AdminClinicSubscriptionHistoryRequest,
  AdminDashboardModel,
  AdminDashboardStateModel,
  AdminClinicsStateModel,
  AdminUserModel,
  AdminUsersStateModel,
} from './types';
import { getAdminDashboard } from './api';

export const handleGetAdminDashboard = async (
  setState: Function,
  forceRefresh: boolean = false
): Promise<AdminDashboardModel> => {
  const item = await getAdminDashboard(forceRefresh);
  setState((prev: AdminDashboardStateModel) => ({
    ...prev,
    load: false,
    error: '',
    item,
  }));
  return item;
};

export const handleGetAdminClinics = async (
  setState: Function,
  forceRefresh: boolean = false
): Promise<AdminClinicModel[]> => {
  const items = await getAdminClinics(forceRefresh);
  setState((prev: AdminClinicsStateModel) => ({
    ...prev,
    load: false,
    error: '',
    items,
  }));
  return items;
};

export const handleGetAdminUsers = async (
  setState: Function,
  forceRefresh: boolean = false
): Promise<AdminUserModel[]> => {
  const items = await getAdminUsers(forceRefresh);
  setState((prev: AdminUsersStateModel) => ({
    ...prev,
    load: false,
    error: '',
    items,
  }));
  return items;
};

export const handleUpdateClinicLockStatus = async (
  request: AdminClinicLockRequest
): Promise<AdminClinicModel> => updateClinicLockStatus(request);

export const handleGetAdminClinicSubscriptionHistories = async (
  clinicId: string,
  forceRefresh: boolean = false
): Promise<AdminClinicSubscriptionHistoryModel[]> =>
  getAdminClinicSubscriptionHistories(clinicId, forceRefresh);

export const handleCreateAdminClinicSubscriptionHistory = async (
  request: AdminClinicSubscriptionHistoryRequest
): Promise<AdminClinicSubscriptionHistoryModel> => createAdminClinicSubscriptionHistory(request);

export const handleUpdateAdminClinicSubscriptionHistory = async (
  request: AdminClinicSubscriptionHistoryRequest
): Promise<AdminClinicSubscriptionHistoryModel> => updateAdminClinicSubscriptionHistory(request);

export const handleDeleteAdminClinicSubscriptionHistory = async (
  request: AdminClinicSubscriptionHistoryDeleteRequest
): Promise<boolean> => deleteAdminClinicSubscriptionHistory(request);
