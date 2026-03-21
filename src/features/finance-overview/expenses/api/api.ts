import { isAxiosError } from 'axios';

import {
  ExceptionResponse,
  ResponseMethod,
  SuccessResponse,
  toastSuccess,
} from '../../../../common/api/responses';
import { resolveClinicId } from '../../../../common/components/ClinicId';
import { apiClient } from '../../../../common/services/api-client';
import {
  FinanceExpenseModel,
  FinanceExpenseResponseModel,
  FinanceExpenseStateModel,
  getClinicExpenseCategoryLabel,
} from './types';

const FINANCE_EXPENSE_ENDPOINT = '/api/dmd/clinic-expenses/get-clinic-expenses';
const CREATE_FINANCE_EXPENSE_ENDPOINT = '/api/dmd/clinic-expenses/create-clinic-expenses';
const UPDATE_FINANCE_EXPENSE_ENDPOINT = '/api/dmd/clinic-expenses/put-clinic-expenses';
const DELETE_FINANCE_EXPENSE_ENDPOINT = '/api/dmd/clinic-expenses/delete-clinic-expenses';
const FINANCE_EXPENSE_CACHE_TTL_MS = 5000;

const financeExpenseRequestCache = new Map<string, Promise<FinanceExpenseModel[]>>();
const financeExpenseResponseCache = new Map<
  string,
  {
    data: FinanceExpenseModel[];
    cachedAt: number;
  }
>();

const parseDateValue = (value?: string | Date): Date | undefined => {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }

  const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
};

const sortFinanceItems = (left: FinanceExpenseModel, right: FinanceExpenseModel): number => {
  const leftDate = parseDateValue(left.date)?.getTime() ?? 0;
  const rightDate = parseDateValue(right.date)?.getTime() ?? 0;

  if (leftDate !== rightDate) {
    return rightDate - leftDate;
  }

  return getClinicExpenseCategoryLabel(left.category).localeCompare(
    getClinicExpenseCategoryLabel(right.category)
  );
};

const GetClinicExpenseItems = async (clinicId?: string | null): Promise<FinanceExpenseModel[]> => {
  try {
    const response = await apiClient.get<FinanceExpenseModel[]>(FINANCE_EXPENSE_ENDPOINT, {
      params: clinicId?.trim()
        ? {
            ClinicId: clinicId.trim(),
          }
        : undefined,
    });

    return SuccessResponse(response, ResponseMethod.Fetch, undefined, false) || [];
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

const getAllFinanceExpenseRecords = async (
  clinicId?: string | null,
  forceRefresh: boolean = false
): Promise<FinanceExpenseModel[]> => {
  const resolvedClinicId = resolveClinicId(clinicId);

  if (!resolvedClinicId) {
    return [];
  }

  if (forceRefresh) {
    financeExpenseResponseCache.delete(resolvedClinicId);
  }

  const cachedResponse = financeExpenseResponseCache.get(resolvedClinicId);
  if (cachedResponse && Date.now() - cachedResponse.cachedAt < FINANCE_EXPENSE_CACHE_TTL_MS) {
    return cachedResponse.data;
  }

  const activeRequest = financeExpenseRequestCache.get(resolvedClinicId);
  if (activeRequest) {
    return activeRequest;
  }

  const request = (async (): Promise<FinanceExpenseModel[]> => {
    try {
      const items = await GetClinicExpenseItems(resolvedClinicId);
      const sortedItems = [...(items || [])].sort(sortFinanceItems);

      financeExpenseResponseCache.set(resolvedClinicId, {
        data: sortedItems,
        cachedAt: Date.now(),
      });

      return sortedItems;
    } finally {
      financeExpenseRequestCache.delete(resolvedClinicId);
    }
  })();

  financeExpenseRequestCache.set(resolvedClinicId, request);
  return request;
};

const matchesFinanceExpenseSearch = (item: FinanceExpenseModel, keyword: string): boolean => {
  if (!keyword) {
    return true;
  }

  return [
    getClinicExpenseCategoryLabel(item.category),
    item.remarks,
    item.amount,
    parseDateValue(item.date)?.toLocaleDateString('en-US'),
  ]
    .filter((value) => value !== undefined && value !== null && value !== '')
    .some((value) => String(value).toLowerCase().includes(keyword));
};

export const GetFinanceExpenseItems = async (
  state: FinanceExpenseStateModel,
  forceRefresh: boolean = false
): Promise<FinanceExpenseResponseModel> => {
  const resolvedClinicId = resolveClinicId(state.clinicId);
  const pageSize = Math.max(state.pageEnd, 1);

  if (!resolvedClinicId) {
    return {
      items: [],
      pageStart: 0,
      pageEnd: pageSize,
      totalCount: 0,
    };
  }

  const keyword = String(state.search ?? '')
    .trim()
    .toLowerCase();
  const allItems = await getAllFinanceExpenseRecords(resolvedClinicId, forceRefresh);
  const filteredItems = keyword
    ? allItems.filter((item) => matchesFinanceExpenseSearch(item, keyword))
    : allItems;
  const maxPageStart =
    filteredItems.length > 0 ? Math.floor((filteredItems.length - 1) / pageSize) * pageSize : 0;
  const safePageStart = Math.min(state.pageStart, maxPageStart);

  return {
    items: filteredItems.slice(safePageStart, safePageStart + pageSize),
    pageStart: safePageStart,
    pageEnd: pageSize,
    totalCount: filteredItems.length,
  };
};

export const CreateFinanceExpenseItem = async (
  request: FinanceExpenseModel
): Promise<FinanceExpenseModel> => {
  try {
    const response = await apiClient.post<FinanceExpenseModel>(
      CREATE_FINANCE_EXPENSE_ENDPOINT,
      request
    );
    return SuccessResponse(response, ResponseMethod.Create) as FinanceExpenseModel;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const UpdateFinanceExpenseItem = async (
  request: FinanceExpenseModel
): Promise<FinanceExpenseModel> => {
  try {
    const response = await apiClient.put<FinanceExpenseModel>(
      UPDATE_FINANCE_EXPENSE_ENDPOINT,
      request
    );
    return SuccessResponse(response, ResponseMethod.Update) as FinanceExpenseModel;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const DeleteFinanceExpenseItem = async (id?: string): Promise<void> => {
  try {
    await apiClient.delete(DELETE_FINANCE_EXPENSE_ENDPOINT, {
      params: {
        Id: id,
      },
      data: {
        Id: id,
      },
    });
    toastSuccess('Successfully Deleted!');
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};
