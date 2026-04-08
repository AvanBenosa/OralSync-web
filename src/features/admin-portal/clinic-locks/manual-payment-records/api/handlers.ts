import {
  getAdminClinicManualPayments,
  updateAdminClinicManualPaymentStatus,
} from '../../../api/api';
import type {
  AdminClinicManualPaymentModel,
  AdminClinicManualPaymentStatusRequest,
} from '../../../api/types';
import type { ManualPaymentRecordsStateModel } from './types';

export const HandleGetClinicManualPaymentItems = async (
  setState: Function,
  clinicId?: string,
  forceRefresh: boolean = false
): Promise<AdminClinicManualPaymentModel[]> => {
  const items = clinicId ? await getAdminClinicManualPayments(clinicId, forceRefresh) : [];
  setState((prev: ManualPaymentRecordsStateModel) => ({
    ...prev,
    load: false,
    error: '',
    items,
  }));
  return items;
};

export const HandleUpdateClinicManualPaymentStatus = async (
  request: AdminClinicManualPaymentStatusRequest,
  setState: Function
): Promise<AdminClinicManualPaymentModel> => {
  const response = await updateAdminClinicManualPaymentStatus(request);
  setState((prev: ManualPaymentRecordsStateModel) => ({
    ...prev,
    items: prev.items.map((item) =>
      item.id === response.id || item.id === prev.selectedItem?.id ? response : item
    ),
    selectedItem: undefined,
    openModal: false,
  }));
  return response;
};
