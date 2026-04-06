import type { PatientProfileMobileReloadConfig } from '../../../patient-profile/api/types';
import { DentalChartCondition } from '../../dental-chart/api/types';

export type DentalImagesTab = 'chart-images' | 'uploads';

export type PatientDentalPhotoProps = {
  patientId?: string | undefined;
  patientLabel?: string;
  onRegisterMobileReload?: (config?: PatientProfileMobileReloadConfig) => void;
};

export type PatientDentalPhotoModel = {
  id?: string;
  patientInfoId?: string;
  patientTeethId?: string;
  toothNumber?: number;
  condition?: DentalChartCondition;
  toothRemarks?: string;
  fileName?: string;
  originalFileName?: string;
  filePath?: string;
  fileType?: number;
  fileMediaType?: string;
  fileExtension?: string;
  displayOrder?: number;
  remarks?: string;
};

export type PatientDentalPhotoStateModel = {
  patientId?: string;
  items: PatientDentalPhotoModel[];
  selectedItem?: PatientDentalPhotoModel;
  load: boolean;
  notFound?: boolean;
};

export type PatientDentalPhotoStateProps = {
  state: PatientDentalPhotoStateModel;
  setState: Function;
  onReload?: () => void;
  patientLabel?: string;
};

export enum PatientUploadFileType {
  None = 0,
  Pdf = 1,
  Image = 2,
  Excel = 3,
  Word = 4,
}

export type PatientUploadModel = {
  id?: string;
  patientInfoId?: string;
  fileName?: string;
  originalFileName?: string;
  filePath?: string;
  fileType?: PatientUploadFileType | number;
  fileMediaType?: string;
  fileExtension?: string;
  remarks?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

export type PatientUploadStateModel = {
  patientId?: string;
  items: PatientUploadModel[];
  selectedItem?: PatientUploadModel;
  load: boolean;
  openModal: boolean;
  isUpdate?: boolean;
  isDelete?: boolean;
  notFound?: boolean;
};

export type PatientUploadStateProps = {
  state: PatientUploadStateModel;
  setState: Function;
  patientLabel?: string;
};
