import {
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
  setState((prev: FinanceExpenseStateModel) => ({
    ...prev,
    ...state,
    load: false,
    items: response.items || [],
    pageStart: response.pageStart,
    pageEnd: response.pageEnd,
    totalItem: response.totalCount,
  }));
};

export const HandleCreateFinanceExpenseItem = async (
  request: FinanceExpenseModel
): Promise<FinanceExpenseModel> => CreateFinanceExpenseItem(request);

export const HandleUpdateFinanceExpenseItem = async (
  request: FinanceExpenseModel
): Promise<FinanceExpenseModel> => UpdateFinanceExpenseItem(request);

export const HandleDeleteFinanceExpenseItem = async (request: FinanceExpenseModel): Promise<void> =>
  DeleteFinanceExpenseItem(request.id);
