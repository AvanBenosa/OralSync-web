import { isAxiosError } from 'axios';
import {
  ExceptionResponse,
  ResponseMethod,
  SuccessResponse,
  toastSuccess,
} from '../../../../common/api/responses';
import { apiClient } from '../../../../common/services/api-client';
import { PatientMedicalHistoryModel } from './types';

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
      const response = await apiClient.get<PatientMedicalHistoryModel[]>(MEDICAL_HISTORY_ENDPOINT, {
        params: {
          PatientInfoId: patientId,
        },
      });

      const responseData = SuccessResponse(response, ResponseMethod.Fetch, undefined, false) || [];
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
    const response = await apiClient.post<PatientMedicalHistoryModel>(
      CREATE_MEDICAL_HISTORY_ENDPOINT,
      request
    );
    return SuccessResponse(response, ResponseMethod.Create) as PatientMedicalHistoryModel;
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
    const response = await apiClient.put<PatientMedicalHistoryModel>(
      UPDATE_MEDICAL_HISTORY_ENDPOINT,
      request
    );
    return SuccessResponse(response, ResponseMethod.Update) as PatientMedicalHistoryModel;
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
