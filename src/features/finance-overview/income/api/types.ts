import type { PatientProgressNoteModel } from '../../../patient-profile-modules/progress-note/api/types';
import type {
  FinanceIncomeSummaryModel,
  FinanceModuleStateModel,
} from '../../api/types';

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
  FinanceIncomeSummaryModel;

export type FinanceIncomeStateProps = {
  state: FinanceIncomeStateModel;
  setState: Function;
  clinicId?: string | null;
  onReload?: () => void;
};
