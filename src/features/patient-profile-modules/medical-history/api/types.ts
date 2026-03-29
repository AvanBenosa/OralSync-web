import type { PatientProfileMobileReloadConfig } from '../../../patient-profile/api/types';

export const MEDICAL_HISTORY_CONDITION_OPTIONS = [
  'AIDS or HIV Infection',
  'Anemia',
  'Angina',
  'Arthritis / Rheumatism',
  'Asthma',
  'Bleeding Problems',
  'Blood Diseases',
  'Cancer / Tumor',
  'Chest Pain',
  'Diabetes',
  'Emphysema',
  'Epilepsy/Convulsions',
  'Fainting Seizure',
  'Hay Fever / Allergies',
  'Head Injuries',
  'Heart Attack',
  'Heart Disease',
  'Heart Murmur',
  'Heart Surgery',
  'Hepatitis / Liver Disease',
  'High Blood Pressure',
  'Joint Replacement Implant',
  'Kidney Disease',
  'Low Blood Pressure',
  'Radiation Therapy',
  'Rapid Weight Loss',
  'Respiratory Problems',
  'Rheumatic Fever',
  'Sexually Transmitted Disease (STD)',
  'Stomach Troubles / Ulcers',
  'Stroke',
  'Swollen Ankles',
  'Thyroid Problem',
  'Tuberculosis',
] as const;

export type MedicalHistoryCondition = (typeof MEDICAL_HISTORY_CONDITION_OPTIONS)[number];

const medicalHistoryConditionOptionSet = new Set<string>(MEDICAL_HISTORY_CONDITION_OPTIONS);

const toMedicalHistoryCondition = (value: string): MedicalHistoryCondition | undefined => {
  const normalizedValue = value.trim();

  if (!normalizedValue || !medicalHistoryConditionOptionSet.has(normalizedValue)) {
    return undefined;
  }

  return normalizedValue as MedicalHistoryCondition;
};

const appendMedicalHistoryConditions = (
  source: unknown,
  conditions: Set<MedicalHistoryCondition>
): void => {
  if (!source) {
    return;
  }

  if (Array.isArray(source)) {
    source.forEach((item) => appendMedicalHistoryConditions(item, conditions));
    return;
  }

  if (typeof source === 'string') {
    const trimmedValue = source.trim();
    if (!trimmedValue) {
      return;
    }

    const looksSerializedJson =
      (trimmedValue.startsWith('[') && trimmedValue.endsWith(']')) ||
      (trimmedValue.startsWith('{') && trimmedValue.endsWith('}')) ||
      (trimmedValue.startsWith('"') && trimmedValue.endsWith('"'));

    if (looksSerializedJson) {
      try {
        appendMedicalHistoryConditions(JSON.parse(trimmedValue), conditions);
        return;
      } catch {
        // Fall back to plain text parsing when the string is not valid JSON.
      }
    }

    trimmedValue
      .split(/[\r\n,;]+/)
      .map((item) => toMedicalHistoryCondition(item))
      .filter((item): item is MedicalHistoryCondition => Boolean(item))
      .forEach((item) => conditions.add(item));

    return;
  }

  if (typeof source === 'object') {
    Object.entries(source as Record<string, unknown>).forEach(([key, value]) => {
      if (value) {
        const condition = toMedicalHistoryCondition(key);
        if (condition) {
          conditions.add(condition);
        }
      }
    });
  }
};

export const normalizeMedicalHistoryConditions = (value?: unknown): MedicalHistoryCondition[] => {
  const conditions = new Set<MedicalHistoryCondition>();

  appendMedicalHistoryConditions(value, conditions);

  return MEDICAL_HISTORY_CONDITION_OPTIONS.filter((option) => conditions.has(option));
};

export const getMedicalHistoryConditionSummary = (value?: unknown, others?: string): string => {
  const selectedConditions = normalizeMedicalHistoryConditions(value);
  const otherCondition = others?.trim();

  if (selectedConditions.length === 0 && !otherCondition) {
    return '--';
  }

  if (!otherCondition) {
    return selectedConditions.join(', ');
  }

  return [...selectedConditions, `Others: ${otherCondition}`].join(', ');
};

export type PatientMedicalHistoryProps = {
  patientId?: string | undefined;
  patientLabel?: string;
  onRegisterMobileReload?: (config?: PatientProfileMobileReloadConfig) => void;
};

export type PatientMedicalHistoryModel = {
  patientInfoId?: string;
  id?: string;
  date?: string | Date;
  q1?: boolean;
  q2?: boolean;
  q3?: boolean;
  q4?: boolean;
  q5?: boolean;
  q6?: boolean;
  q7?: boolean;
  q8?: boolean;
  q9?: boolean;
  q10Nursing?: boolean;
  q10Pregnant?: boolean;
  q11Conditions?: MedicalHistoryCondition[];
  others?: string;
  remarks?: string;
};

export type PatientMedicalHistoryStateModel = {
  patientId?: string;
  items: PatientMedicalHistoryModel[];
  load: boolean;

  openModal: boolean;
  isUpdate: boolean;
  isDelete: boolean;
  selectedItem?: PatientMedicalHistoryModel;
  notFound?: boolean;
};

export type PatientMedicalHistoryStateProps = {
  state: PatientMedicalHistoryStateModel;
  setState: Function;
  onReload?: () => void;
};
