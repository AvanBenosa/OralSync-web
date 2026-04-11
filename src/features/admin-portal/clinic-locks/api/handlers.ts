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
  const items = await getAdminClinics(true);
  const selectedItem =
    items.find((item) => item.id === request.clinicId || item.id === response.id) || response;

  setState((prev: ClinicLockStateModel) => ({
    ...prev,
    items,
    selectedItem,
    load: false,
    error: '',
    openModal: false,
    isUpdate: false,
    isHistory: false,
    isManualPayments: false,
  }));
  return response;
};
