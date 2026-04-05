import type {
  PatientProfileMobileReloadConfig,
  PatientProfileModel,
} from '../../../patient-profile/api/types';
import type { DentalChartKind } from '../../dental-chart/api/types';
import {
  getDentalChartKind,
  getDentalChartMaxTeeth,
  getToothDisplayLabel,
  getToothIdFromToothNumber,
  getToothNumberFromToothId,
} from '../../dental-chart/api/types';

export type { DentalChartKind };
export {
  getDentalChartKind,
  getDentalChartMaxTeeth,
  getToothDisplayLabel,
  getToothIdFromToothNumber,
  getToothNumberFromToothId,
};

export const PERIO_SITE_LABELS = ['Mesial', 'Mid', 'Distal'] as const;
export const PERIO_SITE_COUNT = PERIO_SITE_LABELS.length;

export enum PerioChartCondition {
  Healthy = 'Healthy',
  Watch = 'Watch',
  Moderate = 'Moderate',
  Severe = 'Severe',
}

export type PerioChartView = 'upper' | 'lower';

export const perioChartConditionColors: Record<
  PerioChartCondition,
  {
    fill: string;
    stroke: string;
    text: string;
  }
> = {
  [PerioChartCondition.Healthy]: {
    fill: '#E8F5E9',
    stroke: '#43A047',
    text: '#1B5E20',
  },
  [PerioChartCondition.Watch]: {
    fill: '#FFF8E1',
    stroke: '#F9A825',
    text: '#8A5A00',
  },
  [PerioChartCondition.Moderate]: {
    fill: '#FFF3E0',
    stroke: '#FB8C00',
    text: '#C45B00',
  },
  [PerioChartCondition.Severe]: {
    fill: '#FFEBEE',
    stroke: '#E53935',
    text: '#B71C1C',
  },
};

export const getPerioChartConditionLabel = (condition?: PerioChartCondition | string): string => {
  if (!condition?.trim()) {
    return '--';
  }

  return condition;
};

export type PerioNumericSiteValue = number | null;
export type PerioNumericSiteArray = PerioNumericSiteValue[];
export type PerioTextSiteArray = string[];
export type PerioBooleanSiteArray = boolean[];

export type PatientPerioChartModel = {
  patientInfoId?: string;
  chartId?: string;
  id?: string;
  toothNumber?: number;
  chartDate?: string | Date;
  furcation?: string;
  buccalGingivalMargin: PerioNumericSiteArray;
  buccalProbingDepth: PerioNumericSiteArray;
  buccalBleedingOnProbing: PerioBooleanSiteArray;
  buccalPlaque: PerioBooleanSiteArray;
  lingualGingivalMargin: PerioNumericSiteArray;
  lingualProbingDepth: PerioNumericSiteArray;
  lingualBleedingOnProbing: PerioBooleanSiteArray;
  lingualPlaque: PerioBooleanSiteArray;
  mobility?: string;
  notes?: string;
  remarks?: string;
};

export type PatientPerioChartProps = {
  patientId?: string | undefined;
  patientLabel?: string;
  patientProfile?: PatientProfileModel | null;
  onRegisterMobileReload?: (config?: PatientProfileMobileReloadConfig) => void;
};

export type PatientPerioChartStateModel = {
  patientId?: string;
  items: PatientPerioChartModel[];
  load: boolean;
  chartLayout: 'circle' | 'square';
  circleHalf: PerioChartView;
  circleZoom: number;
  openModal: boolean;
  isUpdate: boolean;
  isDelete: boolean;
  selectedItem?: PatientPerioChartModel;
  selectedToothId?: string;
  notFound?: boolean;
};

export type PatientPerioChartStateProps = {
  state: PatientPerioChartStateModel;
  setState: Function;
  onReload?: () => void;
  patientLabel?: string;
  patientProfile?: PatientProfileModel | null;
};

const EMPTY_TEXT_SITE_VALUES = ['', '', ''];
const EMPTY_NUMERIC_SITE_VALUES: PerioNumericSiteArray = [null, null, null];
const EMPTY_BOOLEAN_SITE_VALUES: PerioBooleanSiteArray = [false, false, false];
const PERIO_SITE_KEY_VARIANTS = [
  ['Mesial', 'mesial', 'M', 'm'],
  ['Mid', 'mid', 'Middle', 'middle', 'Center', 'center', 'Central', 'central', 'C', 'c'],
  ['Distal', 'distal', 'D', 'd'],
];

type RawPerioChartRecord = Record<string, unknown>;

const createFixedLengthArray = <T>(values: T[], fallback: T): T[] =>
  Array.from({ length: PERIO_SITE_COUNT }, (_, index) => values[index] ?? fallback);

const toSnakeCase = (value: string): string =>
  value.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();

const capitalize = (value: string): string =>
  value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value;

const getFirstDefinedValue = (raw: RawPerioChartRecord, keys: string[]): unknown => {
  for (const key of keys) {
    const value = raw[key];
    if (value !== undefined && value !== null && `${value}`.trim() !== '') {
      return value;
    }
  }

  return undefined;
};

const parseArrayLikeValue = (value: unknown): unknown[] | undefined => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Fallback to delimiter parsing below.
  }

  if (/[,;|/]/.test(trimmed)) {
    return trimmed.split(/[,;|/]/g).map((token) => token.trim());
  }

  return undefined;
};

const parseStringValue = (value: unknown): string => {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value).trim();
};

const parseNumberValue = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseBooleanValue = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value > 0;
  }

  if (typeof value !== 'string') {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return ['1', 'true', 'yes', 'y', 'checked', 'present', 'positive', 'x'].includes(normalized);
};

const buildSiteFieldCandidates = (base: string, siteVariants: string[]): string[] => {
  const snakeBase = toSnakeCase(base);
  const pascalBase = capitalize(base);

  return siteVariants.flatMap((siteVariant) => {
    const lowercaseSite = siteVariant.toLowerCase();
    const pascalSite =
      siteVariant.length === 1 ? siteVariant.toUpperCase() : capitalize(siteVariant);

    return [
      `${base}${pascalSite}`,
      `${base}_${lowercaseSite}`,
      `${snakeBase}_${lowercaseSite}`,
      `${lowercaseSite}${pascalBase}`,
      `${lowercaseSite}_${snakeBase}`,
    ];
  });
};

const extractSiteValues = <T>(
  raw: RawPerioChartRecord,
  baseFieldCandidates: string[],
  parser: (value: unknown) => T,
  fallback: T
): T[] => {
  const directFieldCandidates = baseFieldCandidates.flatMap((baseField) => [
    baseField,
    toSnakeCase(baseField),
  ]);
  const directValue = getFirstDefinedValue(raw, directFieldCandidates);
  const directArray = parseArrayLikeValue(directValue);

  if (directArray) {
    return createFixedLengthArray(
      directArray.map((item) => parser(item)),
      fallback
    );
  }

  return createFixedLengthArray(
    PERIO_SITE_KEY_VARIANTS.map((siteVariants) => {
      const siteFieldValue = getFirstDefinedValue(
        raw,
        baseFieldCandidates.flatMap((baseField) =>
          buildSiteFieldCandidates(baseField, siteVariants)
        )
      );

      return siteFieldValue === undefined ? fallback : parser(siteFieldValue);
    }),
    fallback
  );
};

const readStringField = (raw: RawPerioChartRecord, keys: string[]): string | undefined => {
  const value = getFirstDefinedValue(raw, keys);
  const parsed = parseStringValue(value);
  return parsed || undefined;
};

const readNumberField = (raw: RawPerioChartRecord, keys: string[]): number | undefined => {
  const value = getFirstDefinedValue(raw, keys);
  const parsed = parseNumberValue(value);
  return parsed === null ? undefined : parsed;
};

export const createEmptyPerioTextSites = (): PerioTextSiteArray => [...EMPTY_TEXT_SITE_VALUES];
export const createEmptyPerioNumericSites = (): PerioNumericSiteArray => [
  ...EMPTY_NUMERIC_SITE_VALUES,
];
export const createEmptyPerioBooleanSites = (): PerioBooleanSiteArray => [
  ...EMPTY_BOOLEAN_SITE_VALUES,
];

export const getPerioChartViewByToothNumber = (
  toothNumber?: number,
  chartKind: DentalChartKind = 'adult'
): PerioChartView | undefined => {
  if (!toothNumber) {
    return undefined;
  }

  const upperArchLastToothNumber = chartKind === 'child' ? 10 : 16;
  return toothNumber <= upperArchLastToothNumber ? 'upper' : 'lower';
};

export const getPerioChartViewByToothId = (
  toothId?: string,
  chartKind: DentalChartKind = 'adult'
): PerioChartView | undefined =>
  getPerioChartViewByToothNumber(getToothNumberFromToothId(toothId, chartKind), chartKind);

const FURCATION_SORT_ORDER: Record<string, number> = {
  '': 0,
  '0': 0,
  NONE: 0,
  I: 1,
  II: 2,
  III: 3,
  IV: 4,
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 4,
};

const resolvePreferredFurcationValue = (values: string[]): string | undefined =>
  values
    .map((item) => item.trim())
    .sort(
      (left, right) =>
        (FURCATION_SORT_ORDER[right.toUpperCase()] ?? 0) -
        (FURCATION_SORT_ORDER[left.toUpperCase()] ?? 0)
    )
    .find((item) => item && item !== '0');

export const normalizePatientPerioChartItem = (value: unknown): PatientPerioChartModel => {
  const raw =
    value && typeof value === 'object'
      ? (value as RawPerioChartRecord)
      : ({} as RawPerioChartRecord);
  const fallbackFurcationValues = [
    ...extractSiteValues(raw, ['buccalFurcation', 'furcationBuccal'], parseStringValue, ''),
    ...extractSiteValues(raw, ['lingualFurcation', 'furcationLingual'], parseStringValue, ''),
  ];

  return {
    id: readStringField(raw, ['id', 'Id']),
    patientInfoId: readStringField(raw, ['patientInfoId', 'PatientInfoId']),
    chartId: readStringField(raw, ['chartId', 'ChartId']),
    toothNumber: readNumberField(raw, ['toothNumber', 'ToothNumber']),
    chartDate: readStringField(raw, ['chartDate', 'ChartDate']),
    furcation:
      readStringField(raw, ['furcation', 'Furcation']) ||
      resolvePreferredFurcationValue(fallbackFurcationValues),
    buccalGingivalMargin: extractSiteValues(
      raw,
      ['buccalGingivalMargin', 'gingivalMarginBuccal'],
      parseNumberValue,
      null
    ),
    buccalProbingDepth: extractSiteValues(
      raw,
      ['buccalProbingDepth', 'probingDepthBuccal'],
      parseNumberValue,
      null
    ),
    buccalBleedingOnProbing: extractSiteValues(
      raw,
      ['buccalBleedingOnProbing', 'buccalBop', 'bleedingOnProbingBuccal', 'bopBuccal'],
      parseBooleanValue,
      false
    ),
    buccalPlaque: extractSiteValues(
      raw,
      ['buccalPlaque', 'plaqueBuccal', 'buccalP'],
      parseBooleanValue,
      false
    ),
    lingualGingivalMargin: extractSiteValues(
      raw,
      ['lingualGingivalMargin', 'gingivalMarginLingual'],
      parseNumberValue,
      null
    ),
    lingualProbingDepth: extractSiteValues(
      raw,
      ['lingualProbingDepth', 'probingDepthLingual'],
      parseNumberValue,
      null
    ),
    lingualBleedingOnProbing: extractSiteValues(
      raw,
      ['lingualBleedingOnProbing', 'lingualBop', 'bleedingOnProbingLingual', 'bopLingual'],
      parseBooleanValue,
      false
    ),
    lingualPlaque: extractSiteValues(
      raw,
      ['lingualPlaque', 'plaqueLingual', 'lingualP'],
      parseBooleanValue,
      false
    ),
    mobility: readStringField(raw, ['mobility', 'Mobility']),
    notes: readStringField(raw, ['notes', 'Notes', 'note', 'Note']),
    remarks: readStringField(raw, [
      'remarks',
      'Remarks',
      'clinicalNotes',
      'ClinicalNotes',
    ]),
  };
};

export const countPositiveSites = (values: PerioBooleanSiteArray | undefined): number =>
  (values || []).filter(Boolean).length;

const getMaxSiteValue = (values: PerioNumericSiteArray | undefined): number => {
  const numericValues = (values || []).filter(
    (item): item is number => typeof item === 'number' && Number.isFinite(item)
  );

  return numericValues.length > 0 ? Math.max(...numericValues) : 0;
};

const getFurcationLevel = (value?: string): number => {
  const normalized = value?.trim().toUpperCase() || '';
  return FURCATION_SORT_ORDER[normalized] ?? 0;
};

export const getMaxPerioProbingDepth = (item?: PatientPerioChartModel): number =>
  Math.max(getMaxSiteValue(item?.buccalProbingDepth), getMaxSiteValue(item?.lingualProbingDepth));

export const getPerioChartCondition = (item?: PatientPerioChartModel): PerioChartCondition => {
  if (!item) {
    return PerioChartCondition.Healthy;
  }

  const maxProbingDepth = getMaxPerioProbingDepth(item);
  const totalPositiveBop =
    countPositiveSites(item.buccalBleedingOnProbing) +
    countPositiveSites(item.lingualBleedingOnProbing);
  const totalPositivePlaque =
    countPositiveSites(item.buccalPlaque) + countPositiveSites(item.lingualPlaque);
  const furcationLevel = getFurcationLevel(item.furcation);

  if (maxProbingDepth >= 6 || furcationLevel >= 3) {
    return PerioChartCondition.Severe;
  }

  if (maxProbingDepth >= 4 || furcationLevel >= 1) {
    return PerioChartCondition.Moderate;
  }

  if (totalPositiveBop > 0 || totalPositivePlaque > 0) {
    return PerioChartCondition.Watch;
  }

  return PerioChartCondition.Healthy;
};
