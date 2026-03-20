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

export const GetAppointments = async (
  state: AppointmentStateModel,
  forceRefresh: boolean = false
): Promise<AppointmentResponseModel> => {
  const resolvedClinicId = resolveClinicId(state.clinicId);
  const query = String(state.search ?? '').trim() || 'all';
  const pageStart = state.pageStart;
  const pageEnd = state.pageEnd;
  const requestKey = JSON.stringify({
    clinicId: resolvedClinicId ?? 'current-clinic',
    query,
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
