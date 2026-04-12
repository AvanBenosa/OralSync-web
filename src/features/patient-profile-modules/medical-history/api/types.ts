import type { PatientProfileMobileReloadConfig } from '../../../patient-profile/api/types';

export const MEDICAL_HISTORY_CONDITION_GROUPS = [
  {
    title: 'Heart & Blood Pressure',
    options: [
      'Heart condition',
      'Irregular heartbeat',
      'Chest discomfort',
      'High blood pressure',
      'Low blood pressure',
    ],
  },
  {
    title: 'Breathing & Lungs',
    options: ['Breathing problem', 'Asthma-like symptoms', 'Chronic cough'],
  },
  {
    title: 'Metabolic & Hormones',
    options: ['Diabetes or sugar problem', 'Thyroid condition', 'Hormonal imbalance'],
  },
  {
    title: 'Blood & Circulation',
    options: ['Blood disorder', 'Easy bleeding or bruising'],
  },
  {
    title: 'Brain & Nerves',
    options: [
      'Frequent headaches',
      'Dizziness or fainting',
      'Seizure history',
      'Nerve-related condition',
    ],
  },
  {
    title: 'Bones & Joints',
    options: ['Joint or bone issue', 'Arthritis-like pain'],
  },
  {
    title: 'Digestive System',
    options: ['Stomach or digestive issues', 'Acid reflux'],
  },
  {
    title: 'Organs (Liver & Kidney)',
    options: ['Liver problem', 'Kidney problem'],
  },
  {
    title: 'Allergies & Sensitivities',
    options: ['Allergies', 'Skin sensitivity'],
  },
  {
    title: 'Infections & Immune',
    options: ['Ongoing infection', 'Immune system condition'],
  },
  {
    title: 'Medical History',
    options: ['Past serious illness', 'History of surgery', 'Medical implants or devices'],
  },
  {
    title: 'General Health',
    options: [
      'Recent weight changes',
      'Fatigue or low energy',
      'Sleep problems',
      'Mental health condition',
    ],
  },
] as const;

export type MedicalHistoryCondition =
  (typeof MEDICAL_HISTORY_CONDITION_GROUPS)[number]['options'][number];

export const MEDICAL_HISTORY_CONDITION_OPTIONS: readonly MedicalHistoryCondition[] =
  MEDICAL_HISTORY_CONDITION_GROUPS.reduce<MedicalHistoryCondition[]>(
    (conditions, group) => [...conditions, ...group.options],
    []
  );

const LEGACY_MEDICAL_HISTORY_CONDITION_ALIASES: Record<string, MedicalHistoryCondition> = {
  'AIDS or HIV Infection': 'Immune system condition',
  Anemia: 'Blood disorder',
  Angina: 'Chest discomfort',
  'Arthritis / Rheumatism': 'Arthritis-like pain',
  Asthma: 'Asthma-like symptoms',
  'Bleeding Problems': 'Easy bleeding or bruising',
  'Blood Diseases': 'Blood disorder',
  'Cancer / Tumor': 'Past serious illness',
  'Chest Pain': 'Chest discomfort',
  Diabetes: 'Diabetes or sugar problem',
  Emphysema: 'Breathing problem',
  'Epilepsy/Convulsions': 'Seizure history',
  'Fainting Seizure': 'Dizziness or fainting',
  'Hay Fever / Allergies': 'Allergies',
  'Head Injuries': 'Nerve-related condition',
  'Heart Attack': 'Heart condition',
  'Heart Disease': 'Heart condition',
  'Heart Murmur': 'Irregular heartbeat',
  'Heart Surgery': 'History of surgery',
  'Hepatitis / Liver Disease': 'Liver problem',
  'High Blood Pressure': 'High blood pressure',
  'Joint Replacement Implant': 'Medical implants or devices',
  'Kidney Disease': 'Kidney problem',
  'Low Blood Pressure': 'Low blood pressure',
  'Radiation Therapy': 'Past serious illness',
  'Rapid Weight Loss': 'Recent weight changes',
  'Respiratory Problems': 'Breathing problem',
  'Rheumatic Fever': 'Past serious illness',
  'Sexually Transmitted Disease (STD)': 'Ongoing infection',
  'Stomach Troubles / Ulcers': 'Stomach or digestive issues',
  Stroke: 'Nerve-related condition',
  'Swollen Ankles': 'Heart condition',
  'Thyroid Problem': 'Thyroid condition',
  Tuberculosis: 'Ongoing infection',
};

const medicalHistoryConditionOptionSet = new Set<string>(MEDICAL_HISTORY_CONDITION_OPTIONS);

const toMedicalHistoryCondition = (value: string): MedicalHistoryCondition | undefined => {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return undefined;
  }

  const resolvedValue =
    LEGACY_MEDICAL_HISTORY_CONDITION_ALIASES[normalizedValue] ?? normalizedValue;

  if (!medicalHistoryConditionOptionSet.has(resolvedValue)) {
    return undefined;
  }

  return resolvedValue as MedicalHistoryCondition;
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
