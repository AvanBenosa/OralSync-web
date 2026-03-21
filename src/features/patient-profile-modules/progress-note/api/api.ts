import { isAxiosError } from 'axios';
import {
  ExceptionResponse,
  ResponseMethod,
  SuccessResponse,
  toastSuccess,
} from '../../../../common/api/responses';
import { apiClient } from '../../../../common/services/api-client';
import { PatientProgressNoteModel } from './types';

const PROGRESS_NOTE_ENDPOINT = '/api/dmd/patient-progress-note/get-patient-progress-note';
const CREATE_PROGRESS_NOTE_ENDPOINT = '/api/dmd/patient-progress-note/create-patient-progress-note';
const UPDATE_PROGRESS_NOTE_ENDPOINT = '/api/dmd/patient-progress-note/put-patient-progress-note';
const DELETE_PROGRESS_NOTE_ENDPOINT = '/api/dmd/patient-progress-note/delete-patient-progress-note';
const progressNoteRequestCache = new Map<string, Promise<PatientProgressNoteModel[]>>();
const progressNoteResponseCache = new Map<
  string,
  {
    data: PatientProgressNoteModel[];
    cachedAt: number;
  }
>();
const PROGRESS_NOTE_RESPONSE_CACHE_TTL_MS = 5000;

export const GetPatientProgressNoteItems = async (
  patientId?: string,
  forceRefresh: boolean = false
): Promise<PatientProgressNoteModel[]> => {
  const requestKey = patientId?.trim() ? `patient:${patientId.trim()}` : 'clinic-progress-notes';

  if (forceRefresh) {
    progressNoteResponseCache.delete(requestKey);
  }

  const cachedResponse = progressNoteResponseCache.get(requestKey);
  if (
    cachedResponse &&
    Date.now() - cachedResponse.cachedAt < PROGRESS_NOTE_RESPONSE_CACHE_TTL_MS
  ) {
    return cachedResponse.data;
  }

  const activeRequest = progressNoteRequestCache.get(requestKey);
  if (activeRequest) {
    return activeRequest;
  }

  const request = (async (): Promise<PatientProgressNoteModel[]> => {
    try {
      const response = await apiClient.get<PatientProgressNoteModel[]>(PROGRESS_NOTE_ENDPOINT, {
        params: patientId?.trim()
          ? {
              PatientInfoId: patientId,
            }
          : undefined,
      });

      const responseData = SuccessResponse(response, ResponseMethod.Fetch, undefined, false) || [];
      progressNoteResponseCache.set(requestKey, {
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
      progressNoteRequestCache.delete(requestKey);
    }
  })();

  progressNoteRequestCache.set(requestKey, request);
  return request;
};

export const CreatePatientProgressNoteItem = async (
  request: PatientProgressNoteModel
): Promise<PatientProgressNoteModel> => {
  try {
    const response = await apiClient.post<PatientProgressNoteModel>(
      CREATE_PROGRESS_NOTE_ENDPOINT,
      request
    );
    return SuccessResponse(response, ResponseMethod.Create) as PatientProgressNoteModel;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const UpdatePatientProgressNoteItem = async (
  request: PatientProgressNoteModel
): Promise<PatientProgressNoteModel> => {
  try {
    const response = await apiClient.put<PatientProgressNoteModel>(
      UPDATE_PROGRESS_NOTE_ENDPOINT,
      request
    );
    return SuccessResponse(response, ResponseMethod.Update) as PatientProgressNoteModel;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const DeletePatientProgressNoteItem = async (
  patientInfoId: string | undefined,
  Id: string | undefined
): Promise<void> => {
  try {
    await apiClient.delete(DELETE_PROGRESS_NOTE_ENDPOINT, {
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
