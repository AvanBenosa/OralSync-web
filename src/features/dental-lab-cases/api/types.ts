import type { Dispatch, SetStateAction } from 'react';

export type DentalLabCasesProps = {
  clinicId?: string;
};

export enum DentalLabCaseStatus {
  Pending = 'Pending',
  InProgress = 'InProgress',
  Completed = 'Completed',
}

export enum DentalLabWorkType {
  Crown = 'Crown',
  Bridge = 'Bridge',
  Veneer = 'Veneer',
  Inlay = 'Inlay',
  Onlay = 'Onlay',
  ImplantCrown = 'ImplantCrown',
  PartialDenture = 'PartialDenture',
  CompleteDenture = 'CompleteDenture',
  OrthodonticAppliance = 'OrthodonticAppliance',
}

export const DENTAL_LAB_CASE_STATUS_OPTIONS = Object.values(DentalLabCaseStatus);
export const DENTAL_LAB_WORK_TYPE_OPTIONS = Object.values(DentalLabWorkType);

export type DentalLabCaseAttachmentModel = {
  fileName?: string;
  originalFileName?: string;
  filePath?: string;
  fileType?: number | string;
  fileMediaType?: string;
  fileExtension?: string;
  remarks?: string;
};

export type DentalLabCaseToothSurfaceModel = {
  surface?: string;
};

export type DentalLabCaseToothModel = {
  toothNumber?: string;
  workType?: DentalLabWorkType;
  material?: string;
  shade?: string;
  remarks?: string;
  surfaces: DentalLabCaseToothSurfaceModel[];
};

export type DentalLabCaseModel = {
  id?: string;
  clinicProfileId?: string | null;
  patientInfoId?: string;
  patientLabel?: string;
  patientNumber?: string;
  patientBirthDate?: string | Date;
  assignedDentistId?: string;
  assignedDentistLabel?: string;
  labProviderId?: string;
  labProviderName?: string;
  caseNumber?: string;
  dateSent?: string | Date;
  dateDue?: string | Date;
  dateReceived?: string | Date;
  status?: DentalLabCaseStatus;
  notes?: string;
  totalCost?: number;
  discount?: number;
  paidAmount?: number;
  teeth: DentalLabCaseToothModel[];
  attachments: DentalLabCaseAttachmentModel[];
};

export type DentalLabCaseResponseModel = {
  items: DentalLabCaseModel[];
  pageStart: number;
  pageEnd: number;
  totalCount: number;
};

export type DentalLabCaseAttachmentUploadResponse = {
  fileName: string;
  originalFileName: string;
  filePath: string;
};

export type DentalLabCaseStateModel = {
  items: DentalLabCaseModel[];
  load: boolean;
  initial: number;
  totalItem: number;
  pageStart: number;
  pageEnd: number;
  search?: string;
  statusFilter?: DentalLabCaseStatus | 'All';
  openModal: boolean;
  isUpdate: boolean;
  isDelete: boolean;
  selectedItem?: DentalLabCaseModel;
  clinicProfileId?: string | null;
};

export type DentalLabCaseStateProps = {
  state: DentalLabCaseStateModel;
  setState: Dispatch<SetStateAction<DentalLabCaseStateModel>>;
  onReload?: () => void;
};

export const getDentalLabCaseStatusLabel = (
  value?: DentalLabCaseStatus | string
): string => {
  if (!value) {
    return '--';
  }

  return String(value).replace(/([a-z])([A-Z])/g, '$1 $2');
};

export const getDentalLabWorkTypeLabel = (value?: DentalLabWorkType | string): string => {
  if (!value) {
    return '--';
  }

  return String(value).replace(/([a-z])([A-Z])/g, '$1 $2');
};
