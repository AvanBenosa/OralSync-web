import { getAdminClinics, updateClinicLockStatus } from '../../api/api';
import type { AdminClinicLockRequest, AdminClinicModel } from '../../api/types';
import type { ClinicLockStateModel } from './types';

export const HandleGetClinicLockItems = async (
  setState: Function,
  forceRefresh: boolean = false
): Promise<AdminClinicModel[]> => {
  const items = await getAdminClinics(forceRefresh);
  setState((prev: ClinicLockStateModel) => ({
    ...prev,
    load: false,
    error: '',
    items,
  }));
  return items;
};

export const HandleUpdateClinicLockItem = async (
  request: AdminClinicLockRequest,
  setState: Function
): Promise<AdminClinicModel> => {
  const response = await updateClinicLockStatus(request);
  setState((prev: ClinicLockStateModel) => ({
    ...prev,
    items: prev.items.map((item) => (item.id === response.id ? response : item)),
    selectedItem: undefined,
    openModal: false,
    isUpdate: false,
    isHistory: false,
  }));
  return response;
};
