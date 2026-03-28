import { isAxiosError } from 'axios';

import {
  ExceptionResponse,
  ResponseMethod,
  SuccessResponse,
  toastSuccess,
} from '../../../../common/api/responses';
import { apiClient } from '../../../../common/services/api-client';
import { PatientAppointmentRecordModel } from './types';

const PATIENT_APPOINTMENT_RECORD_ENDPOINT =
  '/api/dmd/patient-appointment-record/get-patient-appointment-record';
const CREATE_PATIENT_APPOINTMENT_RECORD_ENDPOINT =
  '/api/dmd/patient-appointment-record/create-patient-appointment-record';
const UPDATE_PATIENT_APPOINTMENT_RECORD_ENDPOINT =
  '/api/dmd/patient-appointment-record/put-patient-appointment-record';
const DELETE_PATIENT_APPOINTMENT_RECORD_ENDPOINT =
  '/api/dmd/patient-appointment-record/delete-patient-appointment-record';
const patientAppointmentRequestCache = new Map<string, Promise<PatientAppointmentRecordModel[]>>();
const patientAppointmentResponseCache = new Map<
  string,
  {
    data: PatientAppointmentRecordModel[];
    cachedAt: number;
  }
>();
const PATIENT_APPOINTMENT_RESPONSE_CACHE_TTL_MS = 5000;

export const InvalidatePatientAppointmentRecordCache = (): void => {
  patientAppointmentRequestCache.clear();
  patientAppointmentResponseCache.clear();
};

export const GetPatientAppointmentRecordItems = async (
  patientId?: string,
  forceRefresh: boolean = false
): Promise<PatientAppointmentRecordModel[]> => {
  const requestKey = patientId?.trim() || 'current-patient';

  if (forceRefresh) {
    patientAppointmentResponseCache.delete(requestKey);
  }

  const cachedResponse = patientAppointmentResponseCache.get(requestKey);
  if (
    cachedResponse &&
    Date.now() - cachedResponse.cachedAt < PATIENT_APPOINTMENT_RESPONSE_CACHE_TTL_MS
  ) {
    return cachedResponse.data;
  }

  const activeRequest = patientAppointmentRequestCache.get(requestKey);
  if (activeRequest) {
    return activeRequest;
  }

  const request = (async (): Promise<PatientAppointmentRecordModel[]> => {
    try {
      const response = await apiClient.get<PatientAppointmentRecordModel[]>(
        PATIENT_APPOINTMENT_RECORD_ENDPOINT,
        {
          params: {
            PatientInfoId: patientId,
          },
        }
      );

      const responseData = SuccessResponse(response, ResponseMethod.Fetch, undefined, false) || [];
      patientAppointmentResponseCache.set(requestKey, {
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
      patientAppointmentRequestCache.delete(requestKey);
    }
  })();

  patientAppointmentRequestCache.set(requestKey, request);
  return request;
};

export const CreatePatientAppointmentRecordItem = async (
  request: PatientAppointmentRecordModel
): Promise<PatientAppointmentRecordModel> => {
  try {
    const response = await apiClient.post<PatientAppointmentRecordModel>(
      CREATE_PATIENT_APPOINTMENT_RECORD_ENDPOINT,
      request
    );
    return SuccessResponse(response, ResponseMethod.Create) as PatientAppointmentRecordModel;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const UpdatePatientAppointmentRecordItem = async (
  request: PatientAppointmentRecordModel
): Promise<PatientAppointmentRecordModel> => {
  try {
    const response = await apiClient.put<PatientAppointmentRecordModel>(
      UPDATE_PATIENT_APPOINTMENT_RECORD_ENDPOINT,
      request
    );
    return SuccessResponse(response, ResponseMethod.Update) as PatientAppointmentRecordModel;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const DeletePatientAppointmentRecordItem = async (
  patientInfoId: string | undefined,
  id: string | undefined
): Promise<void> => {
  try {
    await apiClient.delete(DELETE_PATIENT_APPOINTMENT_RECORD_ENDPOINT, {
      params: {
        PatientInfoId: patientInfoId,
        Id: id,
      },
      data: {
        PatientInfoId: patientInfoId,
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
