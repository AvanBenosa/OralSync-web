import type { PatientProfileMobileReloadConfig } from '../../../patient-profile/api/types';

export const PATIENT_APPOINTMENT_STATUS_OPTIONS = [
  'Pending',
  'Scheduled',
  'Completed',
  'Cancelled',
  'NoShow',
] as const;

export const PATIENT_APPOINTMENT_TYPE_OPTIONS = ['Online', 'WalkIn'] as const;

export type PatientAppointmentStatus = (typeof PATIENT_APPOINTMENT_STATUS_OPTIONS)[number];
export type PatientAppointmentType = (typeof PATIENT_APPOINTMENT_TYPE_OPTIONS)[number];

export type PatientAppointmentRecordProps = {
  patientId?: string | undefined;
  patientLabel?: string;
  onRegisterMobileReload?: (config?: PatientProfileMobileReloadConfig) => void;
};

export type PatientAppointmentRecordModel = {
  id?: string;
  patientInfoId?: string;
  appointmentDateFrom?: string | Date;
  appointmentDateTo?: string | Date;
  reasonForVisit?: string;
  status?: string;
  remarks?: string;
  patientName?: string;
  patientNumber?: string;
  appointmentType?: string;
};

export type PatientAppointmentRecordStateModel = {
  patientId?: string;
  items: PatientAppointmentRecordModel[];
  load: boolean;

  openModal: boolean;
  isUpdate: boolean;
  isDelete: boolean;
  selectedItem?: PatientAppointmentRecordModel;
  notFound?: boolean;
};

export type PatientAppointmentRecordStateProps = {
  state: PatientAppointmentRecordStateModel;
  setState: Function;
  onReload?: () => void;
};
