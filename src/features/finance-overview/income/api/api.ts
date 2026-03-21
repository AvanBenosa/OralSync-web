import {
  CreatePatientProgressNoteItem,
  DeletePatientProgressNoteItem,
  GetPatientProgressNoteItems,
  UpdatePatientProgressNoteItem,
} from '../../../patient-profile-modules/progress-note/api/api';
import type { PatientProgressNoteModel } from '../../../patient-profile-modules/progress-note/api/types';
import { resolveClinicId } from '../../../../common/components/ClinicId';
import type {
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

const getAllFinanceIncomeRecords = async (
  clinicId?: string | null,
  forceRefresh: boolean = false
): Promise<FinanceIncomeModel[]> => {
  const resolvedClinicId = resolveClinicId(clinicId);

  if (!resolvedClinicId) {
    return [];
  }

  if (forceRefresh) {
    financeIncomeResponseCache.delete(resolvedClinicId);
  }

  const cachedResponse = financeIncomeResponseCache.get(resolvedClinicId);
  if (
    cachedResponse &&
    Date.now() - cachedResponse.cachedAt < FINANCE_INCOME_CACHE_TTL_MS
  ) {
    return cachedResponse.data;
  }

  const activeRequest = financeIncomeRequestCache.get(resolvedClinicId);
  if (activeRequest) {
    return activeRequest;
  }

  const request = (async (): Promise<FinanceIncomeModel[]> => {
    try {
      const notes = await GetPatientProgressNoteItems(undefined, forceRefresh);
      const sortedItems = [...(notes || [])].sort(sortFinanceItems) as FinanceIncomeModel[];
      financeIncomeResponseCache.set(resolvedClinicId, {
        data: sortedItems,
        cachedAt: Date.now(),
      });

      return sortedItems;
    } finally {
      financeIncomeRequestCache.delete(resolvedClinicId);
    }
  })();

  financeIncomeRequestCache.set(resolvedClinicId, request);
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
    };
  }

  const keyword = String(state.search ?? '').trim().toLowerCase();
  const allItems = await getAllFinanceIncomeRecords(resolvedClinicId, forceRefresh);
  const filteredItems = keyword
    ? allItems.filter((item) => matchesFinanceIncomeSearch(item, keyword))
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

export const CreateFinanceIncomeItem = async (
  request: PatientProgressNoteModel
): Promise<PatientProgressNoteModel> => CreatePatientProgressNoteItem(request);

export const UpdateFinanceIncomeItem = async (
  request: PatientProgressNoteModel
): Promise<PatientProgressNoteModel> => UpdatePatientProgressNoteItem(request);

export const DeleteFinanceIncomeItem = async (
  patientInfoId?: string,
  id?: string
): Promise<void> => DeletePatientProgressNoteItem(patientInfoId, id);
