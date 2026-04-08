import type { AdminClinicManualPaymentModel, AdminClinicModel } from '../../../api/types';

export type ManualPaymentRecordsModuleProps = {
  clinic: AdminClinicModel | null;
  onClose: () => void;
};

export type ManualPaymentRecordsStateModel = {
  clinic: AdminClinicModel | null;
  items: AdminClinicManualPaymentModel[];
  load: boolean;
  error: string;
  openModal: boolean;
  selectedItem?: AdminClinicManualPaymentModel;
};

export type ManualPaymentRecordsStateProps = {
  state: ManualPaymentRecordsStateModel;
  setState: Function;
  onReload?: () => void;
};
