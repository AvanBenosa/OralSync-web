import type {
  PatientProfileMobileReloadConfig,
  PatientProfileModel,
} from '../../../patient-profile/api/types';

export type PatientFormsProps = {
  patientId?: string | undefined;
  patientLabel?: string;
  patientProfile?: PatientProfileModel | null;
  onRegisterMobileReload?: (config?: PatientProfileMobileReloadConfig) => void;
};

export type PatientFormModel = {
  patientInfoId?: string;
  id?: string;
  templateFormId?: string;
  formType?: string;
  assignedDoctor?: string;
  reportTemplate?: string;
  date?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

export type PatientFormStateModel = {
  patientId?: string;
  items: PatientFormModel[];
  load: boolean;
  openModal: boolean;
  isUpdate: boolean;
  isDelete: boolean;
  isView: boolean;
  selectedItem?: PatientFormModel;
  notFound?: boolean;
};

export type PatientFormStateProps = {
  state: PatientFormStateModel;
  setState: Function;
  onReload?: () => void;
  patientLabel?: string;
  patientProfile?: PatientProfileModel | null;
};
