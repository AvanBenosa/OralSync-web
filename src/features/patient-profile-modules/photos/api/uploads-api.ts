import { isAxiosError } from 'axios';

import {
  ExceptionResponse,
  ResponseMethod,
  SuccessResponse,
} from '../../../../common/api/responses';
import { apiClient } from '../../../../common/services/api-client';
import { PatientUploadFileType, PatientUploadModel } from './types';

const PATIENT_UPLOADS_ENDPOINT = '/api/dmd/patient-uploads/get-patient-uploads';
const CREATE_PATIENT_UPLOAD_ENDPOINT = '/api/dmd/patient-uploads/create-patient-uploads';
const UPDATE_PATIENT_UPLOAD_ENDPOINT = '/api/dmd/patient-uploads/put-patient-uploads';
const DELETE_PATIENT_UPLOAD_ENDPOINT = '/api/dmd/patient-uploads/delete-patient-uploads';
const UPLOAD_PATIENT_UPLOAD_FILE_ENDPOINT = '/api/dmd/patient-uploads/upload-patient-upload-file';

const patientUploadsRequestCache = new Map<string, Promise<PatientUploadModel[]>>();
const patientUploadsResponseCache = new Map<
  string,
  {
    data: PatientUploadModel[];
    cachedAt: number;
  }
>();
const PATIENT_UPLOADS_RESPONSE_CACHE_TTL_MS = 5000;

export type PatientUploadFileUploadResponse = {
  fileName: string;
  originalFileName: string;
  filePath: string;
  fileType: PatientUploadFileType;
};

export const GetPatientUploadItems = async (
  patientId?: string,
  forceRefresh: boolean = false
): Promise<PatientUploadModel[]> => {
  const requestKey = patientId?.trim() || 'current-patient';

  if (forceRefresh) {
    patientUploadsResponseCache.delete(requestKey);
  }

  const cachedResponse = patientUploadsResponseCache.get(requestKey);
  if (
    cachedResponse &&
    Date.now() - cachedResponse.cachedAt < PATIENT_UPLOADS_RESPONSE_CACHE_TTL_MS
  ) {
    return cachedResponse.data;
  }

  const activeRequest = patientUploadsRequestCache.get(requestKey);
  if (activeRequest) {
    return activeRequest;
  }

  const request = (async (): Promise<PatientUploadModel[]> => {
    try {
      const response = await apiClient.get<PatientUploadModel[]>(PATIENT_UPLOADS_ENDPOINT, {
        params: {
          PatientInfoId: patientId,
        },
      });

      const responseData =
        (SuccessResponse(
          response,
          ResponseMethod.Fetch,
          undefined,
          false
        ) as PatientUploadModel[]) || [];

      patientUploadsResponseCache.set(requestKey, {
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
      patientUploadsRequestCache.delete(requestKey);
    }
  })();

  patientUploadsRequestCache.set(requestKey, request);
  return request;
};

export const CreatePatientUploadItem = async (
  request: PatientUploadModel
): Promise<PatientUploadModel> => {
  try {
    const response = await apiClient.post<PatientUploadModel>(CREATE_PATIENT_UPLOAD_ENDPOINT, request);
    return SuccessResponse(response, ResponseMethod.Create) as PatientUploadModel;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const UpdatePatientUploadItem = async (
  request: Pick<PatientUploadModel, 'id' | 'patientInfoId' | 'remarks'>
): Promise<PatientUploadModel> => {
  try {
    const response = await apiClient.put<PatientUploadModel>(UPDATE_PATIENT_UPLOAD_ENDPOINT, request);
    return SuccessResponse(response, ResponseMethod.Update) as PatientUploadModel;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const DeletePatientUploadItem = async (
  request: Pick<PatientUploadModel, 'id' | 'patientInfoId'>
): Promise<void> => {
  try {
    await apiClient.delete(DELETE_PATIENT_UPLOAD_ENDPOINT, {
      params: {
        Id: request.id,
        PatientInfoId: request.patientInfoId,
      },
      data: request,
    });
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const UploadPatientUploadFile = async (
  file: File,
  patientInfoId: string
): Promise<PatientUploadFileUploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patientInfoId', patientInfoId);

    const response = await apiClient.post<PatientUploadFileUploadResponse>(
      UPLOAD_PATIENT_UPLOAD_FILE_ENDPOINT,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};
