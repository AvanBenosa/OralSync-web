import { isAxiosError } from 'axios';
import {
  ExceptionResponse,
  ResponseMethod,
  SuccessResponse,
  toastSuccess,
} from '../../../../common/api/responses';
import { apiClient } from '../../../../common/services/api-client';
import { normalizeMedicalHistoryConditions, PatientMedicalHistoryModel } from './types';

const MEDICAL_HISTORY_ENDPOINT = '/api/dmd/patient-medical-history/get-patient-medical-history';
const CREATE_MEDICAL_HISTORY_ENDPOINT =
  '/api/dmd/patient-medical-history/create-patient-medical-history';
const UPDATE_MEDICAL_HISTORY_ENDPOINT =
  '/api/dmd/patient-medical-history/put-patient-medical-history';
const DELETE_MEDICAL_HISTORY_ENDPOINT =
  '/api/dmd/patient-medical-history/delete-patient-medical-history';
const medicalHistoryRequestCache = new Map<string, Promise<PatientMedicalHistoryModel[]>>();
const medicalHistoryResponseCache = new Map<
  string,
  {
    data: PatientMedicalHistoryModel[];
    cachedAt: number;
  }
>();
const MEDICAL_HISTORY_RESPONSE_CACHE_TTL_MS = 5000;

type PatientMedicalHistoryApiModel = Omit<PatientMedicalHistoryModel, 'q11Conditions'> & {
  q11Conditions?: unknown;
};

const normalizePatientMedicalHistoryItem = (
  item?: PatientMedicalHistoryApiModel | PatientMedicalHistoryModel | null
): PatientMedicalHistoryModel => ({
  ...(item || {}),
  q11Conditions: normalizeMedicalHistoryConditions(item?.q11Conditions),
});

const normalizePatientMedicalHistoryItems = (
  items?: PatientMedicalHistoryApiModel[] | PatientMedicalHistoryModel[] | null
): PatientMedicalHistoryModel[] =>
  (items || []).map((item) => normalizePatientMedicalHistoryItem(item));

export const InvalidatePatientMedicalHistoryCache = (patientId?: string): void => {
  const requestKey = patientId?.trim() || 'current-patient';

  medicalHistoryRequestCache.delete(requestKey);
  medicalHistoryResponseCache.delete(requestKey);
};

export const GetPatientMedicalHistoryItems = async (
  patientId?: string,
  forceRefresh: boolean = false
): Promise<PatientMedicalHistoryModel[]> => {
  const requestKey = patientId?.trim() || 'current-patient';

  if (forceRefresh) {
    medicalHistoryResponseCache.delete(requestKey);
  }

  const cachedResponse = medicalHistoryResponseCache.get(requestKey);
  if (
    cachedResponse &&
    Date.now() - cachedResponse.cachedAt < MEDICAL_HISTORY_RESPONSE_CACHE_TTL_MS
  ) {
    return cachedResponse.data;
  }

  const activeRequest = medicalHistoryRequestCache.get(requestKey);
  if (activeRequest) {
    return activeRequest;
  }

  const request = (async (): Promise<PatientMedicalHistoryModel[]> => {
    try {
      const response = await apiClient.get<PatientMedicalHistoryApiModel[]>(
        MEDICAL_HISTORY_ENDPOINT,
        {
          params: {
            PatientInfoId: patientId,
          },
        }
      );

      const responseData = normalizePatientMedicalHistoryItems(
        SuccessResponse(response, ResponseMethod.Fetch, undefined, false) || []
      );
      medicalHistoryResponseCache.set(requestKey, {
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
      medicalHistoryRequestCache.delete(requestKey);
    }
  })();

  medicalHistoryRequestCache.set(requestKey, request);
  return request;
};

export const CreatePatientMedicalHistoryItem = async (
  request: PatientMedicalHistoryModel
): Promise<PatientMedicalHistoryModel> => {
  try {
    const normalizedRequest = normalizePatientMedicalHistoryItem(request);
    const response = await apiClient.post<PatientMedicalHistoryApiModel>(
      CREATE_MEDICAL_HISTORY_ENDPOINT,
      normalizedRequest
    );
    const responseData = SuccessResponse(response, ResponseMethod.Create) as
      | PatientMedicalHistoryApiModel
      | undefined;
    return normalizePatientMedicalHistoryItem(responseData ?? normalizedRequest);
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const UpdatePatientMedicalHistoryItem = async (
  request: PatientMedicalHistoryModel
): Promise<PatientMedicalHistoryModel> => {
  try {
    const normalizedRequest = normalizePatientMedicalHistoryItem(request);
    const response = await apiClient.put<PatientMedicalHistoryApiModel>(
      UPDATE_MEDICAL_HISTORY_ENDPOINT,
      normalizedRequest
    );
    const responseData = SuccessResponse(response, ResponseMethod.Update) as
      | PatientMedicalHistoryApiModel
      | undefined;
    return normalizePatientMedicalHistoryItem(responseData ?? normalizedRequest);
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const DeletePatientMedicalHistoryItem = async (
  patientInfoId: string | undefined,
  Id: string | undefined
): Promise<void> => {
  try {
    await apiClient.delete(DELETE_MEDICAL_HISTORY_ENDPOINT, {
      params: {
        patientInfoId,
        Id,
      },
      data: {
        patientInfoId,
        Id,
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
