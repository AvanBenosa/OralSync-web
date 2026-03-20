import type { PatientProfileMobileReloadConfig } from '../../../patient-profile/api/types';

export enum DentalChartCondition {
  Healthy = 'Healthy',
  Cavity = 'Cavity',
  FilledComposite = 'FilledComposite',
  FilledTemporary = 'FilledTemporary',
  FilledAmalgam = 'FilledAmalgam',
  Crown = 'Crown',
  Missing = 'Missing',
  Implant = 'Implant',
  RootCanalTreated = 'RootCanalTreated',
}

export enum DentalChartSurface {
  None = 'None',
  Mesial = 'Mesial',
  Distal = 'Distal',
  Occlusal = 'Occlusal',
  Buccal = 'Buccal',
  Lingual = 'Lingual',
}

export const DENTAL_CHART_CONDITION_OPTIONS = Object.values(DentalChartCondition);
export const DENTAL_CHART_SURFACE_OPTIONS = Object.values(DentalChartSurface).filter(
  (item) => item !== DentalChartSurface.None
);

export const getDentalChartConditionLabel = (
  condition?: DentalChartCondition | string
): string => {
  if (!condition?.trim()) {
    return '--';
  }

  return condition.replace(/([a-z])([A-Z])/g, '$1 $2');
};

export const UNIVERSAL_TO_FDI_MAP: Record<number, string> = {
  1: '18',
  2: '17',
  3: '16',
  4: '15',
  5: '14',
  6: '13',
  7: '12',
  8: '11',
  9: '21',
  10: '22',
  11: '23',
  12: '24',
  13: '25',
  14: '26',
  15: '27',
  16: '28',
  17: '38',
  18: '37',
  19: '36',
  20: '35',
  21: '34',
  22: '33',
  23: '32',
  24: '31',
  25: '41',
  26: '42',
  27: '43',
  28: '44',
  29: '45',
  30: '46',
  31: '47',
  32: '48',
};

export const getToothIdFromToothNumber = (toothNumber?: number): string | undefined => {
  if (!toothNumber || !UNIVERSAL_TO_FDI_MAP[toothNumber]) {
    return undefined;
  }

  return `teeth-${UNIVERSAL_TO_FDI_MAP[toothNumber]}`;
};

export const getToothNumberFromToothId = (toothId?: string): number | undefined => {
  if (!toothId?.trim()) {
    return undefined;
  }

  const fdi = toothId.replace('teeth-', '');
  const match = Object.entries(UNIVERSAL_TO_FDI_MAP).find(([, value]) => value === fdi);

  if (!match) {
    return undefined;
  }

  return Number(match[0]);
};

export const getToothDisplayLabel = (toothNumber?: number): string => {
  if (!toothNumber) {
    return '--';
  }

  const fdi = UNIVERSAL_TO_FDI_MAP[toothNumber];
  return fdi ? `Tooth ${toothNumber} (FDI ${fdi})` : `Tooth ${toothNumber}`;
};

export type PatientDentalChartProps = {
  patientId?: string | undefined;
  patientLabel?: string;
  onRegisterMobileReload?: (config?: PatientProfileMobileReloadConfig) => void;
};

export type PatientDentalChartSurfaceModel = {
  id?: string;
  patientTeethId?: string;
  surface?: DentalChartSurface;
  teethSurfaceName?: string;
  remarks?: string;
};

export type PatientDentalChartImageModel = {
  id?: string;
  patientTeethId?: string;
  fileName?: string;
  originalFileName?: string;
  filePath?: string;
  fileType?: number;
  fileMediaType?: string;
  fileExtension?: string;
  displayOrder?: number;
  remarks?: string;
};

export type PatientDentalChartModel = {
  patientInfoId?: string;
  id?: string;
  toothNumber?: number;
  condition?: DentalChartCondition;
  remarks?: string;
  surfaces: PatientDentalChartSurfaceModel[];
  images: PatientDentalChartImageModel[];
};

export type PatientDentalChartStateModel = {
  patientId?: string;
  items: PatientDentalChartModel[];
  load: boolean;
  chartLayout: 'circle' | 'square';
  circleHalf: 'full' | 'upper' | 'lower';
  circleZoom: number;
  openModal: boolean;
  isUpdate: boolean;
  isDelete: boolean;
  selectedItem?: PatientDentalChartModel;
  selectedToothId?: string;
  notFound?: boolean;
};

export type PatientDentalChartStateProps = {
  state: PatientDentalChartStateModel;
  setState: Function;
  onReload?: () => void;
  patientLabel?: string;
};
