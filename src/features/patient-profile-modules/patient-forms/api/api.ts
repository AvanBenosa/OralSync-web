import { isAxiosError } from 'axios';

import {
  ExceptionResponse,
  ResponseMethod,
  SuccessResponse,
  toastSuccess,
} from '../../../../common/api/responses';
import { apiClient } from '../../../../common/services/api-client';
import { PatientFormModel } from './types';

const PATIENT_FORMS_ENDPOINT = '/api/dmd/patient-form/get-patient-form';
const CREATE_PATIENT_FORM_ENDPOINT = '/api/dmd/patient-form/create-patient-form';
const UPDATE_PATIENT_FORM_ENDPOINT = '/api/dmd/patient-form/put-patient-form';
const DELETE_PATIENT_FORM_ENDPOINT = '/api/dmd/patient-form/delete-patient-form';
const patientFormsRequestCache = new Map<string, Promise<PatientFormModel[]>>();
const patientFormsResponseCache = new Map<
  string,
  {
    data: PatientFormModel[];
    cachedAt: number;
  }
>();
const PATIENT_FORMS_RESPONSE_CACHE_TTL_MS = 5000;

export const GetPatientFormItems = async (
  patientId?: string,
  forceRefresh: boolean = false
): Promise<PatientFormModel[]> => {
  const requestKey = patientId?.trim() || 'current-patient';

  if (forceRefresh) {
    patientFormsResponseCache.delete(requestKey);
  }

  const cachedResponse = patientFormsResponseCache.get(requestKey);
  if (
    cachedResponse &&
    Date.now() - cachedResponse.cachedAt < PATIENT_FORMS_RESPONSE_CACHE_TTL_MS
  ) {
    return cachedResponse.data;
  }

  const activeRequest = patientFormsRequestCache.get(requestKey);
  if (activeRequest) {
    return activeRequest;
  }

  const request = (async (): Promise<PatientFormModel[]> => {
    try {
      const response = await apiClient.get<PatientFormModel[]>(PATIENT_FORMS_ENDPOINT, {
        params: {
          PatientInfoId: patientId,
        },
      });

      const responseData = SuccessResponse(response, ResponseMethod.Fetch, undefined, false) || [];
      patientFormsResponseCache.set(requestKey, {
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
      patientFormsRequestCache.delete(requestKey);
    }
  })();

  patientFormsRequestCache.set(requestKey, request);
  return request;
};

export const CreatePatientFormItem = async (
  request: PatientFormModel
): Promise<PatientFormModel> => {
  try {
    const response = await apiClient.post<PatientFormModel>(CREATE_PATIENT_FORM_ENDPOINT, request);
    return SuccessResponse(response, ResponseMethod.Create) as PatientFormModel;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const UpdatePatientFormItem = async (
  request: PatientFormModel
): Promise<PatientFormModel> => {
  try {
    const response = await apiClient.put<PatientFormModel>(UPDATE_PATIENT_FORM_ENDPOINT, request);
    return SuccessResponse(response, ResponseMethod.Update) as PatientFormModel;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const DeletePatientFormItem = async (
  patientInfoId: string | undefined,
  id: string | undefined
): Promise<void> => {
  try {
    await apiClient.delete(DELETE_PATIENT_FORM_ENDPOINT, {
      params: {
        patientInfoId,
        Id: id,
      },
      data: {
        patientInfoId,
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
