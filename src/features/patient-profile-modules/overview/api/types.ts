import type { PatientProfileMobileReloadConfig } from '../../../patient-profile/api/types';

export type PatientProfileProps = {
  patientId?: string | undefined;
  onRegisterMobileReload?: (config?: PatientProfileMobileReloadConfig) => void;
};

export type PatientOverViewModel = {
  patientInfoId?: string;
  id?: string;
  assignedDoctor?: string;
  date?: string | Date;
  procedure?: string;
  category?: string;
  account?: string;
  remarks?: string;

  // Payment details
  amount?: number;
  discount?: number;
  totalAmountDue?: number;
  amountPaid?: number;
  balance?: number;
};

export type PatientOverViewStateModel = {
  patientId?: string;
  items: PatientOverViewModel[];
  load: boolean;

  openModal: boolean;
  isUpdate: boolean;
  isDelete: boolean;
  selectedItem?: PatientOverViewModel;
  notFound?: boolean;
};

export type PatientOverViewStateProps = {
  state: PatientOverViewStateModel;
  setState: Function;
  onReload?: () => void;
};
