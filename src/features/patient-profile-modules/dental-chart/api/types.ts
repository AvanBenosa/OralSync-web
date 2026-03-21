import type {
  PatientProfileMobileReloadConfig,
  PatientProfileModel,
} from '../../../patient-profile/api/types';

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

export const toothConditionColors: Record<
  DentalChartCondition,
  {
    fill: string;
    stroke: string;
    text: string;
  }
> = {
  [DentalChartCondition.Healthy]: {
    fill: '#E8F5E9',
    stroke: '#43A047',
    text: '#1B5E20',
  },
  [DentalChartCondition.Cavity]: {
    fill: '#FFEBEE',
    stroke: '#E53935',
    text: '#B71C1C',
  },
  [DentalChartCondition.FilledComposite]: {
    fill: '#E3F2FD',
    stroke: '#1E88E5',
    text: '#0D47A1',
  },
  [DentalChartCondition.FilledTemporary]: {
    fill: '#FFF8E1',
    stroke: '#F9A825',
    text: '#F57F17',
  },
  [DentalChartCondition.FilledAmalgam]: {
    fill: '#ECEFF1',
    stroke: '#607D8B',
    text: '#37474F',
  },
  [DentalChartCondition.Crown]: {
    fill: '#F3E5F5',
    stroke: '#8E24AA',
    text: '#4A148C',
  },
  [DentalChartCondition.Missing]: {
    fill: '#FAFAFA',
    stroke: '#9E9E9E',
    text: '#616161',
  },
  [DentalChartCondition.Implant]: {
    fill: '#E0F7FA',
    stroke: '#00838F',
    text: '#006064',
  },
  [DentalChartCondition.RootCanalTreated]: {
    fill: '#FFF3E0',
    stroke: '#FB8C00',
    text: '#E65100',
  },
};

export const getDentalChartConditionLabel = (
  condition?: DentalChartCondition | string
): string => {
  if (!condition?.trim()) {
    return '--';
  }

  return condition.replace(/([a-z])([A-Z])/g, '$1 $2');
};

export type DentalChartKind = 'adult' | 'child';

export const PEDIATRIC_DENTAL_CHART_MAX_AGE = 11;
export const ADULT_DENTAL_CHART_MIN_AGE = 12;

export const ADULT_TOOTH_COUNT_PER_QUADRANT = 8;
export const CHILD_TOOTH_COUNT_PER_QUADRANT = 5;

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

export const PRIMARY_TOOTH_NUMBER_TO_CHART_ID_MAP: Record<number, string> = {
  1: 'teeth-15',
  2: 'teeth-14',
  3: 'teeth-13',
  4: 'teeth-12',
  5: 'teeth-11',
  6: 'teeth-21',
  7: 'teeth-22',
  8: 'teeth-23',
  9: 'teeth-24',
  10: 'teeth-25',
  11: 'teeth-45',
  12: 'teeth-44',
  13: 'teeth-43',
  14: 'teeth-42',
  15: 'teeth-41',
  16: 'teeth-31',
  17: 'teeth-32',
  18: 'teeth-33',
  19: 'teeth-34',
  20: 'teeth-35',
};

export const PRIMARY_TOOTH_LABEL_MAP: Record<number, string> = {
  1: 'A',
  2: 'B',
  3: 'C',
  4: 'D',
  5: 'E',
  6: 'F',
  7: 'G',
  8: 'H',
  9: 'I',
  10: 'J',
  11: 'K',
  12: 'L',
  13: 'M',
  14: 'N',
  15: 'O',
  16: 'P',
  17: 'Q',
  18: 'R',
  19: 'S',
  20: 'T',
};

const parsePatientBirthDate = (value?: string | Date): Date | undefined => {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }

  const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
};

export const resolveDentalChartPatientAge = (
  patientProfile?: PatientProfileModel | null
): number | undefined => {
  const providedAge = patientProfile?.age;
  if (typeof providedAge === 'number' && Number.isFinite(providedAge) && providedAge >= 0) {
    return providedAge;
  }

  const birthDate = parsePatientBirthDate(patientProfile?.birthDate);
  if (!birthDate) {
    return undefined;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age >= 0 ? age : undefined;
};

export const getDentalChartKind = (
  patientProfile?: PatientProfileModel | null
): DentalChartKind => {
  const age = resolveDentalChartPatientAge(patientProfile);
  return age !== undefined && age < ADULT_DENTAL_CHART_MIN_AGE ? 'child' : 'adult';
};

export const getDentalChartMaxTeeth = (chartKind: DentalChartKind): number =>
  chartKind === 'child' ? CHILD_TOOTH_COUNT_PER_QUADRANT : ADULT_TOOTH_COUNT_PER_QUADRANT;

export const getToothIdFromToothNumber = (
  toothNumber?: number,
  chartKind: DentalChartKind = 'adult'
): string | undefined => {
  if (!toothNumber) {
    return undefined;
  }

  if (chartKind === 'child') {
    return PRIMARY_TOOTH_NUMBER_TO_CHART_ID_MAP[toothNumber];
  }

  const fdi = UNIVERSAL_TO_FDI_MAP[toothNumber];
  return fdi ? `teeth-${fdi}` : undefined;
};

export const getToothNumberFromToothId = (
  toothId?: string,
  chartKind: DentalChartKind = 'adult'
): number | undefined => {
  if (!toothId?.trim()) {
    return undefined;
  }

  if (chartKind === 'child') {
    const match = Object.entries(PRIMARY_TOOTH_NUMBER_TO_CHART_ID_MAP).find(
      ([, value]) => value === toothId
    );

    return match ? Number(match[0]) : undefined;
  }

  const fdi = toothId.replace('teeth-', '');
  const match = Object.entries(UNIVERSAL_TO_FDI_MAP).find(([, value]) => value === fdi);

  if (!match) {
    return undefined;
  }

  return Number(match[0]);
};

export const getToothDisplayLabel = (
  toothNumber?: number,
  chartKind: DentalChartKind = 'adult'
): string => {
  if (!toothNumber) {
    return '--';
  }

  if (chartKind === 'child') {
    const label = PRIMARY_TOOTH_LABEL_MAP[toothNumber];
    return label ? `Tooth ${label} (Primary)` : `Primary Tooth ${toothNumber}`;
  }

  const fdi = UNIVERSAL_TO_FDI_MAP[toothNumber];
  return fdi ? `Tooth ${toothNumber} (FDI ${fdi})` : `Tooth ${toothNumber}`;
};

export type PatientDentalChartProps = {
  patientId?: string | undefined;
  patientLabel?: string;
  patientProfile?: PatientProfileModel | null;
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
  patientProfile?: PatientProfileModel | null;
};
