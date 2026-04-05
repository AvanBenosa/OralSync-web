import { isAxiosError } from 'axios';
import {
  ExceptionResponse,
  ResponseMethod,
  SuccessResponse,
  toastSuccess,
} from '../../../../common/api/responses';
import { apiClient } from '../../../../common/services/api-client';
import { normalizePatientPerioChartItem, PatientPerioChartModel } from './types';

const PERIO_CHART_ENDPOINT = '/api/dmd/patient-perio-chart/get-patient-perio-chart';
const CREATE_PERIO_CHART_ENDPOINT = '/api/dmd/patient-perio-chart/create-patient-perio-chart';
const UPDATE_PERIO_CHART_ENDPOINT = '/api/dmd/patient-perio-chart/put-patient-perio-chart';
const DELETE_PERIO_CHART_ENDPOINT = '/api/dmd/patient-perio-chart/delete-patient-perio-chart';
const perioChartRequestCache = new Map<string, Promise<PatientPerioChartModel[]>>();
const perioChartResponseCache = new Map<
  string,
  {
    data: PatientPerioChartModel[];
    cachedAt: number;
  }
>();
const PERIO_CHART_RESPONSE_CACHE_TTL_MS = 5000;

export const GetPatientPerioChartItems = async (
  patientId?: string,
  forceRefresh: boolean = false
): Promise<PatientPerioChartModel[]> => {
  const requestKey = patientId?.trim() || 'current-patient';

  if (forceRefresh) {
    perioChartResponseCache.delete(requestKey);
  }

  const cachedResponse = perioChartResponseCache.get(requestKey);
  if (cachedResponse && Date.now() - cachedResponse.cachedAt < PERIO_CHART_RESPONSE_CACHE_TTL_MS) {
    return cachedResponse.data;
  }

  const activeRequest = perioChartRequestCache.get(requestKey);
  if (activeRequest) {
    return activeRequest;
  }

  const request = (async (): Promise<PatientPerioChartModel[]> => {
    try {
      const response = await apiClient.get<unknown[]>(PERIO_CHART_ENDPOINT, {
        params: {
          PatientInfoId: patientId,
        },
      });

      const responseData = SuccessResponse(response, ResponseMethod.Fetch, undefined, false) || [];
      const normalizedResponse = Array.isArray(responseData)
        ? responseData.map((item) => normalizePatientPerioChartItem(item))
        : [];

      perioChartResponseCache.set(requestKey, {
        data: normalizedResponse,
        cachedAt: Date.now(),
      });

      return normalizedResponse;
    } catch (error) {
      if (isAxiosError(error)) {
        await ExceptionResponse(error);
      }

      throw error;
    } finally {
      perioChartRequestCache.delete(requestKey);
    }
  })();

  perioChartRequestCache.set(requestKey, request);
  return request;
};

export const CreatePatientPerioChartItem = async (
  request: PatientPerioChartModel,
  withToast: boolean = true
): Promise<PatientPerioChartModel> => {
  try {
    const response = await apiClient.post<unknown>(CREATE_PERIO_CHART_ENDPOINT, request);
    const responseData = SuccessResponse(response, ResponseMethod.Create, undefined, withToast);
    perioChartResponseCache.delete(request.patientInfoId?.trim() || 'current-patient');
    return normalizePatientPerioChartItem(responseData);
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }

    throw error;
  }
};

export const UpdatePatientPerioChartItem = async (
  request: PatientPerioChartModel,
  withToast: boolean = true
): Promise<PatientPerioChartModel> => {
  try {
    const response = await apiClient.put<unknown>(UPDATE_PERIO_CHART_ENDPOINT, request);
    const responseData = SuccessResponse(response, ResponseMethod.Update, undefined, withToast);
    perioChartResponseCache.delete(request.patientInfoId?.trim() || 'current-patient');
    return normalizePatientPerioChartItem(responseData);
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }

    throw error;
  }
};

export const DeletePatientPerioChartItem = async (
  request: PatientPerioChartModel
): Promise<void> => {
  try {
    await apiClient.delete(DELETE_PERIO_CHART_ENDPOINT, { data: request });
    perioChartResponseCache.delete(request.patientInfoId?.trim() || 'current-patient');
    toastSuccess('Successfully Deleted!');
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }

    throw error;
  }
};
