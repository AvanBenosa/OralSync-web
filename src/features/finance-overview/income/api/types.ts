import type { PatientProgressNoteModel } from '../../../patient-profile-modules/progress-note/api/types';
import type { FinanceModuleStateModel, FinanceModuleStateProps } from '../../api/types';

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

export type FinanceIncomeStateModel = FinanceModuleStateModel<FinanceIncomeModel>;

export type FinanceIncomeStateProps = FinanceModuleStateProps<FinanceIncomeModel>;
