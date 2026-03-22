import {
  createAdminClinicSubscriptionHistory,
  deleteAdminClinicSubscriptionHistory,
  getAdminClinicSubscriptionHistories,
  updateAdminClinicSubscriptionHistory,
} from '../../../api/api';
import type {
  AdminClinicSubscriptionHistoryDeleteRequest,
  AdminClinicSubscriptionHistoryModel,
  AdminClinicSubscriptionHistoryRequest,
} from '../../../api/types';
import type { SubscriptionHistoryStateModel } from './types';

export const HandleGetClinicSubscriptionHistoryItems = async (
  setState: Function,
  clinicId?: string,
  forceRefresh: boolean = false
): Promise<AdminClinicSubscriptionHistoryModel[]> => {
  const items = clinicId ? await getAdminClinicSubscriptionHistories(clinicId, forceRefresh) : [];
  setState((prev: SubscriptionHistoryStateModel) => ({
    ...prev,
    load: false,
    error: '',
    items,
  }));
  return items;
};

export const HandleCreateClinicSubscriptionHistoryItem = async (
  request: AdminClinicSubscriptionHistoryRequest,
  setState: Function
): Promise<AdminClinicSubscriptionHistoryModel> => {
  const response = await createAdminClinicSubscriptionHistory(request);
  setState((prev: SubscriptionHistoryStateModel) => ({
    ...prev,
    items: [response, ...prev.items],
    selectedItem: undefined,
    openModal: false,
    isUpdate: false,
    isDelete: false,
  }));
  return response;
};

export const HandleUpdateClinicSubscriptionHistoryItem = async (
  request: AdminClinicSubscriptionHistoryRequest,
  setState: Function
): Promise<AdminClinicSubscriptionHistoryModel> => {
  const response = await updateAdminClinicSubscriptionHistory(request);
  setState((prev: SubscriptionHistoryStateModel) => ({
    ...prev,
    items: prev.items.map((item) =>
      item.id === response.id || item.id === prev.selectedItem?.id ? response : item
    ),
    selectedItem: undefined,
    openModal: false,
    isUpdate: false,
    isDelete: false,
  }));
  return response;
};

export const HandleDeleteClinicSubscriptionHistoryItem = async (
  request: AdminClinicSubscriptionHistoryDeleteRequest,
  setState: Function
): Promise<void> => {
  await deleteAdminClinicSubscriptionHistory(request);
  setState((prev: SubscriptionHistoryStateModel) => {
    const selectedId = prev.selectedItem?.id ?? request.id;

    return {
      ...prev,
      items: prev.items.filter((item) => selectedId === undefined || item.id !== selectedId),
      selectedItem: undefined,
      openModal: false,
      isUpdate: false,
      isDelete: false,
    };
  });
};
