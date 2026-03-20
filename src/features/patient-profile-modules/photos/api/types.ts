import type { PatientProfileMobileReloadConfig } from '../../../patient-profile/api/types';
import { DentalChartCondition } from '../../dental-chart/api/types';

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
