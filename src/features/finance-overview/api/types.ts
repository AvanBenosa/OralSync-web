import type { PatientProgressNoteModel } from '../../patient-profile-modules/progress-note/api/types';

export type FinanceOverviewProps = {
  clinicId?: string;
};

export type FinanceViewTab = 'income' | 'expenses';

export type FinanceIncomeModel = PatientProgressNoteModel & {
  patientName?: string;
  patientNumber?: string;
};

export type FinanceIncomeResponseModel = {
  items: FinanceIncomeModel[];
  pageStart: number;
  pageEnd: number;
  totalCount: number;
};

export type FinanceOverviewStateModel = {
  items: FinanceIncomeModel[];
  load: boolean;
  initial: number;
  totalItem: number;
  pageStart: number;
  pageEnd: number;
  search?: string;
  openModal: boolean;
  isUpdate: boolean;
  isDelete: boolean;
  selectedItem?: FinanceIncomeModel;
  clinicId?: string | null;
};

export type FinanceOverviewStateProps = {
  state: FinanceOverviewStateModel;
  setState: Function;
  clinicId?: string | null;
  onReload?: () => void;
};
