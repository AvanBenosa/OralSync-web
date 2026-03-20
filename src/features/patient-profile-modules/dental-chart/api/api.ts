import { isAxiosError } from 'axios';
import {
  ExceptionResponse,
  ResponseMethod,
  SuccessResponse,
  toastSuccess,
} from '../../../../common/api/responses';
import { apiClient } from '../../../../common/services/api-client';
import { PatientDentalChartModel } from './types';

const DENTAL_CHART_ENDPOINT = '/api/dmd/patient-dental-chart/get-patient-dental-chart';
const CREATE_DENTAL_CHART_ENDPOINT = '/api/dmd/patient-dental-chart/create-patient-dental-chart';
const UPDATE_DENTAL_CHART_ENDPOINT = '/api/dmd/patient-dental-chart/put-patient-dental-chart';
const DELETE_DENTAL_CHART_ENDPOINT = '/api/dmd/patient-dental-chart/delete-patient-dental-chart';
const UPLOAD_DENTAL_CHART_IMAGE_ENDPOINT =
  '/api/dmd/patient-dental-chart/upload-patient-dental-chart-image';
const dentalChartRequestCache = new Map<string, Promise<PatientDentalChartModel[]>>();
const dentalChartResponseCache = new Map<
  string,
  {
    data: PatientDentalChartModel[];
    cachedAt: number;
  }
>();
const DENTAL_CHART_RESPONSE_CACHE_TTL_MS = 5000;

export type PatientDentalChartImageUploadResponse = {
  fileName: string;
  originalFileName: string;
  filePath: string;
};

export const GetPatientDentalChartItems = async (
  patientId?: string,
  forceRefresh: boolean = false
): Promise<PatientDentalChartModel[]> => {
  const requestKey = patientId?.trim() || 'current-patient';

  if (forceRefresh) {
    dentalChartResponseCache.delete(requestKey);
  }

  const cachedResponse = dentalChartResponseCache.get(requestKey);
  if (
    cachedResponse &&
    Date.now() - cachedResponse.cachedAt < DENTAL_CHART_RESPONSE_CACHE_TTL_MS
  ) {
    return cachedResponse.data;
  }

  const activeRequest = dentalChartRequestCache.get(requestKey);
  if (activeRequest) {
    return activeRequest;
  }

  const request = (async (): Promise<PatientDentalChartModel[]> => {
    try {
      const response = await apiClient.get<PatientDentalChartModel[]>(DENTAL_CHART_ENDPOINT, {
        params: {
          PatientInfoId: patientId,
        },
      });

      const responseData = SuccessResponse(response, ResponseMethod.Fetch, undefined, false) || [];
      dentalChartResponseCache.set(requestKey, {
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
      dentalChartRequestCache.delete(requestKey);
    }
  })();

  dentalChartRequestCache.set(requestKey, request);
  return request;
};

export const CreatePatientDentalChartItem = async (
  request: PatientDentalChartModel
): Promise<PatientDentalChartModel> => {
  try {
    const response = await apiClient.post<PatientDentalChartModel>(
      CREATE_DENTAL_CHART_ENDPOINT,
      request
    );
    return SuccessResponse(response, ResponseMethod.Create) as PatientDentalChartModel;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const UpdatePatientDentalChartItem = async (
  request: PatientDentalChartModel
): Promise<PatientDentalChartModel> => {
  try {
    const response = await apiClient.put<PatientDentalChartModel>(
      UPDATE_DENTAL_CHART_ENDPOINT,
      request
    );
    return SuccessResponse(response, ResponseMethod.Update) as PatientDentalChartModel;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const DeletePatientDentalChartItem = async (
  request: PatientDentalChartModel
): Promise<void> => {
  try {
    await apiClient.delete(DELETE_DENTAL_CHART_ENDPOINT, { data: request });
    toastSuccess('Successfully Deleted!');
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const UploadPatientDentalChartImage = async (
  file: File,
  patientInfoId: string,
  toothNumber: number
): Promise<PatientDentalChartImageUploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patientInfoId', patientInfoId);
    formData.append('toothNumber', String(toothNumber));

    const response = await apiClient.post<PatientDentalChartImageUploadResponse>(
      UPLOAD_DENTAL_CHART_IMAGE_ENDPOINT,
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
