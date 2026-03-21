import {
  ApplyFinanceExpenseMutationLocally,
  CreateFinanceExpenseItem,
  DeleteFinanceExpenseItem,
  GetFinanceExpenseItems,
  UpdateFinanceExpenseItem,
} from './api';
import type { FinanceExpenseModel, FinanceExpenseStateModel } from './types';

export const HandleGetFinanceExpenseItems = async (
  state: FinanceExpenseStateModel,
  setState: Function,
  forceRefresh: boolean = false
): Promise<void> => {
  const response = await GetFinanceExpenseItems(state, forceRefresh);
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

export const HandleCreateFinanceExpenseItem = async (
  request: FinanceExpenseModel,
  state: FinanceExpenseStateModel,
  setState: Function
): Promise<void> => {
  const response = await CreateFinanceExpenseItem(request);
  setState((prev: FinanceExpenseStateModel) => {
    const nextState = ApplyFinanceExpenseMutationLocally(prev, response);

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

export const HandleUpdateFinanceExpenseItem = async (
  request: FinanceExpenseModel,
  state: FinanceExpenseStateModel,
  setState: Function
): Promise<void> => {
  const response = await UpdateFinanceExpenseItem(request);
  setState((prev: FinanceExpenseStateModel) => {
    const nextState = ApplyFinanceExpenseMutationLocally(prev, response, prev.selectedItem);

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

export const HandleDeleteFinanceExpenseItem = async (
  request: FinanceExpenseModel,
  state: FinanceExpenseStateModel,
  setState: Function
): Promise<void> => {
  await DeleteFinanceExpenseItem(request.id);

  setState((prev: FinanceExpenseStateModel) => {
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
