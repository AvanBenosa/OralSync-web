import type { PatientProgressNoteModel } from '../../../patient-profile-modules/progress-note/api/types';
import {
  ApplyFinanceIncomeMutationLocally,
  CreateFinanceIncomeItem,
  DeleteFinanceIncomeItem,
  GetFinanceIncomeItems,
  UpdateFinanceIncomeItem,
} from './api';
import type { FinanceIncomeModel, FinanceIncomeStateModel } from './types';

export const HandleGetFinanceIncomeItems = async (
  state: FinanceIncomeStateModel,
  setState: Function,
  forceRefresh: boolean = false
): Promise<void> => {
  const response = await GetFinanceIncomeItems(state, forceRefresh);
  setState({
    ...state,
    load: false,
    items: response.items || [],
    pageStart: response.pageStart,
    pageEnd: response.pageEnd,
    totalItem: response.totalCount,
    amount: response.amount,
    hasDateFilter: response.hasDateFilter,
  });
};

export const HandleCreateFinanceIncomeItem = async (
  request: PatientProgressNoteModel,
  state: FinanceIncomeStateModel,
  setState: Function
): Promise<void> => {
  const response = await CreateFinanceIncomeItem(request);
  setState((prev: FinanceIncomeStateModel) => {
    const nextState = ApplyFinanceIncomeMutationLocally(
      prev,
      response as FinanceIncomeModel
    );

    return {
      ...prev,
      load: false,
      openModal: false,
      isUpdate: false,
      isDelete: false,
      selectedItem: undefined,
      items: nextState.items || [],
      pageStart: nextState.pageStart,
      pageEnd: nextState.pageEnd,
      totalItem: nextState.totalCount,
      amount: nextState.amount,
      hasDateFilter: nextState.hasDateFilter,
    };
  });
};

export const HandleUpdateFinanceIncomeItem = async (
  request: PatientProgressNoteModel,
  state: FinanceIncomeStateModel,
  setState: Function
): Promise<void> => {
  const response = await UpdateFinanceIncomeItem(request);
  setState((prev: FinanceIncomeStateModel) => {
    const nextState = ApplyFinanceIncomeMutationLocally(
      prev,
      response as FinanceIncomeModel,
      prev.selectedItem
    );

    return {
      ...prev,
      load: false,
      items: nextState.items || [],
      pageStart: nextState.pageStart,
      pageEnd: nextState.pageEnd,
      totalItem: nextState.totalCount,
      amount: nextState.amount,
      hasDateFilter: nextState.hasDateFilter,
      selectedItem: undefined,
      openModal: false,
      isUpdate: false,
      isDelete: false,
    };
  });
};

export const HandleDeleteFinanceIncomeItem = async (
  request: FinanceIncomeModel,
  state: FinanceIncomeStateModel,
  setState: Function
): Promise<void> => {
  await DeleteFinanceIncomeItem(request.patientInfoId, request.id);

  setState((prev: FinanceIncomeStateModel) => {
    const selectedId = prev.selectedItem?.id ?? request.id;

    const nextItems = prev.items.filter(
      (item) => selectedId === undefined || item.id !== selectedId
    );

    return {
      ...prev,
      items: nextItems,
      selectedItem: undefined,
      openModal: false,
      isUpdate: false,
      isDelete: false,
      totalItem: Math.max(prev.totalItem - 1, 0),
    };
  });
};
