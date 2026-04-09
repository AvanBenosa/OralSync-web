import { isAxiosError } from 'axios';

import {
  ExceptionResponse,
  ResponseMethod,
  SuccessResponse,
  toastSuccess,
} from '../../../../common/api/responses';
import { resolveClinicId } from '../../../../common/components/ClinicId';
import { apiClient } from '../../../../common/services/api-client';
import { useAuthStore } from '../../../../common/store/authStore';
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

const buildFinanceExpenseCacheKey = (
  clinicId?: string | null,
  dateFrom?: string,
  dateTo?: string
): string => {
  const resolvedClinicId = resolveClinicId(clinicId);
  const branchId = useAuthStore.getState().branchId?.trim() || '';

  return [
    resolvedClinicId ?? 'current-clinic',
    branchId || 'all-branches',
    dateFrom?.trim() || 'any-from',
    dateTo?.trim() || 'any-to',
  ].join('|');
};

const getFinanceExpenseCacheKeyPrefix = (clinicId?: string | null): string | undefined => {
  const resolvedClinicId = resolveClinicId(clinicId);

  return resolvedClinicId ? `${resolvedClinicId}|` : undefined;
};

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

const isSameCalendarDate = (left: Date, right: Date): boolean =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const isWithinInclusiveDateRange = (
  itemDate: Date,
  dateFrom?: string,
  dateTo?: string
): boolean => {
  const fromDate = parseDateValue(dateFrom);
  const toDate = parseDateValue(dateTo);

  if (fromDate && itemDate < fromDate) {
    return false;
  }

  if (toDate && itemDate > toDate) {
    return false;
  }

  return true;
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

const GetClinicExpenseItems = async (
  clinicId?: string | null,
  dateFrom?: string,
  dateTo?: string
): Promise<FinanceExpenseModel[]> => {
  try {
    const branchId = useAuthStore.getState().branchId?.trim() || '';
    const response = await apiClient.get<FinanceExpenseModel[]>(FINANCE_EXPENSE_ENDPOINT, {
      params: {
        ClinicId: clinicId?.trim() || undefined,
        BranchId: branchId || undefined,
        DateFrom: dateFrom?.trim() || undefined,
        DateTo: dateTo?.trim() || undefined,
      },
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
  dateFrom?: string,
  dateTo?: string,
  forceRefresh: boolean = false
): Promise<FinanceExpenseModel[]> => {
  const resolvedClinicId = resolveClinicId(clinicId);
  const cacheKey = buildFinanceExpenseCacheKey(resolvedClinicId, dateFrom, dateTo);

  if (!resolvedClinicId) {
    return [];
  }

  if (forceRefresh) {
    financeExpenseResponseCache.delete(cacheKey);
  }

  const cachedResponse = financeExpenseResponseCache.get(cacheKey);
  if (cachedResponse && Date.now() - cachedResponse.cachedAt < FINANCE_EXPENSE_CACHE_TTL_MS) {
    return cachedResponse.data;
  }

  const activeRequest = financeExpenseRequestCache.get(cacheKey);
  if (activeRequest) {
    return activeRequest;
  }

  const request = (async (): Promise<FinanceExpenseModel[]> => {
    try {
      const items = await GetClinicExpenseItems(resolvedClinicId, dateFrom, dateTo);
      const sortedItems = [...(items || [])].sort(sortFinanceItems);

      financeExpenseResponseCache.set(cacheKey, {
        data: sortedItems,
        cachedAt: Date.now(),
      });

      return sortedItems;
    } finally {
      financeExpenseRequestCache.delete(cacheKey);
    }
  })();

  financeExpenseRequestCache.set(cacheKey, request);
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

const buildFinanceExpenseResponse = (
  state: FinanceExpenseStateModel,
  allItems: FinanceExpenseModel[]
): FinanceExpenseResponseModel => {
  const pageSize = Math.max(state.pageEnd, 1);
  const keyword = String(state.search ?? '')
    .trim()
    .toLowerCase();
  const filteredItems = keyword
    ? allItems.filter((item) => matchesFinanceExpenseSearch(item, keyword))
    : allItems;
  const hasDateFilter = Boolean(
    String(state.dateFrom ?? '').trim() || String(state.dateTo ?? '').trim()
  );
  const today = new Date();
  const summaryItems = hasDateFilter
    ? filteredItems
    : filteredItems.filter((item) => {
        const itemDate = parseDateValue(item.date);
        return itemDate ? isSameCalendarDate(itemDate, today) : false;
      });
  const summaryAmount = summaryItems.reduce(
    (total, item) => total + Number(item.amount ?? 0),
    0
  );
  const maxPageStart =
    filteredItems.length > 0 ? Math.floor((filteredItems.length - 1) / pageSize) * pageSize : 0;
  const safePageStart = Math.min(state.pageStart, maxPageStart);

  return {
    items: filteredItems.slice(safePageStart, safePageStart + pageSize),
    pageStart: safePageStart,
    pageEnd: pageSize,
    totalCount: filteredItems.length,
    amount: summaryAmount,
    hasDateFilter,
  };
};

const invalidateOtherFinanceExpenseCaches = (
  clinicId?: string | null,
  currentCacheKey?: string
): void => {
  const cacheKeyPrefix = getFinanceExpenseCacheKeyPrefix(clinicId);

  if (!cacheKeyPrefix) {
    return;
  }

  Array.from(financeExpenseResponseCache.keys()).forEach((cacheKey) => {
    if (cacheKey !== currentCacheKey && cacheKey.startsWith(cacheKeyPrefix)) {
      financeExpenseResponseCache.delete(cacheKey);
    }
  });

  Array.from(financeExpenseRequestCache.keys()).forEach((cacheKey) => {
    if (cacheKey !== currentCacheKey && cacheKey.startsWith(cacheKeyPrefix)) {
      financeExpenseRequestCache.delete(cacheKey);
    }
  });
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
      amount: 0,
      hasDateFilter: false,
    };
  }

  const allItems = await getAllFinanceExpenseRecords(
    resolvedClinicId,
    state.dateFrom,
    state.dateTo,
    forceRefresh
  );
  return buildFinanceExpenseResponse(state, allItems);
};

export const ApplyFinanceExpenseMutationLocally = (
  state: FinanceExpenseStateModel,
  item?: FinanceExpenseModel,
  previousItem?: FinanceExpenseModel
): FinanceExpenseResponseModel => {
  const currentCacheKey = buildFinanceExpenseCacheKey(
    state.clinicId,
    state.dateFrom,
    state.dateTo
  );
  const cachedItems =
    financeExpenseResponseCache.get(currentCacheKey)?.data ?? [...state.items];
  const nextItemIds = new Set(
    [item?.id, previousItem?.id].filter((value): value is string => Boolean(value))
  );

  let nextItems = cachedItems.filter((existingItem) => !nextItemIds.has(String(existingItem.id)));

  if (item) {
    const itemDate = parseDateValue(item.date);
    const isInCurrentRange = itemDate
      ? isWithinInclusiveDateRange(itemDate, state.dateFrom, state.dateTo)
      : !String(state.dateFrom ?? '').trim() && !String(state.dateTo ?? '').trim();

    if (isInCurrentRange) {
      nextItems = [...nextItems, item];
    }
  }

  nextItems = [...nextItems].sort(sortFinanceItems);

  financeExpenseResponseCache.set(currentCacheKey, {
    data: nextItems,
    cachedAt: Date.now(),
  });
  invalidateOtherFinanceExpenseCaches(state.clinicId, currentCacheKey);

  return buildFinanceExpenseResponse(state, nextItems);
};

export const CreateFinanceExpenseItem = async (
  request: FinanceExpenseModel
): Promise<FinanceExpenseModel> => {
  try {
    const branchId = useAuthStore.getState().branchId?.trim() || undefined;
    const response = await apiClient.post<FinanceExpenseModel>(
      CREATE_FINANCE_EXPENSE_ENDPOINT,
      {
        ...request,
        BranchId: branchId,
      }
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
