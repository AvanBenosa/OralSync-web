import { isAxiosError } from 'axios';

import {
  ExceptionResponse,
  ResponseMethod,
  SuccessResponse,
  toastSuccess,
} from '../../../common/api/responses';
import { resolveClinicId } from '../../../common/components/ClinicId';
import { apiClient } from '../../../common/services/api-client';
import {
  DentalLabCaseAttachmentUploadResponse,
  DentalLabCaseModel,
  DentalLabCaseResponseModel,
  DentalLabCaseStateModel,
} from './types';

const LAB_CASES_ENDPOINT = '/api/dmd/lab-cases/get-lab-cases';
const CREATE_LAB_CASE_ENDPOINT = '/api/dmd/lab-cases/create-lab-cases';
const UPDATE_LAB_CASE_ENDPOINT = '/api/dmd/lab-cases/put-lab-cases';
const DELETE_LAB_CASE_ENDPOINT = '/api/dmd/lab-cases/delete-lab-cases';
const UPLOAD_LAB_CASE_ATTACHMENT_ENDPOINT = '/api/dmd/lab-cases/upload-lab-case-attachment';
const DOWNLOAD_LAB_CASE_SUMMARY_ENDPOINT = '/api/dmd/lab-cases/download-lab-case-summary';

const labCasesRequestCache = new Map<string, Promise<DentalLabCaseResponseModel>>();
const labCasesResponseCache = new Map<
  string,
  {
    data: DentalLabCaseResponseModel;
    cachedAt: number;
  }
>();
const LAB_CASES_RESPONSE_CACHE_TTL_MS = 5000;

export const GetDentalLabCases = async (
  state: DentalLabCaseStateModel,
  clinicId?: string | null,
  forceRefresh: boolean = false
): Promise<DentalLabCaseResponseModel> => {
  const resolvedClinicId = resolveClinicId(clinicId);
  const query = String(state.search ?? '').trim();
  const pageStart =
    state.pageStart && state.totalItem && state.pageStart === state.totalItem
      ? state.pageStart - state.pageEnd
      : state.pageStart;
  const pageEnd = state.pageEnd;
  const status =
    state.statusFilter && state.statusFilter !== 'All' ? state.statusFilter : undefined;
  const requestKey = JSON.stringify({
    clinicId: resolvedClinicId ?? 'current-clinic',
    query: query || 'all',
    status: status || 'all',
    pageStart,
    pageEnd,
  });

  if (forceRefresh) {
    labCasesResponseCache.delete(requestKey);
  }

  const cachedResponse = labCasesResponseCache.get(requestKey);
  if (cachedResponse && Date.now() - cachedResponse.cachedAt < LAB_CASES_RESPONSE_CACHE_TTL_MS) {
    return cachedResponse.data;
  }

  const activeRequest = labCasesRequestCache.get(requestKey);
  if (activeRequest) {
    return activeRequest;
  }

  const request = (async (): Promise<DentalLabCaseResponseModel> => {
    try {
      const response = await apiClient.get<DentalLabCaseResponseModel>(LAB_CASES_ENDPOINT, {
        params: {
          ClinicId: resolvedClinicId ?? undefined,
          Que: query || 'all',
          Status: status,
          pageStart,
          pageEnd,
        },
      });

      const responseData = (SuccessResponse(response, ResponseMethod.Fetch, undefined, false) as
        | DentalLabCaseResponseModel
        | undefined) || {
        items: [],
        pageStart: 0,
        pageEnd,
        totalCount: 0,
      };

      labCasesResponseCache.set(requestKey, {
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
      labCasesRequestCache.delete(requestKey);
    }
  })();

  labCasesRequestCache.set(requestKey, request);
  return request;
};

export const CreateDentalLabCase = async (
  request: DentalLabCaseModel
): Promise<DentalLabCaseModel> => {
  try {
    const response = await apiClient.post<DentalLabCaseModel>(CREATE_LAB_CASE_ENDPOINT, request);
    return SuccessResponse(response, ResponseMethod.Create) as DentalLabCaseModel;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const UpdateDentalLabCase = async (
  request: DentalLabCaseModel
): Promise<DentalLabCaseModel> => {
  try {
    const response = await apiClient.put<DentalLabCaseModel>(UPDATE_LAB_CASE_ENDPOINT, request);
    return SuccessResponse(response, ResponseMethod.Update) as DentalLabCaseModel;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const DeleteDentalLabCase = async (request: DentalLabCaseModel): Promise<void> => {
  try {
    await apiClient.delete(DELETE_LAB_CASE_ENDPOINT, { data: request });
    toastSuccess('Successfully Deleted!');
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const UploadDentalLabCaseAttachment = async (
  file: File,
  patientInfoId: string
): Promise<DentalLabCaseAttachmentUploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patientInfoId', patientInfoId);

    const response = await apiClient.post<DentalLabCaseAttachmentUploadResponse>(
      UPLOAD_LAB_CASE_ATTACHMENT_ENDPOINT,
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

export const DownloadDentalLabCaseSummary = async (
  labCaseId: string,
  fileName?: string
): Promise<void> => {
  try {
    const response = await apiClient.get<Blob>(DOWNLOAD_LAB_CASE_SUMMARY_ENDPOINT, {
      params: {
        Id: labCaseId,
      },
      responseType: 'blob',
    });

    const blob = response.data instanceof Blob
      ? response.data
      : new Blob([response.data], { type: 'text/plain;charset=utf-8' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    anchor.download = fileName?.trim() || 'Lab Case Summary.txt';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};
