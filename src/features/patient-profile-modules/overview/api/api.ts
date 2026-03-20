import { isAxiosError } from 'axios';
import {
  ExceptionResponse,
  ResponseMethod,
  SuccessResponse,
  toastSuccess,
} from '../../../../common/api/responses';
import { apiClient } from '../../../../common/services/api-client';
import { PatientOverViewModel } from './types';

const OVERVIEW_ENDPOINT = '/api/dmd/patient-overview/get-patient-overview';
const CREATE_OVERVIEW_ENDPOINT = '/api/dmd/patient-overview/create-patient-overview';
const UPDATE_OVERVIEW_ENDPOINT = '/api/dmd/patient-overview/put-patient-overview';
const DELETE_OVERVIEW_ENDPOINT = '/api/dmd/patient-overview/delete-patient-overview';
const overviewRequestCache = new Map<string, Promise<PatientOverViewModel[]>>();
const overviewResponseCache = new Map<
  string,
  {
    data: PatientOverViewModel[];
    cachedAt: number;
  }
>();
const OVERVIEW_RESPONSE_CACHE_TTL_MS = 5000;

export const GetPatientOverViewItems = async (
  patientId?: string,
  forceRefresh: boolean = false
): Promise<PatientOverViewModel[]> => {
  const requestKey = patientId?.trim() || 'current-patient';

  if (forceRefresh) {
    overviewResponseCache.delete(requestKey);
  }

  const cachedResponse = overviewResponseCache.get(requestKey);
  if (cachedResponse && Date.now() - cachedResponse.cachedAt < OVERVIEW_RESPONSE_CACHE_TTL_MS) {
    return cachedResponse.data;
  }

  const activeRequest = overviewRequestCache.get(requestKey);
  if (activeRequest) {
    return activeRequest;
  }

  const request = (async (): Promise<PatientOverViewModel[]> => {
    try {
      const response = await apiClient.get<PatientOverViewModel[]>(OVERVIEW_ENDPOINT, {
        params: {
          PatientInfoId: patientId,
        },
      });

      const responseData = SuccessResponse(response, ResponseMethod.Fetch, undefined, false) || [];
      overviewResponseCache.set(requestKey, {
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
      overviewRequestCache.delete(requestKey);
    }
  })();

  overviewRequestCache.set(requestKey, request);
  return request;
};

export const CreatePatientOverViewItem = async (
  request: PatientOverViewModel
): Promise<PatientOverViewModel> => {
  try {
    const response = await apiClient.post<PatientOverViewModel>(CREATE_OVERVIEW_ENDPOINT, request);
    return SuccessResponse(response, ResponseMethod.Create) as PatientOverViewModel;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const UpdatePatientOverViewItem = async (
  request: PatientOverViewModel
): Promise<PatientOverViewModel> => {
  try {
    const response = await apiClient.put<PatientOverViewModel>(UPDATE_OVERVIEW_ENDPOINT, request);
    return SuccessResponse(response, ResponseMethod.Update) as PatientOverViewModel;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const DeletePatientOverViewItem = async (request: PatientOverViewModel): Promise<void> => {
  try {
    await apiClient.delete(DELETE_OVERVIEW_ENDPOINT, { data: request });
    toastSuccess('Successfully Deleted!');
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};
