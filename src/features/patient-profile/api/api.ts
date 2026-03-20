import { isAxiosError } from 'axios';
import {
  CustomSuccessResponse,
  ExceptionResponse,
  ResponseMethod,
  SuccessResponse,
  toastSuccess,
} from '../../../common/api/responses';
import { apiClient } from '../../../common/services/api-client';
import {
  PatientEmailRequestModel,
  PatientEmailResponseModel,
  PatientProfileModel,
} from './types';

const PATIENT_PROFILE_ENDPOINT = '/api/dmd/patient-profile/get-patient-profile';
const UPDATE_PATIENT_PROFILE_ENDPOINT = '/api/dmd/patient/put-patient';
const DELETE_PATIENT_ENDPOINT = '/api/dmd/patient-profile/delete-patient';
const SEND_PATIENT_EMAIL_ENDPOINT = '/api/dmd/patient-profile/send-email';
const patientProfileRequestCache = new Map<string, Promise<PatientProfileModel>>();
const patientProfileResponseCache = new Map<
  string,
  {
    data: PatientProfileModel;
    cachedAt: number;
  }
>();
const PATIENT_PROFILE_RESPONSE_CACHE_TTL_MS = 5000;

export const GetPatientProfile = async (
  patientId?: string,
  clinicId?: string,
  forceRefresh: boolean = false
): Promise<PatientProfileModel> => {
  const requestKey = JSON.stringify({
    patientId: patientId?.trim() || 'current-patient',
    clinicId: clinicId?.trim() || 'current-clinic',
  });

  if (forceRefresh) {
    patientProfileResponseCache.delete(requestKey);
  }

  const cachedResponse = patientProfileResponseCache.get(requestKey);
  if (
    cachedResponse &&
    Date.now() - cachedResponse.cachedAt < PATIENT_PROFILE_RESPONSE_CACHE_TTL_MS
  ) {
    return cachedResponse.data;
  }

  const activeRequest = patientProfileRequestCache.get(requestKey);
  if (activeRequest) {
    return activeRequest;
  }

  const request = (async (): Promise<PatientProfileModel> => {
    try {
      const response = await apiClient.get<PatientProfileModel>(PATIENT_PROFILE_ENDPOINT, {
        params: {
          PatientId: patientId,
          ClinicId: clinicId,
        },
      });

      const responseData =
        SuccessResponse(response, ResponseMethod.Fetch, undefined, false) || {
          id: patientId,
        };

      patientProfileResponseCache.set(requestKey, {
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
      patientProfileRequestCache.delete(requestKey);
    }
  })();

  patientProfileRequestCache.set(requestKey, request);
  return request;
};

export const UpdatePatientProfile = async (
  request: PatientProfileModel
): Promise<PatientProfileModel> => {
  try {
    const response = await apiClient.put<PatientProfileModel>(
      UPDATE_PATIENT_PROFILE_ENDPOINT,
      request
    );
    return SuccessResponse(response, ResponseMethod.Update) as PatientProfileModel;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const DeletePatientProfile = async (patientId: string): Promise<void> => {
  try {
    await apiClient.delete(DELETE_PATIENT_ENDPOINT, {
      params: {
        PatientId: patientId,
      },
      data: {
        patientId,
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

export const SendPatientEmail = async (
  request: PatientEmailRequestModel
): Promise<PatientEmailResponseModel> => {
  try {
    const response = await apiClient.post<PatientEmailResponseModel>(SEND_PATIENT_EMAIL_ENDPOINT, request);
    return CustomSuccessResponse(response, 'Queued patient email') as PatientEmailResponseModel;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};
