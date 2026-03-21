import type { PatientProfileMobileReloadConfig } from '../../../patient-profile/api/types';

export enum ProgressNoteCategory {
  Consultation = 'Consultation',
  OralProphylaxisCleaning = 'Oral Prophylaxis (Cleaning)',
  Restoration = 'Restoration',
  Extraction = 'Extraction',
  Surgery = 'Surgery',
  Endodontics = 'Endodontics',
  Cosmetics = 'Cosmetics',
  Prosthodontics = 'Prosthodontics',
  Orthodontics = 'Orthodontics',
  Periodontics = 'Periodontics',
  TeethWhitening = 'Teeth Whitening',
  PeriapicalRadiograph = 'Periapical Radiograph',
}

export enum ProgressNoteAccount {
  Cash = 'Cash',
  GCash = 'GCash',
  PosTerminal = 'Pos terminal',
  CreditCard = 'Credit card',
}

export const PROGRESS_NOTE_CATEGORY_OPTIONS = Object.values(ProgressNoteCategory);
export const PROGRESS_NOTE_ACCOUNT_OPTIONS = Object.values(ProgressNoteAccount);

export type PatientProgressNoteProps = {
  patientId?: string | undefined;
  patientLabel?: string;
  onRegisterMobileReload?: (config?: PatientProfileMobileReloadConfig) => void;
};

export type PatientProgressNoteModel = {
  patientInfoId?: string;
  patientName?: string;
  patientNumber?: string;
  id?: string;
  assignedDoctor?: string;
  date?: string | Date;
  procedure?: string;
  category?: ProgressNoteCategory;
  remarks?: string;

  // Payment Details
  account?: ProgressNoteAccount;
  amount?: number;
  discount?: number;
  totalAmountDue?: number;
  amountPaid?: number;
  balance?: number;
};

export type PatientProgressNoteStateModel = {
  patientId?: string;
  items: PatientProgressNoteModel[];
  load: boolean;

  openModal: boolean;
  isUpdate: boolean;
  isDelete: boolean;
  selectedItem?: PatientProgressNoteModel;
  notFound?: boolean;
};

export type PatientProgressNoteStateProps = {
  state: PatientProgressNoteStateModel;
  setState: Function;
  onReload?: () => void;
};
