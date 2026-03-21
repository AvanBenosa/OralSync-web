import type { PatientProgressNoteModel } from '../../patient-profile-modules/progress-note/api/types';
import {
  CreateFinanceIncomeItem,
  DeleteFinanceIncomeItem,
  GetFinanceIncomeItems,
  UpdateFinanceIncomeItem,
} from './api';
import type { FinanceIncomeModel, FinanceOverviewStateModel } from './types';

export const HandleGetFinanceIncomeItems = async (
  state: FinanceOverviewStateModel,
  setState: Function,
  forceRefresh: boolean = false
): Promise<void> => {
  const response = await GetFinanceIncomeItems(state, forceRefresh);
  setState((prev: FinanceOverviewStateModel) => ({
    ...prev,
    ...state,
    load: false,
    items: response.items || [],
    pageStart: response.pageStart,
    pageEnd: response.pageEnd,
    totalItem: response.totalCount,
  }));
};

export const HandleCreateFinanceIncomeItem = async (
  request: PatientProgressNoteModel
): Promise<PatientProgressNoteModel> => CreateFinanceIncomeItem(request);

export const HandleUpdateFinanceIncomeItem = async (
  request: PatientProgressNoteModel
): Promise<PatientProgressNoteModel> => UpdateFinanceIncomeItem(request);

export const HandleDeleteFinanceIncomeItem = async (
  request: FinanceIncomeModel
): Promise<void> => DeleteFinanceIncomeItem(request.patientInfoId, request.id);
