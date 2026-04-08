import type { AdminClinicModel } from '../../api/types';

export type ClinicLockStateModel = {
  items: AdminClinicModel[];
  load: boolean;
  error: string;
  openModal: boolean;
  isUpdate: boolean;
  isHistory: boolean;
  isManualPayments: boolean;
  selectedItem?: AdminClinicModel;
};

export type ClinicLockStateProps = {
  state: ClinicLockStateModel;
  setState: Function;
  onReload?: () => void;
};
