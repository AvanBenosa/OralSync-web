import { apiClient } from '../../../common/services/api-client';
import {
  ExceptionResponse,
  ResponseMethod,
  SuccessResponse,
  toastSuccess,
} from '../../../common/api/responses';
import {
  PatientModel,
  PatientResponseModel,
  PatientStateModel,
  PatientUploadResultModel,
} from './types';
import { isAxiosError } from 'axios';
import { resolveClinicId } from '../../../common/components/ClinicId';
import { useAuthStore } from '../../../common/store/authStore';

const PATIENT_ENDPOINT = '/api/dmd/patient/get-patient';
const CREATE_PATIENT_ENDPOINT = '/api/dmd/patient/create-patient';
const UPDATE_PATIENT_ENDPOINT = '/api/dmd/patient/put-patient';
const DELETE_PATIENT_ENDPOINT = '/api/dmd/patient/delete-patient';
const UPLOAD_PROFILE_PICTURE_ENDPOINT = '/api/dmd/patient/upload-profile-picture';
const UPLOAD_PATIENT_XLSX_ENDPOINT = '/api/dmd/patient/upload-patient-xlsx';
const patientRequestCache = new Map<string, Promise<PatientResponseModel>>();
const patientResponseCache = new Map<
  string,
  {
    data: PatientResponseModel;
    cachedAt: number;
  }
>();
const PATIENT_RESPONSE_CACHE_TTL_MS = 5000;

export type ProfilePictureUploadResponse = {
  fileName: string;
  filePath: string;
};

export const GetPatients = async (
  state: PatientStateModel,
  clinicId?: string | null,
  forceRefresh: boolean = false
): Promise<PatientResponseModel> => {
  const resolvedClinicId = resolveClinicId(clinicId);
  const query = String(state.search ?? '').trim();
  const pageStart =
    state.pageStart && state.totalItem && state.pageStart === state.totalItem
      ? state.pageStart - state.pageEnd
      : state.pageStart;
  const pageEnd = state.pageEnd;
  const branchId = useAuthStore.getState().branchId?.trim() || '';
  const requestKey = JSON.stringify({
    clinicId: resolvedClinicId ?? 'current-clinic',
    branchId: branchId || 'all-branches',
    query: query || 'all',
    pageStart,
    pageEnd,
  });

  if (forceRefresh) {
    patientResponseCache.delete(requestKey);
  }

  const cachedResponse = patientResponseCache.get(requestKey);
  if (cachedResponse && Date.now() - cachedResponse.cachedAt < PATIENT_RESPONSE_CACHE_TTL_MS) {
    return cachedResponse.data;
  }

  const activeRequest = patientRequestCache.get(requestKey);
  if (activeRequest) {
    return activeRequest;
  }

  const request = (async (): Promise<PatientResponseModel> => {
    try {
      const response = await apiClient.get<PatientResponseModel>(PATIENT_ENDPOINT, {
        params: {
          ClinicId: resolvedClinicId ?? undefined,
          BranchId: branchId || undefined,
          Que: query || 'all',
          pageStart,
          pageEnd,
        },
      });

      const responseData =
        SuccessResponse(response, ResponseMethod.Fetch, undefined, false) || {
          items: [],
          pageStart: 0,
          pageEnd,
          totalCount: 0,
        };

      patientResponseCache.set(requestKey, {
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
      patientRequestCache.delete(requestKey);
    }
  })();

  patientRequestCache.set(requestKey, request);
  return request;
};

export const CreatePatient = async (request: PatientModel): Promise<PatientModel> => {
  try {
    const branchId = useAuthStore.getState().branchId?.trim() || undefined;
    const response = await apiClient.post<PatientModel>(CREATE_PATIENT_ENDPOINT, {
      ...request,
      BranchId: branchId,
    });
    return SuccessResponse(response, ResponseMethod.Create) as PatientModel;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const UpdatePatient = async (request: PatientModel): Promise<PatientModel> => {
  try {
    const response = await apiClient.put<PatientModel>(UPDATE_PATIENT_ENDPOINT, request);
    return SuccessResponse(response, ResponseMethod.Update) as PatientModel;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const DeletePatient = async (request: PatientModel): Promise<void> => {
  try {
    await apiClient.delete(DELETE_PATIENT_ENDPOINT, { data: request });
    toastSuccess('Successfully Deleted!');
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const UploadPatientProfilePicture = async (
  file: File,
  oldFilePath?: string
): Promise<ProfilePictureUploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (oldFilePath?.trim()) {
      formData.append('oldFilePath', oldFilePath);
    }

    const response = await apiClient.post<ProfilePictureUploadResponse>(
      UPLOAD_PROFILE_PICTURE_ENDPOINT,
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

export const UploadPatientXlsx = async (file: File): Promise<PatientUploadResultModel> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<PatientUploadResultModel>(
      UPLOAD_PATIENT_XLSX_ENDPOINT,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return SuccessResponse(response, ResponseMethod.Uploaded) as PatientUploadResultModel;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};
