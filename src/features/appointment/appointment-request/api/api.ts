import { isAxiosError } from 'axios';
import { apiClient } from '../../../../common/services/api-client';
import {
  ExceptionResponse,
  ResponseMethod,
  SuccessResponse,
  toastSuccess,
} from '../../../../common/api/responses';
import { resolveClinicId } from '../../../../common/components/ClinicId';
import { AppointmentModel, AppointmentResponseModel, AppointmentStateModel } from './types';

const APPOINTMENT_ENDPOINT = '/api/dmd/appointment/get-appointment';
const CREATE_APPOINTMENT_ENDPOINT = '/api/dmd/appointment/create-appointment';
const UPDATE_APPOINTMENT_ENDPOINT = '/api/dmd/appointment/put-appointment';
const DELETE_APPOINTMENT_ENDPOINT = '/api/dmd/appointment/delete-appointment';
const appointmentRequestCache = new Map<string, Promise<AppointmentResponseModel>>();
const appointmentResponseCache = new Map<
  string,
  {
    data: AppointmentResponseModel;
    cachedAt: number;
  }
>();
const APPOINTMENT_RESPONSE_CACHE_TTL_MS = 5000;

export const parseAppointmentDateValue = (value?: string | Date): Date | undefined => {
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

export const isSameAppointmentCalendarDate = (left: Date, right: Date): boolean =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

export const isAppointmentWithinInclusiveDateRange = (
  itemDate: Date,
  dateFrom?: string,
  dateTo?: string
): boolean => {
  const fromDate = parseAppointmentDateValue(dateFrom);
  const toDate = parseAppointmentDateValue(dateTo);

  if (fromDate && itemDate < fromDate) {
    return false;
  }

  if (toDate) {
    const toDateExclusive = new Date(toDate);
    toDateExclusive.setDate(toDateExclusive.getDate() + 1);

    if (itemDate >= toDateExclusive) {
      return false;
    }
  }

  return true;
};

export const matchesAppointmentSearch = (
  item: AppointmentModel,
  search?: string
): boolean => {
  const keyword = String(search ?? '').trim().toLowerCase();

  if (!keyword) {
    return true;
  }

  return [
    item.patientName,
    item.patientNumber,
    item.reasonForVisit,
    item.status,
    item.appointmentType,
    item.remarks,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(keyword));
};

export const matchesAppointmentFilters = (
  item: AppointmentModel,
  state: AppointmentStateModel
): boolean => {
  const itemDate = parseAppointmentDateValue(item.appointmentDateFrom);

  if (itemDate && !isAppointmentWithinInclusiveDateRange(itemDate, state.dateFrom, state.dateTo)) {
    return false;
  }

  if (!itemDate && (state.dateFrom || state.dateTo)) {
    return false;
  }

  return matchesAppointmentSearch(item, state.search);
};

export const contributesToAppointmentSummary = (
  item: AppointmentModel,
  state: AppointmentStateModel
): boolean => {
  if (!matchesAppointmentFilters(item, state)) {
    return false;
  }

  if (state.hasDateFilter) {
    return true;
  }

  const itemDate = parseAppointmentDateValue(item.appointmentDateFrom);
  return itemDate ? isSameAppointmentCalendarDate(itemDate, new Date()) : false;
};

export const InvalidateAppointmentResponseCache = (): void => {
  appointmentRequestCache.clear();
  appointmentResponseCache.clear();
};

export const GetAppointments = async (
  state: AppointmentStateModel,
  forceRefresh: boolean = false
): Promise<AppointmentResponseModel> => {
  const resolvedClinicId = resolveClinicId(state.clinicId);
  const query = String(state.search ?? '').trim() || 'all';
  const pageStart = state.pageStart;
  const pageEnd = state.pageEnd;
  const dateFrom = String(state.dateFrom ?? '').trim();
  const dateTo = String(state.dateTo ?? '').trim();
  const requestKey = JSON.stringify({
    clinicId: resolvedClinicId ?? 'current-clinic',
    query,
    dateFrom: dateFrom || 'any-from',
    dateTo: dateTo || 'any-to',
    pageStart,
    pageEnd,
  });

  if (forceRefresh) {
    appointmentResponseCache.delete(requestKey);
  }

  const cachedResponse = appointmentResponseCache.get(requestKey);
  if (
    cachedResponse &&
    Date.now() - cachedResponse.cachedAt < APPOINTMENT_RESPONSE_CACHE_TTL_MS
  ) {
    return cachedResponse.data;
  }

  const activeRequest = appointmentRequestCache.get(requestKey);
  if (activeRequest) {
    return activeRequest;
  }

  const request = (async (): Promise<AppointmentResponseModel> => {
    try {
      const response = await apiClient.get<AppointmentResponseModel>(APPOINTMENT_ENDPOINT, {
        params: {
          ClinicId: resolvedClinicId ?? undefined,
          Que: query,
          DateFrom: dateFrom || undefined,
          DateTo: dateTo || undefined,
          PageStart: pageStart,
          PageEnd: pageEnd,
        },
      });

      const responseData =
        SuccessResponse(response, ResponseMethod.Fetch, undefined, false) || {
          items: [],
          pageStart,
          pageEnd,
          totalCount: 0,
          summaryCount: 0,
          hasDateFilter: false,
        };

      appointmentResponseCache.set(requestKey, {
        data: responseData,
        cachedAt: Date.now(),
      });

      return responseData;
    } catch (error) {
      if (isAxiosError(error)) {
        await ExceptionResponse(error);
      }
      throw error;
    } finally {
      appointmentRequestCache.delete(requestKey);
    }
  })();

  appointmentRequestCache.set(requestKey, request);
  return request;
};

export const CreateAppointment = async (request: AppointmentModel): Promise<AppointmentModel> => {
  try {
    const response = await apiClient.post<AppointmentModel>(CREATE_APPOINTMENT_ENDPOINT, request);
    return SuccessResponse(response, ResponseMethod.Create) as AppointmentModel;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const UpdateAppointment = async (request: AppointmentModel): Promise<AppointmentModel> => {
  try {
    const response = await apiClient.put<AppointmentModel>(UPDATE_APPOINTMENT_ENDPOINT, request);
    return SuccessResponse(response, ResponseMethod.Update) as AppointmentModel;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const DeleteAppointment = async (request: AppointmentModel): Promise<void> => {
  try {
    await apiClient.delete(DELETE_APPOINTMENT_ENDPOINT, { data: request });
    toastSuccess('Successfully Deleted!');
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};
