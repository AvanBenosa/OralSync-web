import type { PatientProgressNoteModel } from '../../../patient-profile-modules/progress-note/api/types';
import type { FinanceIncomeSummaryModel, FinanceModuleStateModel } from '../../api/types';

export type FinanceIncomeStatusFilter = 'all' | 'pending' | 'paid';

export const FINANCE_INCOME_STATUS_LABELS: Record<FinanceIncomeStatusFilter, string> = {
  all: 'All statuses',
  pending: 'Pending balance',
  paid: 'Fully paid',
};

export type FinanceIncomeModel = PatientProgressNoteModel & {
  patientName?: string;
  patientNumber?: string;
};

export type FinanceIncomeResponseModel = {
  items: FinanceIncomeModel[];
  pageStart: number;
  pageEnd: number;
  totalCount: number;
} & FinanceIncomeSummaryModel;

export type FinanceIncomeStateModel = FinanceModuleStateModel<FinanceIncomeModel> &
  FinanceIncomeSummaryModel & {
    statusFilter?: FinanceIncomeStatusFilter;
  };

export type FinanceIncomeStateProps = {
  state: FinanceIncomeStateModel;
  setState: Function;
  clinicId?: string | null;
  onReload?: () => void;
};
