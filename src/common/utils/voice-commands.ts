import { formatCurrency } from '../helpers/formatCurrency';
import { GetDashboard } from '../../features/dashboard/api/api';
import { GetPatients } from '../../features/patient/api/api';
import type { PatientModel, PatientStateModel } from '../../features/patient/api/types';

export type VoiceCommandResult = {
  handled: boolean;
  reply?: string;
};

export type VoiceCommandContext = {
  clinicId?: string | null;
  navigate: (path: string) => void;
};

const normalizeText = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const includesAny = (value: string, ...terms: string[]): boolean =>
  terms.some((term) => value.includes(term));

const formatCount = (value?: number): string => Number(value ?? 0).toLocaleString('en-US');

const formatPatientName = (patient: PatientModel): string => {
  const lastName = patient.lastName?.trim();
  const givenNames = [patient.firstName, patient.middleName]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(' ');

  if (!lastName && !givenNames) {
    return patient.patientNumber?.trim() || 'Unknown patient';
  }

  if (!lastName) {
    return givenNames;
  }

  if (!givenNames) {
    return lastName;
  }

  return `${lastName}, ${givenNames}`;
};

const createPatientLookupState = (search: string): PatientStateModel => ({
  items: [],
  load: true,
  initial: 0,
  totalItem: 0,
  pageStart: 0,
  pageEnd: 10,
  search,
  openModal: false,
  isUpdate: false,
  isDelete: false,
  upload: false,
  selectedItem: undefined,
  clinicProfileId: null,
});

const extractPatientQuery = (transcript: string): string | null => {
  const trimmedTranscript = transcript.trim();
  const patterns = [
    /(?:search|find)\s+(?:for\s+)?(?:patient\s+|profile\s+(?:for|of)\s+)?(.+)/i,
    /(?:open|show|view|go to)\s+(?:the\s+)?(?:patient\s+profile\s+(?:for|of)\s+|profile\s+(?:for|of)\s+|patient\s+)(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = trimmedTranscript.match(pattern);
    const nextQuery = match?.[1]?.trim();

    if (!nextQuery) {
      continue;
    }

    const normalizedQuery = normalizeText(nextQuery);
    if (
      includesAny(
        normalizedQuery,
        'dashboard',
        'finance',
        'billing',
        'appointment',
        'settings',
        'inventory',
        'invoice'
      )
    ) {
      return null;
    }

    return nextQuery.replace(/\b(?:please|now|for me)\b/gi, '').trim();
  }

  return null;
};

const selectBestPatientMatch = (items: PatientModel[], query: string): PatientModel | null => {
  if (!items.length) {
    return null;
  }

  const normalizedQuery = normalizeText(query);
  const exactMatch = items.find((item) => normalizeText(formatPatientName(item)) === normalizedQuery);
  if (exactMatch) {
    return exactMatch;
  }

  const includesMatch = items.find((item) =>
    normalizeText(formatPatientName(item)).includes(normalizedQuery)
  );
  if (includesMatch) {
    return includesMatch;
  }

  return items[0];
};

const resolveMetricCommand = async (
  normalizedTranscript: string,
  clinicId?: string | null
): Promise<string | null> => {
  if (
    !includesAny(
      normalizedTranscript,
      'income today',
      'today income',
      'patients today',
      'total patients',
      'pending appointments',
      'scheduled appointments',
      'appointments scheduled',
      'monthly income',
      'income this month',
      'monthly expense',
      'expenses this month'
    )
  ) {
    return null;
  }

  const dashboard = await GetDashboard(clinicId);

  if (includesAny(normalizedTranscript, 'income today', 'today income')) {
    return `Today's income is ${formatCurrency(dashboard.incomeToday)}.`;
  }

  if (includesAny(normalizedTranscript, 'patients today', 'today patients')) {
    return `You have ${formatCount(dashboard.patientsToday)} patient(s) today.`;
  }

  if (includesAny(normalizedTranscript, 'total patients', 'all patients')) {
    return `You currently have ${formatCount(dashboard.totalPatients)} total patient(s).`;
  }

  if (includesAny(normalizedTranscript, 'pending appointments')) {
    return `There are ${formatCount(dashboard.pendingAppointments)} pending appointment(s).`;
  }

  if (includesAny(normalizedTranscript, 'scheduled appointments', 'appointments scheduled')) {
    return `There are ${formatCount(dashboard.scheduledAppointments)} scheduled appointment(s).`;
  }

  if (includesAny(normalizedTranscript, 'monthly income', 'income this month')) {
    return `This month's income is ${formatCurrency(dashboard.totalIncomeMonthly)}.`;
  }

  if (includesAny(normalizedTranscript, 'monthly expense', 'expenses this month')) {
    return `This month's expenses are ${formatCurrency(dashboard.totalExpenseMonthly)}.`;
  }

  return null;
};

const resolveNavigationCommand = (
  normalizedTranscript: string,
  navigate: (path: string) => void
): string | null => {
  const navigationTargets: Array<{ terms: string[]; path: string; reply: string }> = [
    {
      terms: ['dashboard', 'home screen', 'home page', 'go home'],
      path: '/dashboard',
      reply: 'Opening the dashboard.',
    },
    {
      terms: ['patients', 'patient list'],
      path: '/patient',
      reply: 'Opening the patients module.',
    },
    {
      terms: ['appointments', 'appointment'],
      path: '/appointment',
      reply: 'Opening the appointments module.',
    },
    {
      terms: ['billing', 'finance', 'income page', 'finance overview'],
      path: '/finance-overview',
      reply: 'Opening Billing and Finance.',
    },
    {
      terms: ['inventory', 'inventories'],
      path: '/inventory',
      reply: 'Opening the inventories module.',
    },
    {
      terms: ['invoice', 'invoice generator'],
      path: '/invoice-generator',
      reply: 'Opening the invoice generator.',
    },
    {
      terms: ['settings', 'clinic settings'],
      path: '/settings',
      reply: 'Opening settings.',
    },
  ];

  const matchesNavigationIntent = includesAny(
    normalizedTranscript,
    'open',
    'go to',
    'show',
    'view',
    'take me to'
  );

  if (!matchesNavigationIntent) {
    return null;
  }

  const matchedTarget = navigationTargets.find((target) =>
    target.terms.some((term) => normalizedTranscript.includes(term))
  );

  if (!matchedTarget) {
    return null;
  }

  navigate(matchedTarget.path);
  return matchedTarget.reply;
};

export const runVoiceAssistantCommand = async (
  transcript: string,
  context: VoiceCommandContext
): Promise<VoiceCommandResult> => {
  const normalizedTranscript = normalizeText(transcript);

  if (!normalizedTranscript) {
    return {
      handled: true,
      reply: 'I did not catch anything that time. Please try again.',
    };
  }

  const metricReply = await resolveMetricCommand(normalizedTranscript, context.clinicId);
  if (metricReply) {
    return {
      handled: true,
      reply: metricReply,
    };
  }

  const patientQuery = extractPatientQuery(transcript);
  if (patientQuery) {
    const response = await GetPatients(createPatientLookupState(patientQuery), context.clinicId, true);
    const selectedPatient = selectBestPatientMatch(response.items, patientQuery);

    if (!selectedPatient?.id) {
      return {
        handled: true,
        reply: `I could not find a patient named "${patientQuery}".`,
      };
    }

    const patientName = formatPatientName(selectedPatient);
    context.navigate(`/patient-profile/${selectedPatient.id}`);

    if (response.items.length > 1) {
      return {
        handled: true,
        reply: `I found multiple matches, so I'm opening the closest match: ${patientName}.`,
      };
    }

    return {
      handled: true,
      reply: `Opening the profile for ${patientName}.`,
    };
  }

  const navigationReply = resolveNavigationCommand(normalizedTranscript, context.navigate);
  if (navigationReply) {
    return {
      handled: true,
      reply: navigationReply,
    };
  }

  return {
    handled: false,
  };
};

export default runVoiceAssistantCommand;
