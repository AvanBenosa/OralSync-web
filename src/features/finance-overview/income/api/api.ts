import {
  CreatePatientProgressNoteItem,
  DeletePatientProgressNoteItem,
  GetPatientProgressNoteItems,
  UpdatePatientProgressNoteItem,
} from '../../../patient-profile-modules/progress-note/api/api';
import type { PatientProgressNoteModel } from '../../../patient-profile-modules/progress-note/api/types';
import { resolveClinicId } from '../../../../common/components/ClinicId';
import type {
  FinanceIncomeStatusFilter,
  FinanceIncomeModel,
  FinanceIncomeResponseModel,
  FinanceIncomeStateModel,
} from './types';

const FINANCE_INCOME_CACHE_TTL_MS = 5000;

const financeIncomeRequestCache = new Map<string, Promise<FinanceIncomeModel[]>>();
const financeIncomeResponseCache = new Map<
  string,
  {
    data: FinanceIncomeModel[];
    cachedAt: number;
  }
>();

const buildFinanceIncomeCacheKey = (
  clinicId?: string | null,
  dateFrom?: string,
  dateTo?: string,
  statusFilter?: FinanceIncomeStatusFilter
): string => {
  const resolvedClinicId = resolveClinicId(clinicId);

  return [
    resolvedClinicId ?? 'current-clinic',
    dateFrom?.trim() || 'any-from',
    dateTo?.trim() || 'any-to',
    statusFilter?.trim() || 'all-status',
  ].join('|');
};

const getFinanceIncomeCacheKeyPrefix = (clinicId?: string | null): string | undefined => {
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

const sortFinanceItems = (left: FinanceIncomeModel, right: FinanceIncomeModel): number => {
  const leftDate = parseDateValue(left.date)?.getTime() ?? 0;
  const rightDate = parseDateValue(right.date)?.getTime() ?? 0;

  if (leftDate !== rightDate) {
    return rightDate - leftDate;
  }

  return String(left.patientName ?? left.patientNumber ?? '').localeCompare(
    String(right.patientName ?? right.patientNumber ?? '')
  );
};

const getResolvedTotalAmountDue = (item: FinanceIncomeModel): number | undefined => {
  if (typeof item.totalAmountDue === 'number' && !Number.isNaN(item.totalAmountDue)) {
    return item.totalAmountDue;
  }

  if (item.amount === undefined && item.discount === undefined) {
    return undefined;
  }

  return (item.amount ?? 0) - (item.discount ?? 0);
};

const getResolvedBalance = (item: FinanceIncomeModel): number | undefined => {
  if (typeof item.balance === 'number' && !Number.isNaN(item.balance)) {
    return item.balance;
  }

  const totalAmountDue = getResolvedTotalAmountDue(item);

  if (totalAmountDue === undefined && item.amountPaid === undefined) {
    return undefined;
  }

  return (totalAmountDue ?? 0) - (item.amountPaid ?? 0);
};

const getFinanceIncomeStatus = (
  item: FinanceIncomeModel
): Exclude<FinanceIncomeStatusFilter, 'all'> | undefined => {
  const balance = getResolvedBalance(item);

  if (balance === undefined) {
    return undefined;
  }

  return balance > 0 ? 'pending' : 'paid';
};

const matchesFinanceIncomeStatus = (
  item: FinanceIncomeModel,
  statusFilter?: FinanceIncomeStatusFilter
): boolean => {
  if (!statusFilter || statusFilter === 'all') {
    return true;
  }

  return getFinanceIncomeStatus(item) === statusFilter;
};

const getAllFinanceIncomeRecords = async (
  clinicId?: string | null,
  dateFrom?: string,
  dateTo?: string,
  statusFilter: FinanceIncomeStatusFilter = 'all',
  forceRefresh: boolean = false
): Promise<FinanceIncomeModel[]> => {
  const resolvedClinicId = resolveClinicId(clinicId);
  const cacheKey = buildFinanceIncomeCacheKey(resolvedClinicId, dateFrom, dateTo, statusFilter);

  if (!resolvedClinicId) {
    return [];
  }

  if (forceRefresh) {
    financeIncomeResponseCache.delete(cacheKey);
  }

  const cachedResponse = financeIncomeResponseCache.get(cacheKey);
  if (cachedResponse && Date.now() - cachedResponse.cachedAt < FINANCE_INCOME_CACHE_TTL_MS) {
    return cachedResponse.data;
  }

  const activeRequest = financeIncomeRequestCache.get(cacheKey);
  if (activeRequest) {
    return activeRequest;
  }

  const request = (async (): Promise<FinanceIncomeModel[]> => {
    try {
      const notes = await GetPatientProgressNoteItems(
        {
          clinicId: resolvedClinicId,
          dateFrom,
          dateTo,
          paymentStatus: statusFilter !== 'all' ? statusFilter : undefined,
        },
        forceRefresh
      );
      const sortedItems = [...(notes || [])].sort(sortFinanceItems) as FinanceIncomeModel[];
      financeIncomeResponseCache.set(cacheKey, {
        data: sortedItems,
        cachedAt: Date.now(),
      });

      return sortedItems;
    } finally {
      financeIncomeRequestCache.delete(cacheKey);
    }
  })();

  financeIncomeRequestCache.set(cacheKey, request);
  return request;
};

const matchesFinanceIncomeSearch = (item: FinanceIncomeModel, keyword: string): boolean => {
  if (!keyword) {
    return true;
  }

  return [
    item.patientName,
    item.patientNumber,
    item.procedure,
    item.assignedDoctor,
    item.category,
    item.account,
    item.remarks,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(keyword));
};

const buildFinanceIncomeResponse = (
  state: FinanceIncomeStateModel,
  allItems: FinanceIncomeModel[]
): FinanceIncomeResponseModel => {
  const pageSize = Math.max(state.pageEnd, 1);
  const keyword = String(state.search ?? '')
    .trim()
    .toLowerCase();
  const filteredItems = keyword
    ? allItems.filter((item) => matchesFinanceIncomeSearch(item, keyword))
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
    (total, item) => total + Number(item.amountPaid ?? 0),
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

const invalidateOtherFinanceIncomeCaches = (
  clinicId?: string | null,
  currentCacheKey?: string
): void => {
  const cacheKeyPrefix = getFinanceIncomeCacheKeyPrefix(clinicId);

  if (!cacheKeyPrefix) {
    return;
  }

  Array.from(financeIncomeResponseCache.keys()).forEach((cacheKey) => {
    if (cacheKey !== currentCacheKey && cacheKey.startsWith(cacheKeyPrefix)) {
      financeIncomeResponseCache.delete(cacheKey);
    }
  });

  Array.from(financeIncomeRequestCache.keys()).forEach((cacheKey) => {
    if (cacheKey !== currentCacheKey && cacheKey.startsWith(cacheKeyPrefix)) {
      financeIncomeRequestCache.delete(cacheKey);
    }
  });
};

export const GetFinanceIncomeItems = async (
  state: FinanceIncomeStateModel,
  forceRefresh: boolean = false
): Promise<FinanceIncomeResponseModel> => {
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

  const allItems = await getAllFinanceIncomeRecords(
    resolvedClinicId,
    state.dateFrom,
    state.dateTo,
    state.statusFilter ?? 'all',
    forceRefresh
  );
  return buildFinanceIncomeResponse(state, allItems);
};

export const ApplyFinanceIncomeMutationLocally = (
  state: FinanceIncomeStateModel,
  item?: FinanceIncomeModel,
  previousItem?: FinanceIncomeModel
): FinanceIncomeResponseModel => {
  const currentCacheKey = buildFinanceIncomeCacheKey(
    state.clinicId,
    state.dateFrom,
    state.dateTo,
    state.statusFilter
  );
  const cachedItems = financeIncomeResponseCache.get(currentCacheKey)?.data ?? [...state.items];
  const nextItemIds = new Set(
    [item?.id, previousItem?.id].filter((value): value is string => Boolean(value))
  );

  let nextItems = cachedItems.filter((existingItem) => !nextItemIds.has(String(existingItem.id)));

  if (item) {
    const itemDate = parseDateValue(item.date);
    const isInCurrentRange = itemDate
      ? isWithinInclusiveDateRange(itemDate, state.dateFrom, state.dateTo)
      : !String(state.dateFrom ?? '').trim() && !String(state.dateTo ?? '').trim();

    if (isInCurrentRange && matchesFinanceIncomeStatus(item, state.statusFilter)) {
      nextItems = [...nextItems, item];
    }
  }

  nextItems = [...nextItems].sort(sortFinanceItems);

  financeIncomeResponseCache.set(currentCacheKey, {
    data: nextItems,
    cachedAt: Date.now(),
  });
  invalidateOtherFinanceIncomeCaches(state.clinicId, currentCacheKey);

  return buildFinanceIncomeResponse(state, nextItems);
};

export const CreateFinanceIncomeItem = async (
  request: PatientProgressNoteModel
): Promise<PatientProgressNoteModel> => CreatePatientProgressNoteItem(request);

export const UpdateFinanceIncomeItem = async (
  request: PatientProgressNoteModel
): Promise<PatientProgressNoteModel> => UpdatePatientProgressNoteItem(request);

export const DeleteFinanceIncomeItem = async (patientInfoId?: string, id?: string): Promise<void> =>
  DeletePatientProgressNoteItem(patientInfoId, id);
