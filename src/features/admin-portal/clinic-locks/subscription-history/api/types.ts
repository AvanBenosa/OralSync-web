import type {
  AdminClinicModel,
  AdminClinicSubscriptionHistoryModel,
} from '../../../api/types';

export type SubscriptionHistoryModuleProps = {
  clinic: AdminClinicModel | null;
  onClose: () => void;
};

export type SubscriptionHistoryStateModel = {
  clinic: AdminClinicModel | null;
  items: AdminClinicSubscriptionHistoryModel[];
  load: boolean;
  error: string;
  openModal: boolean;
  isUpdate: boolean;
  isDelete: boolean;
  selectedItem?: AdminClinicSubscriptionHistoryModel;
};

export type SubscriptionHistoryStateProps = {
  state: SubscriptionHistoryStateModel;
  setState: Function;
  onClose?: () => void;
  onReload?: () => void;
};
