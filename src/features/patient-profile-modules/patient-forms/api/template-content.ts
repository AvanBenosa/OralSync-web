import { ClinicProfileModel } from '../../../settings/clinic-profile/api/types';
import { PatientProfileModel } from '../../../patient-profile/api/types';
import { PatientFormModel } from './types';

type PatientFormTemplateContext = {
  patientProfile?: PatientProfileModel | null;
  clinicProfile?: ClinicProfileModel | null;
  assignedDoctor?: string;
  date?: string | Date;
};

const RICH_TEXT_TOKEN_GAP = String.raw`(?:\s|&nbsp;|\u00A0|\u200B|\u200C|\u200D|\uFEFF|<[^>]+>)*`;

const createSafeFileSegment = (value?: string): string =>
  (value || '')
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const parseDateValue = (value?: string | Date): Date | undefined => {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
};

export const formatPatientFormDisplayDate = (value?: string | Date): string => {
  const date = parseDateValue(value);
  if (!date) {
    return '--';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(date);
};

export const buildPatientFormPatientName = (
  patientProfile?: PatientProfileModel | null
): string => {
  const firstName = patientProfile?.firstName?.trim();
  const lastName = patientProfile?.lastName?.trim();

  if (lastName && firstName) {
    return `${lastName}, ${firstName}`;
  }

  if (lastName) {
    return lastName;
  }

  if (firstName) {
    return firstName;
  }

  const fallbackName = [patientProfile?.firstName?.trim(), patientProfile?.middleName?.trim()]
    .filter(Boolean)
    .join(' ');

  if (fallbackName) {
    return fallbackName;
  }

  return patientProfile?.patientNumber || 'Patient';
};

export const buildPatientFormPdfFileName = (
  item: PatientFormModel,
  patientProfile?: PatientProfileModel | null
): string => {
  const patientName = createSafeFileSegment(buildPatientFormPatientName(patientProfile));
  const formTitle = createSafeFileSegment(item.formType?.trim() || 'Patient Form');
  const fileName = [patientName, formTitle].filter(Boolean).join(' - ');

  return `${fileName || 'Patient Form'}.pdf`;
};

const replaceTemplatePlaceholders = (
  html: string,
  replacements: Array<{ patterns: RegExp[]; value: string }>
): string =>
  replacements.reduce(
    (resolvedHtml, replacement) =>
      replacement.patterns.reduce(
        (updatedHtml, pattern) => updatedHtml.replace(pattern, replacement.value),
        resolvedHtml
      ),
    html
  );

export const resolvePatientFormTemplateContent = (
  html: string,
  context: PatientFormTemplateContext
): string => {
  const patientName = buildPatientFormPatientName(context.patientProfile);
  const patientFirstName = context.patientProfile?.firstName?.trim() || '';
  const patientLastName = context.patientProfile?.lastName?.trim() || '';
  const patientAddress = context.patientProfile?.address?.trim() || '--';
  const clinicName = context.clinicProfile?.clinicName?.trim() || 'Clinic';
  const reportDate = formatPatientFormDisplayDate(context.date);
  const assignedDoctor = context.assignedDoctor?.trim() || '--';

  return replaceTemplatePlaceholders(html, [
    {
      patterns: [
        /%\s*Patient\s*Name\s*%?/gi,
        /\{\{\s*Patient\s*Name\s*\}\}/gi,
        /\[\[\s*Patient\s*Name\s*\]\]/gi,
      ],
      value: patientName,
    },
    {
      patterns: [
        /%\s*Patient\s*First\s*Name\s*%?/gi,
        /\{\{\s*Patient\s*First\s*Name\s*\}\}/gi,
        /\[\[\s*Patient\s*First\s*Name\s*\]\]/gi,
      ],
      value: patientFirstName,
    },
    {
      patterns: [
        /%\s*Patient\s*Last\s*Name\s*%?/gi,
        /\{\{\s*Patient\s*Last\s*Name\s*\}\}/gi,
        /\[\[\s*Patient\s*Last\s*Name\s*\]\]/gi,
      ],
      value: patientLastName,
    },
    {
      patterns: [
        /%\s*Patient\s*Address\s*%?/gi,
        /\{\{\s*Patient\s*Address\s*\}\}/gi,
        /\[\[\s*Patient\s*Address\s*\]\]/gi,
      ],
      value: patientAddress,
    },
    {
      patterns: [
        /%\s*Clinic\s*Name(?:\s*%)?/gi,
        /(?:c\s*)?%\s*(?:c\s*)?Clinic\s*Name(?:\s*%)?/gi,
        new RegExp(
          String.raw`(?:c${RICH_TEXT_TOKEN_GAP})?%${RICH_TEXT_TOKEN_GAP}(?:c${RICH_TEXT_TOKEN_GAP})?Clinic${RICH_TEXT_TOKEN_GAP}Name(?:${RICH_TEXT_TOKEN_GAP}%)?`,
          'gi'
        ),
        /\{\{\s*Clinic\s*Name\s*\}\}/gi,
        /\[\[\s*Clinic\s*Name\s*\]\]/gi,
      ],
      value: clinicName,
    },
    {
      patterns: [
        /%\s*Assigned\s*Doctor\s*%?/gi,
        /%\s*Assigned\s*Dentist\s*%?/gi,
        /\{\{\s*Assigned\s*Doctor\s*\}\}/gi,
        /\{\{\s*Assigned\s*Dentist\s*\}\}/gi,
        /\[\[\s*Assigned\s*Doctor\s*\]\]/gi,
        /\[\[\s*Assigned\s*Dentist\s*\]\]/gi,
      ],
      value: assignedDoctor,
    },
    {
      patterns: [/%\s*Date(?:\s*%)?/gi, /\{\{\s*Date\s*\}\}/gi, /\[\[\s*Date\s*\]\]/gi],
      value: reportDate,
    },
  ]);
};
